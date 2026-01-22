import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAptDemands } from '@/hooks/useAptDemands';
import { useUser } from '@/contexts/UserContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { AptTable } from '@/components/apt/AptTable';
import { AptFiltersComponent } from '@/components/apt/AptFilters';
import { AptDemandModal } from '@/components/apt/AptDemandModal';
import { MobileAptCard } from '@/components/apt/MobileAptCard';
import { Button } from '@/components/ui/button';
import { Plus, Loader2, ClipboardCheck } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { AptDemand } from '@/types/apt';

// Patrick is considered the gestor/admin
const GESTOR_USERS = ['Patrick'];

export default function AptPanel() {
  const {
    demands,
    loading,
    filters,
    setFilters,
    updateFeitoResponsavel,
    updateAprovadoGestor,
    createDemand,
    updateDemand,
    deleteDemand,
    getUniqueValues,
  } = useAptDemands();

  const { currentUser } = useUser();
  const isMobile = useIsMobile();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<AptDemand | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [demandToDelete, setDemandToDelete] = useState<string | null>(null);

  const isGestor = currentUser ? GESTOR_USERS.includes(currentUser.name) : false;
  const currentUserName = currentUser?.name || '';

  const { setores, responsaveis } = useMemo(() => getUniqueValues(), [getUniqueValues]);

  // Filter demands for collaborator (only their demands)
  const filteredDemands = useMemo(() => {
    if (isGestor) return demands;
    return demands.filter(d => 
      d.responsavel.toUpperCase() === currentUserName.toUpperCase()
    );
  }, [demands, isGestor, currentUserName]);

  const handleEdit = (demand: AptDemand) => {
    setEditingDemand(demand);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDemandToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (demandToDelete) {
      await deleteDemand(demandToDelete);
      setDemandToDelete(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleSave = async (demandData: Omit<AptDemand, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingDemand) {
      await updateDemand(editingDemand.id, demandData);
    } else {
      await createDemand(demandData);
    }
    setEditingDemand(null);
  };

  const handleNewDemand = () => {
    setEditingDemand(null);
    setModalOpen(true);
  };

  // Stats
  const stats = useMemo(() => {
    const total = filteredDemands.length;
    const pendentes = filteredDemands.filter(d => d.feito_responsavel === 'pendente').length;
    const executados = filteredDemands.filter(d => d.feito_responsavel === 'executado').length;
    const aprovados = filteredDemands.filter(d => d.aprovado_gestor === 'aprovado').length;
    return { total, pendentes, executados, aprovados };
  }, [filteredDemands]);

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <ClipboardCheck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-foreground">
                APT - Acompanhamento de Performance
              </h1>
              <p className="text-sm text-muted-foreground">
                {isGestor ? 'Visão geral de todas as demandas' : `Suas demandas, ${currentUserName}`}
              </p>
            </div>
          </div>

          {isGestor && (
            <Button onClick={handleNewDemand} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Nova Demanda
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.pendentes}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.executados}</p>
            <p className="text-xs text-muted-foreground">Executados</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.aprovados}</p>
            <p className="text-xs text-muted-foreground">Aprovados</p>
          </div>
        </div>

        {/* Filters */}
        <AptFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          setores={setores}
          responsaveis={responsaveis}
        />

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : isMobile ? (
          /* Mobile View - Cards */
          <div className="space-y-3">
            {filteredDemands.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma demanda encontrada.
              </div>
            ) : (
              filteredDemands.map((demand) => (
                <MobileAptCard
                  key={demand.id}
                  demand={demand}
                  onUpdateFeitoResponsavel={updateFeitoResponsavel}
                  onUpdateAprovadoGestor={updateAprovadoGestor}
                  onEdit={isGestor ? handleEdit : undefined}
                  onDelete={isGestor ? handleDelete : undefined}
                  isGestor={isGestor}
                  canEditFeito={isGestor || demand.responsavel.toUpperCase() === currentUserName.toUpperCase()}
                />
              ))
            )}
          </div>
        ) : (
          /* Desktop View - Table */
          <AptTable
            demands={filteredDemands}
            onUpdateFeitoResponsavel={updateFeitoResponsavel}
            onUpdateAprovadoGestor={updateAprovadoGestor}
            onEdit={isGestor ? handleEdit : undefined}
            onDelete={isGestor ? handleDelete : undefined}
            isGestor={isGestor}
            currentUserName={currentUserName}
          />
        )}

        {/* Create/Edit Modal */}
        <AptDemandModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          demand={editingDemand}
          onSave={handleSave}
          existingSetores={setores}
          existingResponsaveis={responsaveis}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta demanda? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}
