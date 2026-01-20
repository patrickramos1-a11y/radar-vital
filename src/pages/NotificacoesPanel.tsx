import { useState, useMemo } from 'react';
import { Bell, Upload, Search, Filter, CheckCircle, AlertCircle, Calendar, Building2, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useClients } from '@/contexts/ClientContext';
import { NotificationImportWizard } from '@/components/import/NotificationImportWizard';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  client_id: string | null;
  empresa_excel: string;
  numero_processo: string | null;
  numero_notificacao: string;
  descricao: string | null;
  data_recebimento: string | null;
  status: string;
  created_at: string;
}

type StatusFilter = 'all' | 'PENDENTE' | 'ATENDIDA';

export default function NotificacoesPanel() {
  const { clients } = useClients();
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');

  // Fetch notifications from database
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('data_recebimento', { ascending: false });
      
      if (error) throw error;
      return data as Notification[];
    },
  });

  // Get unique clients that have notifications
  const clientsWithNotifications = useMemo(() => {
    const clientIds = new Set(notifications.map(n => n.client_id).filter(Boolean));
    return clients.filter(c => clientIds.has(c.id));
  }, [notifications, clients]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      // Status filter
      if (statusFilter !== 'all' && n.status !== statusFilter) return false;
      
      // Client filter
      if (clientFilter !== 'all' && n.client_id !== clientFilter) return false;
      
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesEmpresa = n.empresa_excel.toLowerCase().includes(search);
        const matchesNotificacao = n.numero_notificacao.toLowerCase().includes(search);
        const matchesDescricao = n.descricao?.toLowerCase().includes(search);
        const matchesProcesso = n.numero_processo?.toLowerCase().includes(search);
        
        if (!matchesEmpresa && !matchesNotificacao && !matchesDescricao && !matchesProcesso) {
          return false;
        }
      }
      
      return true;
    });
  }, [notifications, statusFilter, clientFilter, searchTerm]);

  // Summary statistics
  const stats = useMemo(() => {
    const total = notifications.length;
    const pendentes = notifications.filter(n => n.status === 'PENDENTE').length;
    const atendidas = notifications.filter(n => n.status === 'ATENDIDA').length;
    const empresasComPendentes = new Set(
      notifications.filter(n => n.status === 'PENDENTE').map(n => n.empresa_excel)
    ).size;
    
    return { total, pendentes, atendidas, empresasComPendentes };
  }, [notifications]);

  // Group by client for summary view
  const clientSummaries = useMemo(() => {
    const summaryMap = new Map<string, {
      clientId: string | null;
      empresaExcel: string;
      clientName: string | null;
      total: number;
      pendentes: number;
      atendidas: number;
      ultimaNotificacao: string | null;
    }>();

    for (const notif of notifications) {
      const key = notif.client_id || notif.empresa_excel;
      const existing = summaryMap.get(key);
      const client = notif.client_id ? clients.find(c => c.id === notif.client_id) : null;

      if (existing) {
        existing.total++;
        if (notif.status === 'PENDENTE') existing.pendentes++;
        if (notif.status === 'ATENDIDA') existing.atendidas++;
        if (notif.data_recebimento && (!existing.ultimaNotificacao || notif.data_recebimento > existing.ultimaNotificacao)) {
          existing.ultimaNotificacao = notif.data_recebimento;
        }
      } else {
        summaryMap.set(key, {
          clientId: notif.client_id,
          empresaExcel: notif.empresa_excel,
          clientName: client?.name || null,
          total: 1,
          pendentes: notif.status === 'PENDENTE' ? 1 : 0,
          atendidas: notif.status === 'ATENDIDA' ? 1 : 0,
          ultimaNotificacao: notif.data_recebimento,
        });
      }
    }

    return Array.from(summaryMap.values()).sort((a, b) => b.pendentes - a.pendentes);
  }, [notifications, clients]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      return format(new Date(dateStr), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  const getClientName = (notification: Notification) => {
    if (notification.client_id) {
      const client = clients.find(c => c.id === notification.client_id);
      return client?.name || notification.empresa_excel;
    }
    return notification.empresa_excel;
  };

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Notificações</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie notificações ambientais e administrativas
              </p>
            </div>
          </div>
          <Button onClick={() => setIsImportOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Importar Planilha
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-500">{stats.pendentes}</div>
                  <div className="text-xs text-muted-foreground">Pendentes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-500">{stats.atendidas}</div>
                  <div className="text-xs text-muted-foreground">Atendidas</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-500/10 rounded-lg">
                  <Building2 className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-500">{stats.empresasComPendentes}</div>
                  <div className="text-xs text-muted-foreground">Empresas c/ Pendências</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa, notificação, descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="PENDENTE">Pendentes</SelectItem>
              <SelectItem value="ATENDIDA">Atendidas</SelectItem>
            </SelectContent>
          </Select>

          <Select value={clientFilter} onValueChange={setClientFilter}>
            <SelectTrigger className="w-[220px]">
              <Building2 className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Empresa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Empresas</SelectItem>
              {clientsWithNotifications.map(client => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Client Summaries */}
        {statusFilter === 'all' && clientFilter === 'all' && !searchTerm && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Resumo por Empresa
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {clientSummaries.slice(0, 9).map((summary) => (
                  <div 
                    key={summary.clientId || summary.empresaExcel}
                    className={`p-3 rounded-lg border ${
                      summary.pendentes > 0 
                        ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20' 
                        : 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm truncate">
                        {summary.clientName || summary.empresaExcel}
                      </span>
                      <Badge variant={summary.pendentes > 0 ? 'destructive' : 'secondary'} className="text-xs">
                        {summary.total}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-amber-600">{summary.pendentes} pendentes</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-emerald-600">{summary.atendidas} atendidas</span>
                    </div>
                    {summary.ultimaNotificacao && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Última: {formatDate(summary.ultimaNotificacao)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notificações ({filteredNotifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Nenhuma notificação encontrada</p>
                <p className="text-sm mt-1">Importe uma planilha para começar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Empresa</th>
                      <th className="text-left py-3 px-2 font-medium">Nº Notificação</th>
                      <th className="text-left py-3 px-2 font-medium">Descrição</th>
                      <th className="text-left py-3 px-2 font-medium">Data Recebimento</th>
                      <th className="text-left py-3 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNotifications.map((notif) => (
                      <tr key={notif.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">
                          {getClientName(notif)}
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {notif.numero_notificacao}
                        </td>
                        <td className="py-3 px-2 max-w-[300px] truncate text-muted-foreground">
                          {notif.descricao || '—'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="w-3 h-3" />
                            {formatDate(notif.data_recebimento)}
                          </div>
                        </td>
                        <td className="py-3 px-2">
                          <Badge 
                            variant={notif.status === 'PENDENTE' ? 'destructive' : 'secondary'}
                            className={notif.status === 'ATENDIDA' ? 'bg-emerald-500 text-white' : ''}
                          >
                            {notif.status === 'PENDENTE' ? 'Pendente' : 'Atendida'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Import Wizard */}
        <NotificationImportWizard
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          clients={clients}
          onImportComplete={() => refetch()}
        />
      </div>
    </AppLayout>
  );
}
