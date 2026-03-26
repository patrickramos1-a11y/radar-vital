import { useMemo, useState } from "react";
import { Box, User, CheckSquare, Plus, Trash2, Clock, Calendar, Search, Check, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { AppLayout } from "@/components/layout/AppLayout";
import { VisualPanelHeader, KPICard } from "@/components/visual-panels/VisualPanelHeader";
import { VisualGrid } from "@/components/visual-panels/VisualGrid";
import { VisualPanelFilters, VisualSortOption } from "@/components/visual-panels/VisualPanelFilters";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useVisualPanelFilters } from "@/hooks/useVisualPanelFilters";
import { Client } from "@/types/client";
import { useAuth } from "@/contexts/AuthContext";
import { Task } from "@/types/task";
import { CollaboratorTaskTable } from "@/components/tasks/CollaboratorTaskTable";
import { TaskAnalytics } from "@/components/tasks/TaskAnalytics";
import { Collaborator } from "@/types/collaborator";
import { assigneeMatches, assigneeMatchesAny, findCollaboratorColor } from "@/lib/taskAssignee";

type StatusFilter = "pendentes" | "concluidas" | "todas";

export default function JackboxUnified() {
  const { collaborators: allCollaborators } = useAuth();
  const { activeClients, highlightedClients } = useClients();
  const { 
    tasks, 
    toggleComplete, 
    addTask,
    updateTask,
    deleteTask,
    getActiveTasksForClient,
    getActiveTaskCount,
    getTasksForClient,
    getDaysOpen,
    getOldestTask,
    getAverageDaysOpen,
    getOverdueTasks,
  } = useTasks();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pendentes");

  const collaboratorNames = useMemo(() => allCollaborators.map(c => c.name), [allCollaborators]);
  const collaboratorColorMap = useMemo(() => {
    const map: Record<string, string> = {};
    allCollaborators.forEach(c => { map[c.name] = c.color; });
    return map;
  }, [allCollaborators]);

  // Custom sorter for jackbox
  const customSorter = (a: Client, b: Client, sortBy: VisualSortOption, multiplier: number) => {
    if (sortBy === 'tasks') {
      const countA = getTaskCountForStatus(a.id);
      const countB = getTaskCountForStatus(b.id);
      return (countB - countA) * multiplier;
    }
    if (sortBy === 'days_open') {
      const oldestA = getOldestClientTask(a.id);
      const oldestB = getOldestClientTask(b.id);
      const daysA = oldestA ? getDaysOpen(oldestA) : 0;
      const daysB = oldestB ? getDaysOpen(oldestB) : 0;
      return (daysB - daysA) * multiplier;
    }
    return null;
  };

  const getTaskCountForStatus = (clientId: string) => {
    if (statusFilter === "pendentes") return getActiveTasksForClient(clientId).length;
    if (statusFilter === "concluidas") return getTasksForClient(clientId).filter(t => t.completed).length;
    return getTasksForClient(clientId).length;
  };

  const getOldestClientTask = (clientId: string) => {
    const pending = getActiveTasksForClient(clientId);
    if (pending.length === 0) return null;
    return pending.reduce((o, t) => new Date(t.created_at) < new Date(o.created_at) ? t : o);
  };

  const clientsWithTasks = useMemo(() => {
    return activeClients.filter(c => getTaskCountForStatus(c.id) > 0);
  }, [activeClients, tasks, statusFilter]);

  const {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    filterFlags,
    collaboratorFilters,
    counts,
    filteredClients,
    handleFilterFlagToggle,
    handleCollaboratorFilterToggle,
    handleClearFilters,
  } = useVisualPanelFilters({
    clients: clientsWithTasks,
    highlightedClients,
    getActiveTaskCount,
    defaultSort: 'tasks',
    customSorter,
    skipCollaboratorFilter: true,
  });

  // Task-based collaborator filtering (instead of client.collaborators)
  const displayClients = useMemo(() => {
    if (collaboratorFilters.length === 0) return filteredClients;
    return filteredClients.filter(c => {
      const clientTasks = statusFilter === "pendentes"
        ? getActiveTasksForClient(c.id)
        : statusFilter === "concluidas"
        ? getTasksForClient(c.id).filter(t => t.completed)
        : getTasksForClient(c.id);
      return clientTasks.some(t => assigneeMatchesAny(t.assigned_to, collaboratorFilters));
    });
  }, [filteredClients, collaboratorFilters, tasks, statusFilter]);

  // KPIs
  const kpis = useMemo(() => {
    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    const oldestTask = getOldestTask();
    const avgDays = getAverageDaysOpen();
    
    return {
      totalActive: activeTasks.length,
      totalCompleted: completedTasks.length,
      clientsWithTasks: new Set(activeTasks.map(t => t.client_id)).size,
      oldestDays: oldestTask ? getDaysOpen(oldestTask) : 0,
      avgDays,
      byCollaborator: allCollaborators.reduce((acc, collab) => {
        const collabTasks = activeTasks.filter(t => assigneeMatches(t.assigned_to, collab.name));
        const collabAvg = collabTasks.length > 0
          ? Math.round(collabTasks.reduce((s, t) => s + getDaysOpen(t), 0) / collabTasks.length)
          : 0;
        const collabOldest = collabTasks.length > 0
          ? collabTasks.reduce((o, t) => new Date(t.created_at) < new Date(o.created_at) ? t : o)
          : null;
        acc[collab.name] = {
          count: collabTasks.length,
          avgDays: collabAvg,
          oldestDays: collabOldest ? getDaysOpen(collabOldest) : 0,
          color: collab.color,
        };
        return acc;
      }, {} as Record<string, { count: number; avgDays: number; oldestDays: number; color: string }>),
    };
  }, [tasks, getDaysOpen, getOldestTask, getAverageDaysOpen, allCollaborators]);

  const getFilteredTasks = (clientId: string) => {
    let clientTasks: Task[];
    if (statusFilter === "pendentes") clientTasks = getActiveTasksForClient(clientId);
    else if (statusFilter === "concluidas") clientTasks = getTasksForClient(clientId).filter(t => t.completed);
    else clientTasks = getTasksForClient(clientId);
    
    if (collaboratorFilters.length > 0) {
      clientTasks = clientTasks.filter(t => assigneeMatchesAny(t.assigned_to, collaboratorFilters));
    }
    return clientTasks;
  };

  const sortOptions: { value: VisualSortOption; label: string }[] = [
    { value: 'tasks', label: 'Tarefas' },
    { value: 'days_open' as VisualSortOption, label: 'Dias em aberto' },
    { value: 'priority', label: 'Prioridade' },
    { value: 'name', label: 'Nome' },
  ];

  // Find overloaded collaborators
  const overloadedCollaborators = useMemo(() => {
    if (collaboratorNames.length === 0) return [];
    const counts = collaboratorNames.map(n => kpis.byCollaborator[n]?.count || 0);
    const avg = counts.reduce((a, b) => a + b, 0) / counts.length;
    const threshold = avg * 1.5;
    return collaboratorNames.filter(name => (kpis.byCollaborator[name]?.count || 0) > threshold);
  }, [kpis.byCollaborator, collaboratorNames]);

  

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header with KPIs */}
        <VisualPanelHeader 
          title="Painel de Tarefas" 
          subtitle="Visão gerencial de tarefas por colaborador"
          icon={<Box className="w-5 h-5" />}
          
        >
          <KPICard icon={<CheckSquare className="w-4 h-4" />} value={kpis.totalActive} label="Pendentes" variant="warning" />
          <KPICard icon={<CheckSquare className="w-4 h-4" />} value={kpis.totalCompleted} label="Concluídas" variant="success" />
          <KPICard icon={<User className="w-4 h-4" />} value={kpis.clientsWithTasks} label="Empresas" variant="info" />
          <KPICard icon={<Clock className="w-4 h-4" />} value={`${kpis.oldestDays}d`} label="Mais antiga" variant="danger" />
          <KPICard icon={<Calendar className="w-4 h-4" />} value={`${kpis.avgDays}d`} label="Média aberto" variant="default" />
          
        </VisualPanelHeader>

        {/* Analytics Ranking Bar */}
        <TaskAnalytics tasks={tasks} clients={activeClients} getDaysOpen={getDaysOpen} collaborators={allCollaborators} overdueTasks={getOverdueTasks()} />

        {/* Status Filter */}
        <div className="flex items-center gap-2 px-6 py-2 bg-muted/30 border-b">
          <span className="text-xs text-muted-foreground font-medium">Status:</span>
          {([
            { key: "pendentes", label: "Pendentes" },
            { key: "concluidas", label: "Concluídas" },
            { key: "todas", label: "Todas" },
          ] as { key: StatusFilter; label: string }[]).map(({ key, label }) => (
            <Button
              key={key}
              variant={statusFilter === key ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        <VisualPanelFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterFlags={filterFlags}
          onFilterFlagToggle={handleFilterFlagToggle}
          collaboratorFilters={collaboratorFilters}
          onCollaboratorFilterToggle={handleCollaboratorFilterToggle}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSortChange={setSortBy}
          onSortDirectionChange={setSortDirection}
          onClearFilters={handleClearFilters}
          highlightedCount={counts.highlighted}
          jackboxCount={counts.jackbox}
          checkedCount={counts.checked}
          showCollaborators={true}
          sortOptions={sortOptions}
        />

        {/* Visual Grid */}
        <VisualGrid itemCount={displayClients.length}>
          {displayClients.map((client) => (
            <JackboxCardEnhanced
              key={client.id}
              client={client}
              isHighlighted={highlightedClients.has(client.id)}
              tasks={getFilteredTasks(client.id)}
              onToggleTask={(taskId) => toggleComplete(taskId, client.name)}
              onAddTask={(title, assignees, dueDate) => addTask(client.id, { title, assigned_to: assignees, due_date: dueDate || undefined }, client.name)}
              onUpdateTask={updateTask}
              onDeleteTask={(taskId) => deleteTask(taskId, client.name)}
              statusFilter={statusFilter}
              getDaysOpen={getDaysOpen}
              collaborators={allCollaborators}
              collaboratorColorMap={collaboratorColorMap}
            />
          ))}
        </VisualGrid>




        {/* Empty State */}
        {displayClients.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Box className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma tarefa {statusFilter === "todas" ? "" : statusFilter === "pendentes" ? "pendente" : "concluída"}</p>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Enhanced Jackbox Card Component
interface JackboxCardEnhancedProps {
  client: Client;
  isHighlighted: boolean;
  tasks: Task[];
  onToggleTask: (taskId: string) => void;
  onAddTask: (title: string, assignees: string[], dueDate?: string) => Promise<boolean>;
  onUpdateTask: (taskId: string, data: Partial<Task>) => Promise<boolean>;
  onDeleteTask: (taskId: string) => void;
  statusFilter: StatusFilter;
  getDaysOpen: (task: Task) => number;
  collaborators: Collaborator[];
  collaboratorColorMap: Record<string, string>;
}

function JackboxCardEnhanced({ 
  client, 
  isHighlighted, 
  tasks, 
  onToggleTask,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  statusFilter,
  getDaysOpen,
  collaborators,
  collaboratorColorMap,
}: JackboxCardEnhancedProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const tasksByCollaborator = useMemo(() => {
    const summary: Record<string, number> = {};
    collaborators.forEach(c => { summary[c.name] = 0; });
    tasks.filter(t => !t.completed).forEach(t => {
      collaborators.forEach(c => {
        if (assigneeMatches(t.assigned_to, c.name)) {
          summary[c.name]++;
        }
      });
    });
    return summary;
  }, [tasks, collaborators]);

  const pendingCount = tasks.filter(t => !t.completed).length;
  const completedCount = tasks.filter(t => t.completed).length;

  const handleSubmit = async () => {
    if (!newTaskTitle.trim()) return;
    const success = await onAddTask(newTaskTitle.trim(), newTaskAssignees, newTaskDueDate || undefined);
    if (success) {
      setNewTaskTitle('');
      setNewTaskAssignees([]);
      setNewTaskDueDate('');
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editingTitle.trim()) return;
    await onUpdateTask(taskId, { title: editingTitle.trim() });
    setEditingId(null);
  };

  const handleAssigneeChange = async (taskId: string, collabName: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const current = task.assigned_to || [];
    const isAssigned = current.some(a => a.toLowerCase() === collabName.toLowerCase());
    const newAssignees = isAssigned
      ? current.filter(a => a.toLowerCase() !== collabName.toLowerCase())
      : [...current, collabName];
    await onUpdateTask(taskId, { assigned_to: newAssignees });
  };

  return (
    <div
      className={cn(
        "group relative rounded-xl border-2 bg-card p-4 transition-all duration-200",
        "border-border hover:border-primary/50 hover:shadow-lg",
        isHighlighted && "border-4 border-red-500 ring-2 ring-red-500/30"
      )}
    >
      {/* Client Header */}
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <div className="relative flex-shrink-0">
          {client.logoUrl ? (
            <img src={client.logoUrl} alt={client.name} className="w-9 h-9 object-contain rounded-lg bg-white p-0.5" />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">{client.initials}</span>
            </div>
          )}
          {client.isPriority && (
            <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-500 rounded-full flex items-center justify-center">
              <span className="text-[5px] text-white">★</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">{client.name}</h3>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-amber-600 font-medium">{pendingCount} pend.</span>
            {completedCount > 0 && <span className="text-emerald-600 font-medium">{completedCount} conc.</span>}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsAdding(!isAdding)}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Collaborator Summary */}
      <div className="flex items-center gap-1 mb-2">
        {collaborators.map((collab) => {
          const count = tasksByCollaborator[collab.name] || 0;
          if (count === 0) return null;
          return (
            <div key={collab.name} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold text-white" style={{ backgroundColor: collab.color }} title={`${collab.name}: ${count} tarefas`}>
              {collab.name[0].toUpperCase()}{count}
            </div>
          );
        })}
      </div>

      {/* Add Task Form - with dropdown */}
      {isAdding && (
        <div className="mb-2 p-2 bg-muted/50 rounded-lg space-y-2">
          <Input
            placeholder="Título da tarefa..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="h-8 text-xs"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <div className="flex items-center gap-2">
            <CardAssigneeDropdown collaborators={collaborators} selected={newTaskAssignees} onChange={setNewTaskAssignees} />
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-muted-foreground">Prazo:</span>
              <input type="date" value={newTaskDueDate} onChange={(e) => setNewTaskDueDate(e.target.value)} className="px-1 py-0.5 text-[10px] border rounded bg-background h-6" />
            </div>
          </div>
          <Button size="sm" className="h-7 text-xs w-full" onClick={handleSubmit}>Adicionar</Button>
        </div>
      )}

      {/* Task Checklist */}
      <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
        {tasks.slice(0, 11).map((task) => {
          const days = getDaysOpen(task);
          const isEditing = editingId === task.id;
          return (
            <div key={task.id} className="flex items-start gap-1.5 group/task p-1 rounded hover:bg-muted/50">
              <Checkbox checked={task.completed} onCheckedChange={() => onToggleTask(task.id)} className="mt-0.5 h-3.5 w-3.5" />
              <div className="flex-1 min-w-0">
                {isEditing ? (
                  <input
                    type="text"
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    className="w-full px-1 py-0.5 text-xs border rounded bg-background"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit(task.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => handleSaveEdit(task.id)}
                  />
                ) : (
                  <>
                    <span className={cn("text-xs block leading-tight", task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                    {task.due_date && !task.completed && (
                      <span className={cn("text-[9px]", new Date(task.due_date) < new Date(new Date().toDateString()) ? "text-destructive font-bold" : "text-muted-foreground")}>
                        📅 {new Date(task.due_date + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </>
                )}
              </div>
              {!task.completed && (
                <span className={cn("text-[9px] flex-shrink-0 mt-0.5", days > 30 ? "text-destructive font-bold" : days > 14 ? "text-amber-600" : "text-muted-foreground")}>
                  {days}d
                </span>
              )}
              {/* Assignee dropdown per task */}
              {!task.completed && (
                <TaskAssigneeDropdown task={task} collaborators={collaborators} collaboratorColorMap={collaboratorColorMap} onAssigneeChange={(name) => handleAssigneeChange(task.id, name)} />
              )}
              {/* Edit button */}
              {!task.completed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 opacity-0 group-hover/task:opacity-100"
                  onClick={() => { setEditingId(task.id); setEditingTitle(task.title); }}
                >
                  <Pencil className="h-2.5 w-2.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 opacity-0 group-hover/task:opacity-100 text-destructive hover:text-destructive"
                onClick={() => onDeleteTask(task.id)}
              >
                <Trash2 className="h-2.5 w-2.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {tasks.length > 11 && (
        <p className="text-[10px] text-muted-foreground text-center mt-1">+{tasks.length - 11} tarefas</p>
      )}
    </div>
  );
}

// Compact assignee dropdown for task items in JackboxCard
function TaskAssigneeDropdown({ task, collaborators, collaboratorColorMap, onAssigneeChange }: {
  task: Task;
  collaborators: Collaborator[];
  collaboratorColorMap: Record<string, string>;
  onAssigneeChange: (name: string) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = collaborators.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center -space-x-0.5 flex-shrink-0 hover:opacity-80 transition-opacity">
          {task.assigned_to.length > 0 ? (
            task.assigned_to.slice(0, 2).map((name) => {
              const color = findCollaboratorColor([name], collaboratorColorMap);
              return (
                <span key={name} className="w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center border border-card" style={{ backgroundColor: color || '#6B7280' }} title={name}>
                  {name[0].toUpperCase()}
                </span>
              );
            })
          ) : (
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          )}
          {task.assigned_to.length > 2 && <span className="text-[8px] text-muted-foreground ml-0.5">+{task.assigned_to.length - 2}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-2" align="end">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-6 pr-2 py-1 text-xs border rounded-md bg-background" autoFocus />
        </div>
        <div className="space-y-0.5 max-h-[150px] overflow-y-auto">
          {filtered.map((collab) => {
            const isAssigned = assigneeMatches(task.assigned_to, collab.name);
            return (
              <button key={collab.id} onClick={() => onAssigneeChange(collab.name)} className="flex items-center gap-2 w-full px-2 py-1 rounded text-xs hover:bg-muted transition-colors">
                <span className="w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ backgroundColor: collab.color }}>{collab.name[0].toUpperCase()}</span>
                <span className="flex-1 text-left truncate capitalize">{collab.name}</span>
                {isAssigned && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Compact assignee dropdown for new task form in JackboxCard
function CardAssigneeDropdown({ collaborators, selected, onChange }: {
  collaborators: Collaborator[];
  selected: string[];
  onChange: (val: string[]) => void;
}) {
  const [search, setSearch] = useState('');
  const filtered = collaborators.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const toggle = (name: string) => onChange(selected.includes(name) ? selected.filter(n => n !== name) : [...selected, name]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-1 px-2 py-1 rounded border bg-background hover:bg-muted transition-colors text-[10px]">
          <User className="w-3 h-3 text-muted-foreground" />
          {selected.length > 0 ? (
            <div className="flex -space-x-0.5">
              {selected.slice(0, 2).map(name => {
                const c = collaborators.find(c => c.name === name);
                return <span key={name} className="w-4 h-4 rounded-full text-[7px] font-bold text-white flex items-center justify-center border border-background" style={{ backgroundColor: c?.color || '#6B7280' }}>{name[0].toUpperCase()}</span>;
              })}
              {selected.length > 2 && <span className="text-muted-foreground ml-0.5">+{selected.length - 2}</span>}
            </div>
          ) : (
            <span className="text-muted-foreground">Resp.</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[180px] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-6 pr-2 py-1 text-xs border rounded-md bg-background" autoFocus />
        </div>
        <div className="space-y-0.5 max-h-[150px] overflow-y-auto">
          {filtered.map((collab) => {
            const isSelected = selected.includes(collab.name);
            return (
              <button key={collab.id} onClick={() => toggle(collab.name)} className="flex items-center gap-2 w-full px-2 py-1 rounded text-xs hover:bg-muted transition-colors">
                <span className="w-4 h-4 rounded-full text-[8px] font-bold text-white flex items-center justify-center flex-shrink-0" style={{ backgroundColor: collab.color }}>{collab.name[0].toUpperCase()}</span>
                <span className="flex-1 text-left truncate capitalize">{collab.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
