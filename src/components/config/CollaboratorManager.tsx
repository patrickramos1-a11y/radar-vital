import { useState, useMemo } from 'react';
import { Users, Plus, Pencil, Trash2, Search, ChevronDown, X, Check } from 'lucide-react';
import { useCollaborators } from '@/hooks/useCollaborators';
import { generateCollaboratorInitials, generateCollaboratorColor } from '@/types/collaborator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const COLOR_PALETTE = [
  '#6366f1', '#ec4899', '#f97316', '#22c55e', '#8b5cf6',
  '#06b6d4', '#f43f5e', '#84cc16', '#0ea5e9', '#a855f7',
  '#ef4444', '#14b8a6', '#f59e0b', '#3b82f6', '#d946ef',
];

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'colaborador', label: 'Colaborador' },
];

export function CollaboratorManager() {
  const { collaborators, loading, addCollaborator, updateCollaborator, deleteCollaborator } = useCollaborators();
  const [showManager, setShowManager] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(COLOR_PALETTE[0]);
  const [newRole, setNewRole] = useState('colaborador');

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editRole, setEditRole] = useState('');

  const filtered = useMemo(() => {
    if (!searchFilter.trim()) return collaborators;
    const q = searchFilter.toLowerCase();
    return collaborators.filter(c => c.name.toLowerCase().includes(q));
  }, [collaborators, searchFilter]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const initials = generateCollaboratorInitials(newName.trim());
    await addCollaborator(newName.trim(), newColor, initials, undefined, newRole);
    setNewName('');
    setNewColor(generateCollaboratorColor());
    setNewRole('colaborador');
  };

  const startEdit = (c: typeof collaborators[0]) => {
    setEditingId(c.id);
    setEditName(c.name);
    setEditColor(c.color);
    setEditRole(c.role);
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    const initials = generateCollaboratorInitials(editName.trim());
    await updateCollaborator(editingId, {
      name: editName.trim(),
      color: editColor,
      initials,
      role: editRole,
    });
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    await deleteCollaborator(deleteConfirmId);
    setDeleteConfirmId(null);
  };

  const toggleActive = async (c: typeof collaborators[0]) => {
    await updateCollaborator(c.id, { isActive: !c.isActive });
  };

  return (
    <>
      <div className="admin-card mb-6">
        <button
          type="button"
          onClick={() => setShowManager(!showManager)}
          className="flex items-center justify-between w-full"
        >
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">
              Cadastro de Usuários ({collaborators.length})
            </h2>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showManager ? 'rotate-180' : ''}`} />
        </button>

        {showManager && (
          <div className="mt-4 space-y-4">
            {/* Add form */}
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="admin-label">Nome</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                  placeholder="Nome do colaborador"
                  className="admin-input"
                />
              </div>
              <div>
                <label className="admin-label">Perfil</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="admin-input w-40"
                >
                  {ROLE_OPTIONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="admin-label">Cor</label>
                <div className="flex items-center gap-1.5">
                  {COLOR_PALETTE.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-all ${newColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim()}
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
                placeholder="Filtrar usuários..."
                className="admin-input pl-9"
              />
            </div>

            {/* Table */}
            {loading ? (
              <p className="text-sm text-muted-foreground">Carregando...</p>
            ) : (
              <div className="border border-border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Usuário</th>
                      <th className="px-3 py-2 text-left font-medium text-muted-foreground">Perfil</th>
                      <th className="px-3 py-2 text-center font-medium text-muted-foreground">Status</th>
                      <th className="px-3 py-2 text-right font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => (
                      <tr key={c.id} className="border-b border-border/30 hover:bg-muted/30">
                        {editingId === c.id ? (
                          <>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  {COLOR_PALETTE.map(color => (
                                    <button
                                      key={color}
                                      type="button"
                                      onClick={() => setEditColor(color)}
                                      className={`w-5 h-5 rounded-full border-2 transition-all ${editColor === color ? 'border-foreground scale-110' : 'border-transparent'}`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="admin-input py-1 text-sm flex-1"
                                  onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                                  autoFocus
                                />
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                className="admin-input py-1 text-sm w-36"
                              >
                                {ROLE_OPTIONS.map(r => (
                                  <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                              </select>
                            </td>
                            <td />
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button onClick={saveEdit} className="p-1 text-green-500 hover:text-green-600" title="Salvar">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={cancelEdit} className="p-1 text-muted-foreground hover:text-foreground" title="Cancelar">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                  style={{ backgroundColor: c.color }}
                                >
                                  {c.initials}
                                </div>
                                <span className="font-medium text-foreground">{c.name}</span>
                              </div>
                            </td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                c.role === 'admin'
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-muted text-muted-foreground'
                              }`}>
                                {c.role === 'admin' ? 'Admin' : 'Colaborador'}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => toggleActive(c)}
                                className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                  c.isActive
                                    ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                                    : 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                                }`}
                              >
                                {c.isActive ? 'Ativo' : 'Inativo'}
                              </button>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => startEdit(c)}
                                  className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmId(c.id)}
                                  className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-3 py-4 text-center text-muted-foreground">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir colaborador?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O colaborador será removido permanentemente.
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
    </>
  );
}
