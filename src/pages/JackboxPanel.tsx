import { useMemo, useState } from "react";
import { Box, Search, User, CheckSquare } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { Client, COLLABORATOR_COLORS, COLLABORATOR_NAMES, CollaboratorName } from "@/types/client";
import { Task } from "@/types/task";

export default function JackboxPanel() {
  const { activeClients, highlightedClients } = useClients();
  const { 
    tasks, 
    toggleComplete, 
    getActiveTasksForClient,
    getActiveTaskCount,
  } = useTasks();

  const [searchQuery, setSearchQuery] = useState("");
  const [collaboratorFilter, setCollaboratorFilter] = useState<CollaboratorName | null>(null);

  // KPIs
  const kpis = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed);
    return {
      totalTasks: activeTasks.length,
      clientsWithTasks: new Set(activeTasks.map(t => t.client_id)).size,
      byCollaborator: COLLABORATOR_NAMES.reduce((acc, name) => {
        acc[name] = activeTasks.filter(t => t.assigned_to === name).length;
        return acc;
      }, {} as Record<CollaboratorName, number>),
    };
  }, [tasks]);

  // Filter clients with active tasks
  const clientsWithTasks = useMemo(() => {
    let result = activeClients.filter(c => getActiveTaskCount(c.id) > 0);

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.initials.toLowerCase().includes(query)
      );
    }

    // Collaborator filter
    if (collaboratorFilter) {
      result = result.filter(c => {
        const clientTasks = getActiveTasksForClient(c.id);
        return clientTasks.some(t => t.assigned_to === collaboratorFilter);
      });
    }

    // Sort by: highlighted first, then by task count
    result.sort((a, b) => {
      const aHighlighted = highlightedClients.has(a.id) ? 1 : 0;
      const bHighlighted = highlightedClients.has(b.id) ? 1 : 0;
      if (aHighlighted !== bHighlighted) return bHighlighted - aHighlighted;

      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;

      return getActiveTaskCount(b.id) - getActiveTaskCount(a.id);
    });

    return result;
  }, [activeClients, searchQuery, collaboratorFilter, highlightedClients, getActiveTaskCount, getActiveTasksForClient]);

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Micro-Demandas (Jackbox)" 
          subtitle="Tarefas rápidas por empresa"
          icon={<Box className="w-5 h-5" />}
        >
          <KPICard icon={<CheckSquare className="w-4 h-4" />} value={kpis.totalTasks} label="Tarefas" />
          <KPICard icon={<User className="w-4 h-4" />} value={kpis.clientsWithTasks} label="Empresas" variant="info" />
          
          <div className="w-px h-8 bg-border" />
          
          {/* Collaborator KPIs */}
          {COLLABORATOR_NAMES.map((name) => (
            <div
              key={name}
              className="flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer transition-colors hover:opacity-80"
              style={{ 
                borderColor: collaboratorFilter === name ? COLLABORATOR_COLORS[name] : 'transparent',
                backgroundColor: `${COLLABORATOR_COLORS[name]}15`,
              }}
              onClick={() => setCollaboratorFilter(collaboratorFilter === name ? null : name)}
            >
              <span className="text-sm font-bold" style={{ color: COLLABORATOR_COLORS[name] }}>
                {kpis.byCollaborator[name]}
              </span>
              <span className="text-[9px] text-muted-foreground uppercase">{name}</span>
            </div>
          ))}
        </VisualPanelHeader>

        {/* Search Bar */}
        <div className="px-6 py-3 bg-muted/30 border-b border-border flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar empresa..."
              className="pl-10"
            />
          </div>

          {collaboratorFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCollaboratorFilter(null)}
              className="text-xs"
            >
              Limpar filtro
            </Button>
          )}
        </div>

        {/* Visual Grid */}
        <VisualGrid itemCount={clientsWithTasks.length}>
          {clientsWithTasks.map((client) => (
            <JackboxCard
              key={client.id}
              client={client}
              isHighlighted={highlightedClients.has(client.id)}
              tasks={getActiveTasksForClient(client.id)}
              collaboratorFilter={collaboratorFilter}
              onToggleTask={toggleComplete}
            />
          ))}
        </VisualGrid>

        {/* Empty State */}
        {clientsWithTasks.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma micro-demanda ativa</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Jackbox Card Component
interface JackboxCardProps {
  client: Client;
  isHighlighted: boolean;
  tasks: Task[];
  collaboratorFilter: CollaboratorName | null;
  onToggleTask: (taskId: string) => void;
}

function JackboxCard({ 
  client, 
  isHighlighted, 
  tasks, 
  collaboratorFilter,
  onToggleTask,
}: JackboxCardProps) {
  // Filter tasks by collaborator if filter is active
  const filteredTasks = collaboratorFilter
    ? tasks.filter(t => t.assigned_to === collaboratorFilter)
    : tasks;

  return (
    <div
      className={cn(
        "group relative rounded-xl border-2 bg-card p-4 transition-all duration-200",
        "border-border hover:border-primary/50 hover:shadow-lg",
        isHighlighted && "border-4 border-red-500 ring-2 ring-red-500/30"
      )}
    >
      {/* Client Header */}
      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
        {/* Logo */}
        <div className="relative flex-shrink-0">
          {client.logoUrl ? (
            <img
              src={client.logoUrl}
              alt={client.name}
              className="w-10 h-10 object-contain rounded-lg bg-white p-1"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{client.initials}</span>
            </div>
          )}
          {client.isPriority && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-[6px] text-white">★</span>
            </div>
          )}
        </div>
        
        {/* Name and Count */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-sm">
            {client.name}
          </h3>
          <span className="text-xs text-muted-foreground">
            {filteredTasks.length} tarefa{filteredTasks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Task Checklist */}
      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {filteredTasks.slice(0, 11).map((task) => (
          <div
            key={task.id}
            className="flex items-start gap-2 group/task"
          >
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleTask(task.id)}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <span className={cn(
                "text-sm block truncate",
                task.completed && "line-through text-muted-foreground"
              )}>
                {task.title}
              </span>
            </div>
            {task.assigned_to && (
              <div
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ backgroundColor: COLLABORATOR_COLORS[task.assigned_to] }}
                title={task.assigned_to}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
