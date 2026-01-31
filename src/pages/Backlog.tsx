import { useState } from 'react';
import { Plus, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { BacklogHeader } from '@/components/backlog/BacklogHeader';
import { BacklogFilters } from '@/components/backlog/BacklogFilters';
import { BacklogCard } from '@/components/backlog/BacklogCard';
import { BacklogForm } from '@/components/backlog/BacklogForm';
import { useBacklog } from '@/hooks/useBacklog';
import { Skeleton } from '@/components/ui/skeleton';

export default function Backlog() {
  const [showForm, setShowForm] = useState(false);
  const { 
    items, 
    isLoading, 
    kpis, 
    filters, 
    setFilters, 
    resetFilters, 
    createItem, 
    isCreating 
  } = useBacklog();

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ListChecks className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Backlog de Produto</h1>
              <p className="text-sm text-muted-foreground">
                Gerencie melhorias e evolução do Radar-Vital
              </p>
            </div>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Item
          </Button>
        </div>

        {/* KPIs */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <BacklogHeader kpis={kpis} />
        )}

        {/* Filters */}
        <BacklogFilters 
          filters={filters} 
          onFiltersChange={setFilters} 
          onReset={resetFilters} 
        />

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => (
              <BacklogCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 border border-dashed border-border rounded-lg">
            <ListChecks className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Nenhum item encontrado
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {filters.search || filters.status !== 'TODOS' || filters.categoria !== 'TODOS'
                ? 'Tente ajustar os filtros para ver mais resultados'
                : 'Comece criando seu primeiro item de backlog'}
            </p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Item
            </Button>
          </div>
        )}

        {/* Form Modal */}
        <BacklogForm
          open={showForm}
          onOpenChange={setShowForm}
          onSubmit={createItem}
          isLoading={isCreating}
        />
      </div>
    </AppLayout>
  );
}
