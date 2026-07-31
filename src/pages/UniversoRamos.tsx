import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe2,
  ListChecks,
  MessageCircle,
  MonitorUp,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientCard } from "@/components/dashboard/ClientCard";
import {
  FilterBar,
  type ClientTypeFilter,
  type FilterFlags,
  type GridSize,
  type SortDirection,
  type SortOption,
  type ViewMode,
} from "@/components/dashboard/FilterBar";
import { ClientGrid } from "@/components/dashboard/ClientGrid";
import { NewClientDialog } from "@/components/dashboard/NewClientDialog";
import { ClientWorkDialog } from "@/components/client-work/ClientWorkDialog";
import { MobileCompactGrid } from "@/components/mobile/MobileCompactGrid";
import { MobileClientDetail } from "@/components/mobile/MobileClientDetail";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useClients } from "@/contexts/ClientContext";
import { useAllClientsCommentCountsWithRefresh } from "@/hooks/useClientComments";
import { useClientAssignments } from "@/hooks/useClientAssignments";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTasks } from "@/hooks/useTasks";

export default function UniversoRamos() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentUser, collaborators } = useAuth();
  const {
    universeClients,
    highlightedClients,
    isLoading,
    getClient,
    toggleChecked,
    toggleCollaborator,
    toggleHighlight,
    togglePriority,
  } = useClients();
  const {
    getAssignedCollaboratorIds,
    toggleAssignment,
  } = useClientAssignments();
  const {
    addTask,
    deleteTask,
    getActiveTaskCount,
    getTasksForClient,
    toggleComplete,
    updateTask,
  } = useTasks();
  const [commentCounts] = useAllClientsCommentCountsWithRefresh(
    currentUser?.name,
  );
  const [sortBy, setSortBy] = useState<SortOption>("order");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [filterFlags, setFilterFlags] = useState<FilterFlags>({
    priority: false,
    highlighted: false,
    selected: false,
    hasCollaborators: false,
    withJackbox: false,
    withoutJackbox: false,
    withComments: false,
    withoutComments: false,
  });
  const [collaboratorFilters, setCollaboratorFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("fit-all");
  const [gridSize, setGridSize] = useState<GridSize>(null);
  const [fitAllLocked, setFitAllLocked] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [taskClientId, setTaskClientId] = useState<string | null>(null);
  const [newClientOpen, setNewClientOpen] = useState(false);

  const getCommentCount = useCallback(
    (clientId: string) => commentCounts.get(clientId) ?? 0,
    [commentCounts],
  );

  const handleFilterFlagToggle = (flag: keyof FilterFlags) => {
    setFilterFlags((current) => ({
      ...current,
      [flag]: !current[flag],
      ...(flag === "withJackbox" && !current.withJackbox
        ? { withoutJackbox: false }
        : {}),
      ...(flag === "withoutJackbox" && !current.withoutJackbox
        ? { withJackbox: false }
        : {}),
      ...(flag === "withComments" && !current.withComments
        ? { withoutComments: false }
        : {}),
      ...(flag === "withoutComments" && !current.withoutComments
        ? { withComments: false }
        : {}),
    }));
  };

  const handleCollaboratorFilterToggle = (name: string) => {
    setCollaboratorFilters((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  };

  const clearFilters = () => {
    setFilterFlags({
      priority: false,
      highlighted: false,
      selected: false,
      hasCollaborators: false,
      withJackbox: false,
      withoutJackbox: false,
      withComments: false,
      withoutComments: false,
    });
    setCollaboratorFilters([]);
    setSearchQuery("");
  };

  const visibleClients = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("pt-BR");
    const multiplier = sortDirection === "desc" ? 1 : -1;
    let result = universeClients.filter((client) => {
      const assignedIds = getAssignedCollaboratorIds(client.id);
      const assignedNames = collaborators
        .filter((collaborator) => assignedIds.includes(collaborator.id))
        .map((collaborator) => collaborator.name.toLocaleLowerCase("pt-BR"));
      const matchesSearch =
        !query ||
        client.name.toLocaleLowerCase("pt-BR").includes(query) ||
        client.initials.toLocaleLowerCase("pt-BR").includes(query) ||
        assignedNames.some((name) => name.includes(query));
      if (!matchesSearch) return false;

      const activeFilters = [
        filterFlags.priority,
        filterFlags.highlighted,
        filterFlags.selected,
        filterFlags.hasCollaborators,
        filterFlags.withJackbox,
        filterFlags.withoutJackbox,
        filterFlags.withComments,
        filterFlags.withoutComments,
        collaboratorFilters.length > 0,
      ].some(Boolean);
      if (!activeFilters) return true;

      const matchesCollaborator =
        collaboratorFilters.length > 0 &&
        ((collaboratorFilters.includes("__none__") && assignedIds.length === 0) ||
          collaboratorFilters
            .filter((name) => name !== "__none__")
            .some((name) =>
              collaborators.some(
                (collaborator) =>
                  collaborator.name === name && assignedIds.includes(collaborator.id),
              ),
            ));

      return (
        (filterFlags.priority && client.isPriority) ||
        (filterFlags.highlighted && highlightedClients.has(client.id)) ||
        (filterFlags.selected && client.isChecked) ||
        (filterFlags.hasCollaborators && assignedIds.length > 0) ||
        (filterFlags.withJackbox && getActiveTaskCount(client.id) > 0) ||
        (filterFlags.withoutJackbox && getActiveTaskCount(client.id) === 0) ||
        (filterFlags.withComments && getCommentCount(client.id) > 0) ||
        (filterFlags.withoutComments && getCommentCount(client.id) === 0) ||
        matchesCollaborator
      );
    });

    result.sort((left, right) => {
      if (sortBy === "priority") {
        return (Number(right.isPriority) - Number(left.isPriority)) * multiplier;
      }
      if (sortBy === "jackbox") {
        return (
          (getActiveTaskCount(right.id) - getActiveTaskCount(left.id)) * multiplier
        );
      }
      if (sortBy === "comments") {
        return (getCommentCount(right.id) - getCommentCount(left.id)) * multiplier;
      }
      if (sortBy === "name") {
        return left.name.localeCompare(right.name) * multiplier;
      }
      return (left.order - right.order) * multiplier;
    });
    return result;
  }, [
    collaborators,
    collaboratorFilters,
    filterFlags,
    getActiveTaskCount,
    getAssignedCollaboratorIds,
    getCommentCount,
    highlightedClients,
    searchQuery,
    sortBy,
    sortDirection,
    universeClients,
  ]);

  const stats = useMemo(
    () => ({
      total: universeClients.length,
      tasks: universeClients.reduce(
        (sum, client) => sum + getActiveTaskCount(client.id),
        0,
      ),
      comments: universeClients.reduce(
        (sum, client) => sum + getCommentCount(client.id),
        0,
      ),
      priority: universeClients.filter((client) => client.isPriority).length,
      assigned: universeClients.filter(
        (client) => getAssignedCollaboratorIds(client.id).length > 0,
      ).length,
    }),
    [
      getActiveTaskCount,
      getAssignedCollaboratorIds,
      getCommentCount,
      universeClients,
    ],
  );

  const selectedClient = selectedClientId
    ? getClient(selectedClientId)
    : null;
  const taskClient = taskClientId ? getClient(taskClientId) : null;

  return (
    <AppLayout>
      <div className="flex h-full min-h-0 flex-col bg-background">
        <header className="border-b bg-card px-4 py-3 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center bg-cyan-100 text-cyan-800">
                <Globe2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold">
                  Universo Ramos
                </h1>
                <p className="text-xs text-muted-foreground">
                  Setores, projetos e iniciativas internas
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/tv?scope=UNIVERSO_RAMOS")}
              >
                <MonitorUp className="h-4 w-4" />
                <span className="hidden sm:inline">Apresentação</span>
              </Button>
              <Button size="sm" onClick={() => setNewClientOpen(true)}>
                <UserPlus className="h-4 w-4" />
                Novo cliente
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Summary label="Cadastros" value={stats.total} icon={Globe2} />
            <Summary label="Tarefas" value={stats.tasks} icon={ListChecks} />
            <Summary
              label="Comentários"
              value={stats.comments}
              icon={MessageCircle}
            />
            <Summary label="Prioridades" value={stats.priority} icon={Star} />
            <Summary label="Com responsáveis" value={stats.assigned} icon={Users} />
          </div>
        </header>

        <FilterBar
          sortBy={sortBy}
          sortDirection={sortDirection}
          filterFlags={filterFlags}
          collaboratorFilters={collaboratorFilters}
          clientTypeFilter={"all" as ClientTypeFilter}
          priorityCount={stats.priority}
          highlightedCount={universeClients.filter((client) => highlightedClients.has(client.id)).length}
          selectedCount={universeClients.filter((client) => client.isChecked).length}
          jackboxCount={stats.tasks}
          commentsCount={stats.comments}
          visibleCount={visibleClients.length}
          totalCount={universeClients.length}
          acCount={0}
          avCount={0}
          searchQuery={searchQuery}
          viewMode={viewMode}
          gridSize={gridSize}
          fitAllLocked={fitAllLocked}
          municipalities={[]}
          clientMunicipioNames={new Set()}
          municipioFilters={[]}
          onMunicipioFilterToggle={() => undefined}
          onSearchChange={setSearchQuery}
          onSortChange={setSortBy}
          onSortDirectionChange={setSortDirection}
          onFilterFlagToggle={handleFilterFlagToggle}
          onCollaboratorFilterToggle={handleCollaboratorFilterToggle}
          onClientTypeFilterChange={() => undefined}
          onClearHighlights={clearFilters}
          onClearAllFilters={clearFilters}
          onViewModeChange={setViewMode}
          onGridSizeChange={setGridSize}
          onFitAllLockedChange={setFitAllLocked}
          showClientTypeFilter={false}
          showMunicipalityFilter={false}
          tvPath="/tv?scope=UNIVERSO_RAMOS"
        />

        <main className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          {isLoading ? (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Carregando Universo Ramos...
            </div>
          ) : visibleClients.length === 0 ? (
            <div className="grid h-full place-items-center">
              <div className="max-w-sm text-center">
                <Globe2 className="mx-auto h-10 w-10 text-cyan-700/50" />
                <h2 className="mt-3 font-semibold">
                  {universeClients.length === 0
                    ? "O Universo Ramos ainda está vazio"
                    : "Nenhum cadastro encontrado"}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cadastros internos ficam isolados dos totais e painéis AC/AV.
                </p>
              </div>
            </div>
          ) : isMobile ? (
            <>
              <MobileCompactGrid
                clients={visibleClients}
                highlightedClients={highlightedClients}
                getActiveTaskCount={getActiveTaskCount}
                getCommentCount={getCommentCount}
                onClientTap={setSelectedClientId}
              />
              <MobileClientDetail
                client={selectedClient ?? null}
                isOpen={Boolean(selectedClient)}
                onClose={() => setSelectedClientId(null)}
                isHighlighted={
                  selectedClient
                    ? highlightedClients.has(selectedClient.id)
                    : false
                }
                activeTaskCount={
                  selectedClient ? getActiveTaskCount(selectedClient.id) : 0
                }
                commentCount={
                  selectedClient ? getCommentCount(selectedClient.id) : 0
                }
                tasks={
                  selectedClient ? getTasksForClient(selectedClient.id) : []
                }
                onTogglePriority={togglePriority}
                onToggleHighlight={toggleHighlight}
                onToggleChecked={toggleChecked}
                onToggleCollaborator={toggleCollaborator}
                onAddTask={addTask}
                onToggleComplete={toggleComplete}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
              />
            </>
          ) : (
            <ClientGrid
              clients={visibleClients}
              selectedClientId={selectedClientId}
              highlightedClients={highlightedClients}
              getActiveTaskCount={getActiveTaskCount}
              getCommentCount={getCommentCount}
              allCollaborators={collaborators}
              getAssignedCollaboratorIds={getAssignedCollaboratorIds}
              onSelectClient={(id) =>
                setSelectedClientId((current) => (current === id ? null : id))
              }
              onHighlightClient={toggleHighlight}
              onTogglePriority={togglePriority}
              onToggleCollaboratorAssignment={toggleAssignment}
              onOpenChecklist={setTaskClientId}
              viewMode={viewMode}
              gridSize={gridSize}
              fitAllLocked={fitAllLocked}
            />
          )}
        </main>
      </div>

      {taskClient && (
        <ClientWorkDialog
          isOpen
          onClose={() => setTaskClientId(null)}
          client={taskClient}
          tasks={getTasksForClient(taskClient.id)}
          onAddTask={addTask}
          onToggleComplete={toggleComplete}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      )}

      <NewClientDialog
        open={newClientOpen}
        onOpenChange={setNewClientOpen}
        defaultClientType="UNIVERSO_RAMOS"
      />
    </AppLayout>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Globe2;
}) {
  return (
    <div className="flex h-9 items-center gap-2 border bg-background px-2.5">
      <Icon className="h-3.5 w-3.5 text-cyan-700" />
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
