import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe2,
  ListChecks,
  MessageCircle,
  MonitorUp,
  Star,
  Sparkles,
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
import { ClientQuickEditDialog } from "@/components/dashboard/ClientQuickEditDialog";
import { UniverseChallengeDialog } from "@/components/universe-ramos/UniverseChallengeDialog";
import { UniverseUnitDialog } from "@/components/universe-ramos/UniverseUnitDialog";
import { OpenChallengesDialog } from "@/components/universe-ramos/OpenChallengesDialog";
import { UniverseChallengesManager } from "@/components/universe-ramos/UniverseChallengesManager";
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
import { useChallenges } from "@/hooks/useChallenges";
import { useCollaborators } from "@/hooks/useCollaborators";
import { Client, UniversoRamosCategory } from "@/types/client";

export default function UniversoRamos() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { currentUser, collaborators, isAdmin } = useAuth();
  const { collaborators: centralCollaborators } = useCollaborators();
  const {
    universeClients,
    highlightedClients,
    isLoading,
    getClient,
    toggleChecked,
    toggleCollaborator,
    toggleHighlight,
    togglePriority,
    updateClient,
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
  const [unitTab, setUnitTab] = useState("overview");

  const [taskClientId, setTaskClientId] = useState<string | null>(null);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [universeCategories, setUniverseCategories] = useState<Array<UniversoRamosCategory | "SEM_CATEGORIA">>([]);
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [openChallengesOpen, setOpenChallengesOpen] = useState(false);
  const [challengeUnitId, setChallengeUnitId] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<"units" | "challenges">("units");
  const {
    challenges,
    participantsByChallenge,
    valueRequests,
    createUniverseChallenge,
    importUniverseChallengeDrafts,
    acceptUniverseChallenge,
    resolveChallenge,
    requestChallengeValue,
    configureChallengeReward,
    reviewChallengeValueRequest,
    updateUniverseChallenge,
    deleteUniverseChallenges,
    conditionsByChallenge,
    setChallengeCompletionCondition,
  } = useChallenges();

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
    setUniverseCategories([]);
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
      const category = client.universeCategory ?? "SEM_CATEGORIA";
      if (universeCategories.length > 0 && !universeCategories.includes(category)) return false;

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
    return result.map((client) => {
      if (client.universeCategory !== "COLABORADOR") return client;
      const collaborator = centralCollaborators.find((person) =>
        person.id === client.universeCollaboratorId ||
        person.name.localeCompare(client.name, "pt-BR", { sensitivity: "base" }) === 0,
      );
      return collaborator
        ? { ...client, name: collaborator.name, initials: collaborator.initials, logoUrl: collaborator.photoUrl ?? client.logoUrl }
        : client;
    });
  }, [
    collaborators,
    centralCollaborators,
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
    universeCategories,
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

  const universeChallenges = useMemo(
    () => challenges.filter((challenge) =>
      (challenge.clientId && universeClients.some((client) => client.id === challenge.clientId)) ||
      (!challenge.clientId && ["company_general", "individual_goal"].includes(challenge.kind)),
    ),
    [challenges, universeClients],
  );
  const openUniverseChallenges = universeChallenges.filter((challenge) => challenge.status === "open" && challenge.rewardStatus === "configured");

  const toggleUniverseCategory = (category: UniversoRamosCategory | "SEM_CATEGORIA") => {
    setUniverseCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category]);
  };

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
                Cadastro
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setChallengeUnitId(null); setChallengeDialogOpen(true); }}>
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Novo desafio</span>
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Summary label="Cadastros" value={stats.total} icon={Globe2} onClick={clearFilters} />
            <Summary label="Tarefas" value={stats.tasks} icon={ListChecks} onClick={() => handleFilterFlagToggle("withJackbox")} active={filterFlags.withJackbox} />
            <Summary
              label="Comentários"
              value={stats.comments}
              icon={MessageCircle}
              onClick={() => handleFilterFlagToggle("withComments")}
              active={filterFlags.withComments}
            />
            <Summary label="Prioridades" value={stats.priority} icon={Star} onClick={() => handleFilterFlagToggle("priority")} active={filterFlags.priority} />
            <Summary label="Com responsáveis" value={stats.assigned} icon={Users} onClick={() => handleFilterFlagToggle("hasCollaborators")} active={filterFlags.hasCollaborators} />
            <Summary label="Desafios" value={universeChallenges.length} icon={Sparkles} onClick={() => setWorkspace("challenges")} active={workspace === "challenges"} />
          </div>

          <div className="mt-3 flex w-fit gap-1 border p-1">
            <button type="button" onClick={() => setWorkspace("units")} className={`h-8 px-3 text-xs font-medium ${workspace === "units" ? "bg-cyan-700 text-white" : "hover:bg-muted"}`}>Unidades internas</button>
            <button type="button" onClick={() => setWorkspace("challenges")} className={`h-8 px-3 text-xs font-medium ${workspace === "challenges" ? "bg-cyan-700 text-white" : "hover:bg-muted"}`}>Desafios e oportunidades</button>
          </div>
        </header>

        {workspace === "units" && <FilterBar
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
          extraControls={<UniverseCategoryControl selected={universeCategories} onToggle={toggleUniverseCategory} />}
          availableCollaborators={centralCollaborators}
        />}

        <main className="min-h-0 flex-1 overflow-auto p-3 sm:p-4">
          {workspace === "challenges" ? (
            <UniverseChallengesManager
              challenges={universeChallenges}
              valueRequests={valueRequests.filter((request) => universeChallenges.some((challenge) => challenge.id === request.challengeId))}
              participantsByChallenge={participantsByChallenge}
              conditionsByChallenge={conditionsByChallenge}
              units={universeClients}
              collaborators={centralCollaborators}
              currentUser={currentUser}
              canManage={isAdmin}
              onRequestValue={requestChallengeValue}
              onConfigureReward={configureChallengeReward}
              onReviewRequest={reviewChallengeValueRequest}
              onAccept={acceptUniverseChallenge}
              onUpdate={updateUniverseChallenge}
              onDelete={deleteUniverseChallenges}
              onToggleCondition={setChallengeCompletionCondition}
              onImportDrafts={importUniverseChallengeDrafts}
            />
          ) : isLoading ? (
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
            <MobileCompactGrid
              clients={visibleClients}
              highlightedClients={highlightedClients}
              getActiveTaskCount={getActiveTaskCount}
              getCommentCount={getCommentCount}
              onClientTap={(id) => { setUnitTab("overview"); setSelectedClientId(id); }}
              onCardAction={(id, action) => {
                setUnitTab(action === "comments" ? "comments" : action === "challenges" ? "challenges" : "tasks");
                setSelectedClientId(id);
              }}
            />

          ) : (
            <ClientGrid
              clients={visibleClients}
              selectedClientId={selectedClientId}
              highlightedClients={highlightedClients}
              getActiveTaskCount={getActiveTaskCount}
              getCommentCount={getCommentCount}
              allCollaborators={centralCollaborators}
              getAssignedCollaboratorIds={getAssignedCollaboratorIds}
              onSelectClient={(id) =>
                setSelectedClientId(id)
              }
              onHighlightClient={toggleHighlight}
              onTogglePriority={togglePriority}
              onToggleCollaboratorAssignment={toggleAssignment}
              onOpenChecklist={setSelectedClientId}
              onEditClient={setEditingClient}
              showHighlight={false}
              useUnitProfileAction
              onCreateChallenge={(clientId) => { setChallengeUnitId(clientId); setChallengeDialogOpen(true); }}
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
      <ClientQuickEditDialog
        client={editingClient}
        open={Boolean(editingClient)}
        onOpenChange={(open) => !open && setEditingClient(null)}
        onSave={async (client, data) => updateClient(client.id, data)}
        collaborators={centralCollaborators}
        linkedCollaboratorIds={universeClients
          .filter((client) => client.id !== editingClient?.id)
          .map((client) => client.universeCollaboratorId)
          .filter((id): id is string => Boolean(id))}
      />
      <UniverseChallengeDialog
        open={challengeDialogOpen}
        onOpenChange={setChallengeDialogOpen}
        units={universeClients}
        collaborators={centralCollaborators}
        defaultUnitId={challengeUnitId}
        onCreate={createUniverseChallenge}
      />
      <UniverseUnitDialog
        client={selectedClient}
        open={Boolean(selectedClient) && !isMobile}
        onOpenChange={(open) => !open && setSelectedClientId(null)}
        challenges={universeChallenges}
        participantsByChallenge={participantsByChallenge}
        conditionsByChallenge={conditionsByChallenge}
        collaborators={centralCollaborators}
        commentCount={selectedClient ? getCommentCount(selectedClient.id) : 0}
        taskCount={selectedClient ? getActiveTaskCount(selectedClient.id) : 0}
        tasks={selectedClient ? getTasksForClient(selectedClient.id) : []}
        canManage={isAdmin}
        onNewChallenge={() => { setChallengeUnitId(selectedClient?.id ?? null); setChallengeDialogOpen(true); }}
        onResolve={(challengeId, outcome) => void resolveChallenge(challengeId, outcome)}
        onUpdate={updateUniverseChallenge}
        onDelete={deleteUniverseChallenges}
        onOpenTasks={() => selectedClient && setTaskClientId(selectedClient.id)}
        onToggleTask={(taskId) => toggleComplete(taskId)}
        onToggleCondition={(conditionId, completed) => void setChallengeCompletionCondition(conditionId, completed)}
      />
      <OpenChallengesDialog
        open={openChallengesOpen}
        onOpenChange={setOpenChallengesOpen}
        challenges={openUniverseChallenges}
        units={universeClients}
        currentUser={currentUser}
        onAccept={acceptUniverseChallenge}
      />
    </AppLayout>
  );
}

function Summary({
  label,
  value,
  icon: Icon,
  onClick,
  active,
}: {
  label: string;
  value: number;
  icon: typeof Globe2;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} className={`flex h-9 items-center gap-2 border px-2.5 transition-colors ${active ? "border-cyan-500 bg-cyan-50" : "bg-background hover:bg-muted/60"}`}>
      <Icon className="h-3.5 w-3.5 text-cyan-700" />
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </button>
  );
}

function UniverseCategoryControl({ selected, onToggle }: { selected: Array<UniversoRamosCategory | "SEM_CATEGORIA">; onToggle: (category: UniversoRamosCategory | "SEM_CATEGORIA") => void }) {
  const categories: { value: UniversoRamosCategory | "SEM_CATEGORIA"; label: string }[] = [
    { value: "EMPRESA", label: "Empresas" },
    { value: "SETOR", label: "Setores" },
    { value: "COLABORADOR", label: "Colaboradores" },
    { value: "PROJETO", label: "Projetos" },
    { value: "SEM_CATEGORIA", label: "Sem categoria" },
  ];
  return <div className="flex items-center gap-1 border-l pl-2">{categories.map((category) => <button key={category.value} type="button" onClick={() => onToggle(category.value)} className={`h-7 px-2 text-[10px] font-medium ${selected.includes(category.value) ? "bg-cyan-700 text-white" : "bg-cyan-50 text-cyan-800 hover:bg-cyan-100"}`}>{category.label}</button>)}</div>;
}
