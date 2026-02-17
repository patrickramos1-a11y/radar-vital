import { useState, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowLeft, Plus, Pencil, Trash2, Star, Eye, EyeOff, Upload, X, 
  AlertTriangle, CheckSquare, ChevronUp, ChevronDown, RefreshCw,
  Download, FolderUp, RotateCcw, MapPin, Search, Check
} from "lucide-react";
import { useClients } from "@/contexts/ClientContext";
import { 
  Client, ClientFormData, generateInitials,
  COLLABORATOR_NAMES, COLLABORATOR_COLORS, CollaboratorName, DEFAULT_COLLABORATORS
} from "@/types/client";
import { useMunicipalities } from "@/hooks/useMunicipalities";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const Config = () => {
  const { 
    clients, 
    addClient, 
    updateClient, 
    deleteClient, 
    deleteSelectedClients, 
    clearAllClients, 
    toggleClientActive,
    toggleClientType,
    moveClient,
    moveClientToPosition,
    reorderClients,
    exportData,
    importData,
    resetToDefault,
  } = useClients();
  
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showDeleteSelectedDialog, setShowDeleteSelectedDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(new Set());
  const [moveToPositionId, setMoveToPositionId] = useState<string | null>(null);
  const [moveToPositionValue, setMoveToPositionValue] = useState<string>("");
  
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (data: ClientFormData) => {
    if (editingClient) {
      updateClient(editingClient.id, data);
      setEditingClient(null);
      toast.success("Cliente atualizado com sucesso!");
    } else {
      addClient(data);
      setIsCreating(false);
      toast.success("Cliente cadastrado com sucesso!");
    }
  };

  const handleCancel = () => {
    setEditingClient(null);
    setIsCreating(false);
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteClient(deleteConfirmId);
      setDeleteConfirmId(null);
      toast.success("Cliente excluído!");
    }
  };

  const handleClearAll = () => {
    clearAllClients();
    setShowClearAllDialog(false);
    toast.success("Todos os clientes foram excluídos!");
  };

  const handleDeleteSelected = () => {
    deleteSelectedClients(Array.from(selectedForDelete));
    setSelectedForDelete(new Set());
    setShowDeleteSelectedDialog(false);
    toast.success(`${selectedForDelete.size} clientes excluídos!`);
  };

  const handleReset = () => {
    resetToDefault();
    setShowResetDialog(false);
    toast.success("Dados restaurados para as empresas padrão!");
  };

  const toggleSelectForDelete = (id: string) => {
    setSelectedForDelete(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAllForDelete = () => {
    if (selectedForDelete.size === clients.length) {
      setSelectedForDelete(new Set());
    } else {
      setSelectedForDelete(new Set(clients.map(c => c.id)));
    }
  };

  // Export JSON
  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `painel-ac-clientes-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Configuração exportada com sucesso!");
  };

  // Import JSON
  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importData(content);
      if (success) {
        toast.success("Configuração importada com sucesso!");
      } else {
        toast.error("Erro ao importar: arquivo inválido");
      }
    };
    reader.readAsText(file);
    
    // Reset input
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  const sortedClients = [...clients].sort((a, b) => a.order - b.order);
  const activeCount = clients.filter(c => c.isActive).length;

  const handleMoveToPosition = (id: string) => {
    const position = parseInt(moveToPositionValue);
    if (!isNaN(position) && position >= 1) {
      moveClientToPosition(id, position);
      setMoveToPositionId(null);
      setMoveToPositionValue("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-header-bg border-b border-header-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Voltar ao Painel</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <h1 className="text-xl font-bold text-foreground">Configuração de Clientes</h1>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            {/* Import/Export JSON */}
            <input
              ref={importInputRef}
              type="file"
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <button
              onClick={handleImportClick}
              className="admin-button-secondary flex items-center gap-2"
              title="Importar configuração de arquivo JSON"
            >
              <FolderUp className="w-4 h-4" />
              Importar JSON
            </button>
            <button
              onClick={handleExport}
              className="admin-button-secondary flex items-center gap-2"
              title="Exportar configuração para arquivo JSON"
            >
              <Download className="w-4 h-4" />
              Exportar JSON
            </button>

            <div className="h-6 w-px bg-border mx-1" />

            {/* Reset to Default */}
            <button
              onClick={() => setShowResetDialog(true)}
              className="admin-button flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
              title="Restaurar lista de empresas padrão"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar Padrão
            </button>

            {/* Clear Data Actions */}
            {clients.length > 0 && !isCreating && !editingClient && (
              <>
                {selectedForDelete.size > 0 && (
                  <button
                    onClick={() => setShowDeleteSelectedDialog(true)}
                    className="admin-button-danger flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir Selecionados ({selectedForDelete.size})
                  </button>
                )}
                <button
                  onClick={() => setShowClearAllDialog(true)}
                  className="admin-button flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Limpar Todos
                </button>
              </>
            )}
            
            {!isCreating && !editingClient && (
              <button
                onClick={() => setIsCreating(true)}
                className="admin-button-primary flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Novo Cliente
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Municipality Manager */}
        <MunicipalityManager />

        {/* Form for Create/Edit */}
        {(isCreating || editingClient) && (
          <div className="mb-6">
            <ClientForm
              client={editingClient}
              onSave={handleSave}
              onCancel={handleCancel}
              nextOrder={clients.length + 1}
            />
          </div>
        )}

        {/* Client List */}
        <div className="admin-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Clientes Cadastrados ({clients.length})
              </h2>
              <p className="text-sm text-muted-foreground">
                {activeCount} ativos no painel • {clients.length - activeCount} ocultos
              </p>
            </div>
            <div className="flex items-center gap-2">
              {clients.length > 0 && !isCreating && !editingClient && (
                <>
                  <button
                    onClick={reorderClients}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                    title="Reorganizar numeração sequencial"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reorganizar Ordem
                  </button>
                  <button
                    onClick={selectAllForDelete}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    {selectedForDelete.size === clients.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </>
              )}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 text-sm font-medium text-muted-foreground w-8">
                    <input 
                      type="checkbox" 
                      checked={selectedForDelete.size === clients.length && clients.length > 0}
                      onChange={selectAllForDelete}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground text-center">Ordem</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Logo</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground">Nome</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground text-center">Tipo</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground text-center">Equipe</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground text-center">Equipe</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground text-center">★</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground text-center">Ativo</th>
                  <th className="pb-3 text-sm font-medium text-muted-foreground text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sortedClients.map((client, index) => (
                  <tr key={client.id} className={`border-b border-border/50 ${!client.isActive ? 'opacity-50 bg-muted/30' : ''} ${selectedForDelete.has(client.id) ? 'bg-destructive/5' : ''}`}>
                    <td className="py-3">
                      <input 
                        type="checkbox" 
                        checked={selectedForDelete.has(client.id)}
                        onChange={() => toggleSelectForDelete(client.id)}
                        className="rounded border-border"
                      />
                    </td>
                    {/* Order controls */}
                    <td className="py-3">
                      <div className="flex items-center gap-1">
                        <div className="flex flex-col">
                          <button
                            onClick={() => moveClient(client.id, 'up')}
                            disabled={index === 0}
                            className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para cima"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => moveClient(client.id, 'down')}
                            disabled={index === sortedClients.length - 1}
                            className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Mover para baixo"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {moveToPositionId === client.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={moveToPositionValue}
                              onChange={(e) => setMoveToPositionValue(e.target.value)}
                              className="w-12 px-1 py-0.5 text-xs border border-border rounded text-center"
                              placeholder="#"
                              min={1}
                              max={clients.length}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleMoveToPosition(client.id);
                                if (e.key === 'Escape') {
                                  setMoveToPositionId(null);
                                  setMoveToPositionValue("");
                                }
                              }}
                            />
                            <button
                              onClick={() => handleMoveToPosition(client.id)}
                              className="text-xs text-primary hover:underline"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setMoveToPositionId(client.id);
                              setMoveToPositionValue(client.order.toString());
                            }}
                            className="text-sm font-medium text-foreground hover:text-primary min-w-[24px] text-center"
                            title="Clique para mover para posição específica"
                          >
                            {client.order}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      {client.logoUrl ? (
                        <img src={client.logoUrl} alt="" className="w-8 h-8 object-contain rounded" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                          {client.initials}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-sm font-medium text-foreground">{client.name}</td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => toggleClientType(client.id)}
                        className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${
                          client.clientType === 'AC' 
                            ? 'bg-emerald-500/20 text-emerald-600 hover:bg-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-600 hover:bg-amber-500/30'
                        }`}
                        title={client.clientType === 'AC' ? 'Acompanhamento - clique para mudar para Avulso' : 'Avulso - clique para mudar para Acompanhamento'}
                      >
                        {client.clientType}
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        {COLLABORATOR_NAMES.map((name) => (
                          <span
                            key={name}
                            className={`w-5 h-5 rounded-full text-[8px] font-bold flex items-center justify-center`}
                            style={{
                              backgroundColor: client.collaborators[name] ? COLLABORATOR_COLORS[name] : 'transparent',
                              color: client.collaborators[name] ? '#fff' : COLLABORATOR_COLORS[name],
                              border: `1px solid ${COLLABORATOR_COLORS[name]}`,
                            }}
                            title={name.charAt(0).toUpperCase() + name.slice(1)}
                          >
                            {name.charAt(0).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      {client.isPriority && <Star className="w-4 h-4 text-yellow-500 fill-current mx-auto" />}
                    </td>
                    <td className="py-3 text-center">
                      <button
                        onClick={() => toggleClientActive(client.id)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          client.isActive 
                            ? 'text-primary hover:bg-primary/10' 
                            : 'text-muted-foreground hover:bg-muted'
                        }`}
                        title={client.isActive ? 'Clique para ocultar do painel' : 'Clique para mostrar no painel'}
                      >
                        {client.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setEditingClient(client)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(client.id)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="w-5 h-5" />
              Limpar Todos os Dados
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>TODOS</strong> os {clients.length} clientes cadastrados? 
              Esta ação não pode ser desfeita e você perderá todos os dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-orange-500 text-white hover:bg-orange-600">
              Sim, Limpar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Selected Confirmation Dialog */}
      <AlertDialog open={showDeleteSelectedDialog} onOpenChange={setShowDeleteSelectedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Clientes Selecionados</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir os {selectedForDelete.size} clientes selecionados? 
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSelected} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir Selecionados
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset to Default Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-blue-600">
              <RotateCcw className="w-5 h-5" />
              Restaurar Empresas Padrão
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isso substituirá todos os dados atuais pelas 39 empresas padrão com valores zerados.
              Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} className="bg-blue-500 text-white hover:bg-blue-600">
              Sim, Restaurar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Client Form Component
interface ClientFormProps {
  client: Client | null;
  onSave: (data: ClientFormData) => void;
  onCancel: () => void;
  nextOrder: number;
}

function ClientForm({ client, onSave, onCancel, nextOrder }: ClientFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ClientFormData>({
    name: client?.name || '',
    initials: client?.initials || '',
    logoUrl: client?.logoUrl || '',
    isPriority: client?.isPriority || false,
    isActive: client?.isActive ?? true,
    isChecked: client?.isChecked || false,
    isHighlighted: client?.isHighlighted || false,
    clientType: client?.clientType || 'AC',
    order: client?.order || nextOrder,
    processes: client?.processes || 0,
    processBreakdown: client?.processBreakdown || { total: 0, deferido: 0, emAnaliseOrgao: 0, emAnaliseRamos: 0, notificado: 0, reprovado: 0 },
    licenses: client?.licenses || 0,
    licenseBreakdown: client?.licenseBreakdown || { validas: 0, proximoVencimento: 0, foraValidade: 0, proximaDataVencimento: null },
    demands: client?.demands || { completed: 0, inProgress: 0, notStarted: 0, cancelled: 0 },
    demandsByCollaborator: client?.demandsByCollaborator || { celine: 0, gabi: 0, darley: 0, vanessa: 0 },
    collaborators: client?.collaborators || DEFAULT_COLLABORATORS,
    municipios: client?.municipios || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        ...formData,
        initials: formData.initials || generateInitials(formData.name),
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setFormData(prev => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const toggleCollaborator = (name: CollaboratorName) => {
    setFormData(prev => ({
      ...prev,
      collaborators: {
        ...prev.collaborators,
        [name]: !prev.collaborators[name],
      },
    }));
  };


  return (
    <form onSubmit={handleSubmit} className="admin-card">
      <h2 className="text-lg font-semibold text-foreground mb-4">
        {client ? 'Editar Cliente' : 'Novo Cliente'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Nome */}
        <div className="lg:col-span-2">
          <label className="admin-label">Nome da Empresa *</label>
          <input
            type="text"
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`admin-input ${errors.name ? 'border-destructive' : ''}`}
            placeholder="Ex: PHS DA MATA"
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        {/* Sigla */}
        <div>
          <label className="admin-label">Sigla (2 letras)</label>
          <input
            type="text"
            value={formData.initials}
            onChange={e => setFormData(prev => ({ ...prev, initials: e.target.value.toUpperCase().slice(0, 2) }))}
            className="admin-input"
            placeholder="PH"
            maxLength={2}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Deixe vazio para gerar automaticamente
          </p>
        </div>

        {/* Logo Upload */}
        <div className="lg:col-span-3">
          <label className="admin-label">Logo</label>
          <div className="flex items-center gap-4">
            {formData.logoUrl ? (
              <div className="relative">
                <img src={formData.logoUrl} alt="Preview" className="w-16 h-16 object-contain rounded-lg border border-border" />
                <button
                  type="button"
                  onClick={removeLogo}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground">
                <Upload className="w-6 h-6" />
              </div>
            )}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={handleFileChange}
                className="hidden"
                id="logo-upload"
              />
              <label
                htmlFor="logo-upload"
                className="admin-button-secondary cursor-pointer inline-block"
              >
                {formData.logoUrl ? 'Trocar Logo' : 'Enviar Logo'}
              </label>
              <p className="text-xs text-muted-foreground mt-1">PNG, JPG ou SVG</p>
            </div>
          </div>
        </div>

        {/* Ordem */}
        <div>
          <label className="admin-label">Ordem/Posição</label>
          <input
            type="number"
            value={formData.order}
            onChange={e => setFormData(prev => ({ ...prev, order: parseInt(e.target.value) || 0 }))}
            className="admin-input"
            min={1}
          />
        </div>

        <div className="lg:col-span-3">
          <label className="admin-label">Equipe / Colaboradores</label>
          <div className="flex items-center gap-3">
            {COLLABORATOR_NAMES.map((name) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.collaborators[name]}
                  onChange={() => toggleCollaborator(name)}
                  className="w-4 h-4 rounded border-border"
                  style={{ accentColor: COLLABORATOR_COLORS[name] }}
                />
                <span 
                  className="text-sm font-medium"
                  style={{ color: COLLABORATOR_COLORS[name] }}
                >
                  {name.charAt(0).toUpperCase() + name.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Municípios */}
        <div className="lg:col-span-3">
          <label className="admin-label">Municípios</label>
          <MunicipiosInput
            value={formData.municipios}
            onChange={(municipios) => setFormData(prev => ({ ...prev, municipios }))}
          />
        </div>

        {/* Toggles */}
        <div className="lg:col-span-3 flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPriority}
              onChange={e => setFormData(prev => ({ ...prev, isPriority: e.target.checked }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <Star className={`w-4 h-4 ${formData.isPriority ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} />
            <span className="text-sm text-foreground">Cliente Prioritário</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={e => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-foreground">Ativo no Painel</span>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-border">
        <button type="button" onClick={onCancel} className="admin-button-secondary">
          Cancelar
        </button>
        <button type="submit" className="admin-button-primary">
          {client ? 'Salvar Alterações' : 'Cadastrar Cliente'}
        </button>
      </div>
    </form>
  );
}

// Inline Number Input for P and L columns
interface InlineNumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

function InlineNumberInput({ value, onChange, min = 0, max = 999 }: InlineNumberInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleBlur = () => {
    const parsed = parseInt(tempValue);
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
    } else {
      setTempValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setTempValue(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-12 px-1 py-0.5 text-sm text-center border border-primary rounded bg-background"
        min={min}
        max={max}
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => {
        setTempValue(value.toString());
        setIsEditing(true);
      }}
      className="w-12 py-0.5 text-sm text-center text-foreground font-medium hover:bg-muted rounded transition-colors cursor-pointer"
      title="Clique para editar"
    >
      {value}
    </button>
  );
}

// Inline Demand Input for demand status chips
interface InlineDemandInputProps {
  value: number;
  onChange: (value: number) => void;
  className: string;
}

function InlineDemandInput({ value, onChange, className }: InlineDemandInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempValue, setTempValue] = useState(value.toString());

  const handleBlur = () => {
    const parsed = parseInt(tempValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    } else {
      setTempValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setTempValue(value.toString());
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-8 px-0.5 py-0 text-[10px] text-center border border-primary rounded bg-background"
        min={0}
        autoFocus
      />
    );
  }

  return (
    <button
      onClick={() => {
        setTempValue(value.toString());
        setIsEditing(true);
      }}
      className={`demand-chip-small ${className} cursor-pointer hover:opacity-80 transition-opacity`}
      title="Clique para editar"
    >
      {value}
    </button>
  );
}

// Municipios Select Component - selects from registered municipalities
interface MunicipiosInputProps {
  value: string[];
  onChange: (municipios: string[]) => void;
}

function MunicipiosInput({ value, onChange }: MunicipiosInputProps) {
  const { municipalities, isLoading } = useMunicipalities();
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return municipalities;
    const q = search.toLowerCase();
    return municipalities.filter(m => 
      m.name.toLowerCase().includes(q) || m.state.toLowerCase().includes(q)
    );
  }, [municipalities, search]);

  // Group filtered by state
  const grouped = useMemo(() => {
    const map: Record<string, typeof municipalities> = {};
    for (const m of filtered) {
      if (!map[m.state]) map[m.state] = [];
      map[m.state].push(m);
    }
    return map;
  }, [filtered]);

  const toggleMunicipio = (name: string) => {
    if (value.includes(name)) {
      onChange(value.filter(v => v !== name));
    } else {
      onChange([...value, name]);
    }
  };

  const handleRemove = (municipio: string) => {
    onChange(value.filter(m => m !== municipio));
  };

  // Close on outside click
  const handleBlur = (e: React.FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-2" ref={containerRef} onBlur={handleBlur}>
      <div className="relative">
        <div 
          className="admin-input flex items-center gap-2 cursor-pointer min-h-[40px]"
          onClick={() => setIsOpen(!isOpen)}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
            onFocus={() => setIsOpen(true)}
            placeholder={isLoading ? "Carregando municípios..." : "Buscar município..."}
            className="flex-1 bg-transparent border-none outline-none text-sm"
          />
          <span className="text-xs text-muted-foreground shrink-0">
            {value.length} selecionado{value.length !== 1 ? 's' : ''}
          </span>
        </div>
        
        {isOpen && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg max-h-[250px] overflow-y-auto">
            {Object.keys(grouped).length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground text-center">
                {isLoading ? 'Carregando...' : 'Nenhum município encontrado'}
              </div>
            ) : (
              Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([state, munis]) => (
                <div key={state}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50 sticky top-0">
                    {state}
                  </div>
                  {munis.map((m) => {
                    const selected = value.includes(m.name);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMunicipio(m.name)}
                        className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent transition-colors ${
                          selected ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          selected ? 'bg-primary border-primary' : 'border-border'
                        }`}>
                          {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                        </div>
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </div>
      
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((municipio) => (
            <span
              key={municipio}
              className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-md border border-primary/20"
            >
              {municipio}
              <button
                type="button"
                onClick={() => handleRemove(municipio)}
                className="hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
      
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum município selecionado ainda.
        </p>
      )}
    </div>
  );
}

// Municipality Management Section
function MunicipalityManager() {
  const { municipalities, byState, states, addMunicipality, deleteMunicipality, isLoading } = useMunicipalities();
  const [newName, setNewName] = useState('');
  const [newState, setNewState] = useState('PA');
  const [searchFilter, setSearchFilter] = useState('');
  const [showManager, setShowManager] = useState(false);

  const handleAdd = () => {
    if (!newName.trim() || !newState.trim()) return;
    addMunicipality.mutate({ name: newName.trim(), state: newState.trim() });
    setNewName('');
  };

  const filteredMunis = useMemo(() => {
    if (!searchFilter.trim()) return municipalities;
    const q = searchFilter.toLowerCase();
    return municipalities.filter(m => 
      m.name.toLowerCase().includes(q) || m.state.toLowerCase().includes(q)
    );
  }, [municipalities, searchFilter]);

  return (
    <div className="admin-card mb-6">
      <button
        type="button"
        onClick={() => setShowManager(!showManager)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            Cadastro de Municípios ({municipalities.length})
          </h2>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showManager ? 'rotate-180' : ''}`} />
      </button>

      {showManager && (
        <div className="mt-4 space-y-4">
          {/* Add new municipality */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="admin-label">Nome do Município</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                placeholder="Ex: Marabá"
                className="admin-input"
              />
            </div>
            <div className="w-24">
              <label className="admin-label">UF</label>
              <input
                type="text"
                value={newState}
                onChange={(e) => setNewState(e.target.value.toUpperCase().slice(0, 2))}
                placeholder="PA"
                className="admin-input"
                maxLength={2}
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!newName.trim() || !newState.trim() || addMunicipality.isPending}
              className="admin-button-primary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Filtrar municípios..."
              className="admin-input pl-9"
            />
          </div>

          {/* List grouped by state */}
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="max-h-[300px] overflow-y-auto border border-border rounded-md">
              {Object.entries(
                filteredMunis.reduce<Record<string, typeof municipalities>>((acc, m) => {
                  if (!acc[m.state]) acc[m.state] = [];
                  acc[m.state].push(m);
                  return acc;
                }, {})
              ).sort(([a], [b]) => a.localeCompare(b)).map(([state, munis]) => (
                <div key={state}>
                  <div className="px-3 py-2 text-xs font-bold text-muted-foreground bg-muted/50 sticky top-0 border-b border-border">
                    {state} ({munis.length} municípios)
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0">
                    {munis.map((m) => (
                      <div key={m.id} className="flex items-center justify-between px-3 py-1.5 text-sm border-b border-border/30 hover:bg-muted/30">
                        <span className="text-foreground">{m.name}</span>
                        <button
                          type="button"
                          onClick={() => deleteMunicipality.mutate(m.id)}
                          className="text-muted-foreground hover:text-destructive transition-colors p-0.5"
                          title="Remover município"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {filteredMunis.length === 0 && (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Nenhum município encontrado.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Config;
