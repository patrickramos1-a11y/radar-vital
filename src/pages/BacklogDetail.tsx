import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Save, 
  Trash2, 
  Coins, 
  Calendar,
  User,
  Wrench,
  Clock,
  Paperclip,
  History,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { BacklogHistory } from '@/components/backlog/BacklogHistory';
import { BacklogAttachments } from '@/components/backlog/BacklogAttachments';
import { BacklogImplementations } from '@/components/backlog/BacklogImplementations';
import { BacklogChat } from '@/components/backlog/BacklogChat';
import { useBacklog, useBacklogItem } from '@/hooks/useBacklog';
import { useBacklogMessages } from '@/hooks/useBacklogMessages';
import type { 
  BacklogStatus, 
  BacklogCategory, 
  BacklogModule, 
  BacklogPriority, 
  BacklogImpact, 
  BacklogEffort 
} from '@/types/backlog';
import {
  BACKLOG_STATUS_LABELS,
  BACKLOG_STATUS_COLORS,
  BACKLOG_CATEGORY_LABELS,
  BACKLOG_MODULE_LABELS,
  BACKLOG_PRIORITY_LABELS,
  BACKLOG_IMPACT_LABELS,
  BACKLOG_EFFORT_LABELS
} from '@/types/backlog';

export default function BacklogDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { updateItem, deleteItem, isUpdating, isDeleting } = useBacklog();
  const { 
    item, 
    history, 
    attachments, 
    implementations, 
    isLoading,
    uploadAttachment,
    deleteAttachment,
    addImplementation,
    updateImplementation,
    deleteImplementation
  } = useBacklogItem(id);

  const { messages, isLoading: messagesLoading, sendMessage, editMessage, deleteMessage: deleteMsg } = useBacklogMessages(id);

  // Local edit state
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize state when item loads
  useState(() => {
    if (item) {
      setTitulo(item.titulo);
      setDescricao(item.descricao_detalhada || '');
    }
  });

  // Update local state when item changes
  if (item && titulo === '' && item.titulo) {
    setTitulo(item.titulo);
    setDescricao(item.descricao_detalhada || '');
  }

  const handleSave = async () => {
    if (!item) return;
    await updateItem(item.id, {
      titulo,
      descricao_detalhada: descricao
    }, item);
    setHasChanges(false);
  };

  const handleStatusChange = async (newStatus: BacklogStatus) => {
    if (!item) return;
    await updateItem(item.id, { status_backlog: newStatus }, item);
  };

  const handleFieldChange = async (field: string, value: string | boolean | null) => {
    if (!item) return;
    await updateItem(item.id, { [field]: value } as any, item);
  };

  const handleModulesChange = async (mod: BacklogModule) => {
    if (!item) return;
    const newModules = item.modulos_impactados.includes(mod)
      ? item.modulos_impactados.filter(m => m !== mod)
      : [...item.modulos_impactados, mod];
    await updateItem(item.id, { modulos_impactados: newModules }, item);
  };

  const handleDelete = async () => {
    if (!item) return;
    await deleteItem(item.id);
    navigate('/backlog');
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  if (!item) {
    return (
      <AppLayout>
        <div className="p-6 text-center">
          <h1 className="text-xl font-semibold text-foreground">Item não encontrado</h1>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/backlog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Backlog
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/backlog')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <Input
                value={titulo}
                onChange={(e) => {
                  setTitulo(e.target.value);
                  setHasChanges(true);
                }}
                className="text-xl font-bold border-0 p-0 h-auto focus-visible:ring-0 bg-transparent"
                placeholder="Título do item"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {BACKLOG_CATEGORY_LABELS[item.categoria]} • Criado em {format(new Date(item.data_criacao), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button onClick={handleSave} disabled={isUpdating}>
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir item?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O item e todo seu histórico serão permanentemente removidos.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg">
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
            <Select value={item.status_backlog} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${BACKLOG_STATUS_COLORS[item.status_backlog]}`} />
                    {BACKLOG_STATUS_LABELS[item.status_backlog]}
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(BACKLOG_STATUS_LABELS) as BacklogStatus[]).map((status) => (
                  <SelectItem key={status} value={status}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${BACKLOG_STATUS_COLORS[status]}`} />
                      {BACKLOG_STATUS_LABELS[status]}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 px-4 border-l border-border">
            <Coins className="w-4 h-4 text-amber-500" />
            <Label htmlFor="creditos-switch" className="text-sm">Créditos</Label>
            <Switch
              id="creditos-switch"
              checked={item.dependente_de_creditos}
              onCheckedChange={(checked) => handleFieldChange('dependente_de_creditos', checked)}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Descrição Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={descricao}
                  onChange={(e) => {
                    setDescricao(e.target.value);
                    setHasChanges(true);
                  }}
                  placeholder="## Contexto / Problema&#10;&#10;## Objetivo da melhoria&#10;&#10;## Comportamento esperado"
                  className="min-h-[300px] font-mono text-sm"
                />
              </CardContent>
            </Card>

            {/* Tabs for Attachments, Implementations, History */}
            <Tabs defaultValue="attachments">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="attachments" className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  Anexos ({attachments.length})
                </TabsTrigger>
                <TabsTrigger value="implementations" className="flex items-center gap-2">
                  <Wrench className="w-4 h-4" />
                  Impl. ({implementations.length})
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Conversa ({messages.length})
                </TabsTrigger>
                <TabsTrigger value="history" className="flex items-center gap-2">
                  <History className="w-4 h-4" />
                  Histórico ({history.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="attachments" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <BacklogAttachments
                      attachments={attachments}
                      onUpload={uploadAttachment}
                      onDelete={deleteAttachment}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="implementations" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <BacklogImplementations
                      implementations={implementations}
                      onAdd={addImplementation}
                      onUpdate={updateImplementation}
                      onDelete={deleteImplementation}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chat" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <BacklogChat
                      messages={messages}
                      isLoading={messagesLoading}
                      onSend={sendMessage}
                      onEdit={editMessage}
                      onDelete={deleteMsg}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <BacklogHistory history={history} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Modules */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Módulos Impactados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(BACKLOG_MODULE_LABELS) as BacklogModule[]).map((mod) => (
                    <Badge
                      key={mod}
                      variant={item.modulos_impactados.includes(mod) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => handleModulesChange(mod)}
                    >
                      {BACKLOG_MODULE_LABELS[mod]}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority & Effort */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Classificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Categoria</Label>
                  <Select 
                    value={item.categoria} 
                    onValueChange={(v) => handleFieldChange('categoria', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(BACKLOG_CATEGORY_LABELS) as BacklogCategory[]).map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {BACKLOG_CATEGORY_LABELS[cat]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Prioridade</Label>
                  <Select 
                    value={item.prioridade} 
                    onValueChange={(v) => handleFieldChange('prioridade', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(BACKLOG_PRIORITY_LABELS) as BacklogPriority[]).map((pri) => (
                        <SelectItem key={pri} value={pri}>
                          {BACKLOG_PRIORITY_LABELS[pri]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Impacto Esperado</Label>
                  <Select 
                    value={item.impacto_esperado} 
                    onValueChange={(v) => handleFieldChange('impacto_esperado', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(BACKLOG_IMPACT_LABELS) as BacklogImpact[]).map((imp) => (
                        <SelectItem key={imp} value={imp}>
                          {BACKLOG_IMPACT_LABELS[imp]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Estimativa de Esforço</Label>
                  <Select 
                    value={item.estimativa_esforco} 
                    onValueChange={(v) => handleFieldChange('estimativa_esforco', v)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(BACKLOG_EFFORT_LABELS) as BacklogEffort[]).map((eff) => (
                        <SelectItem key={eff} value={eff}>
                          {BACKLOG_EFFORT_LABELS[eff]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Datas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Criação</Label>
                  <p className="text-sm font-medium">
                    {format(new Date(item.data_criacao), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </p>
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Início Implementação</Label>
                  <Input
                    type="date"
                    value={item.data_inicio_implementacao || ''}
                    onChange={(e) => handleFieldChange('data_inicio_implementacao', e.target.value || null)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Conclusão</Label>
                  <Input
                    type="date"
                    value={item.data_conclusao || ''}
                    onChange={(e) => handleFieldChange('data_conclusao', e.target.value || null)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Lançamento</Label>
                  <Input
                    type="date"
                    value={item.data_lancamento || ''}
                    onChange={(e) => handleFieldChange('data_lancamento', e.target.value || null)}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Responsáveis */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Responsáveis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Produto</Label>
                  <Input
                    value={item.responsavel_produto}
                    onChange={(e) => handleFieldChange('responsavel_produto', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-xs text-muted-foreground">Técnico</Label>
                  <Input
                    value={item.responsavel_tecnico || ''}
                    onChange={(e) => handleFieldChange('responsavel_tecnico', e.target.value || null)}
                    placeholder="Opcional"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
