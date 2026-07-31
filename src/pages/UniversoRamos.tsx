import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe2,
  ListChecks,
  MessageCircle,
  MonitorUp,
  Search,
  Star,
  UserPlus,
  Users,
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ClientCard } from "@/components/dashboard/ClientCard";
import { NewClientDialog } from "@/components/dashboard/NewClientDialog";
import { ClientWorkDialog } from "@/components/client-work/ClientWorkDialog";
import { MobileCompactGrid } from "@/components/mobile/MobileCompactGrid";
import { MobileClientDetail } from "@/components/mobile/MobileClientDetail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [taskClientId, setTaskClientId] = useState<string | null>(null);
  const [newClientOpen, setNewClientOpen] = useState(false);

  const getCommentCount = useCallback(
    (clientId: string) => commentCounts.get(clientId) ?? 0,
    [commentCounts],
  );

  const visibleClients = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    if (!query) return universeClients;
    return universeClients.filter(
      (client) =>
        client.name.toLocaleLowerCase("pt-BR").includes(query) ||
        client.initials.toLocaleLowerCase("pt-BR").includes(query),
    );
  }, [search, universeClients]);

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
            <div className="relative ml-auto w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar no Universo Ramos"
                className="pl-9"
              />
            </div>
          </div>
        </header>

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
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleClients.map((client, index) => (
                <div key={client.id} className="min-h-[310px]">
                  <ClientCard
                    client={client}
                    displayNumber={index + 1}
                    isSelected={selectedClientId === client.id}
                    isHighlighted={highlightedClients.has(client.id)}
                    activeTaskCount={getActiveTaskCount(client.id)}
                    commentCount={getCommentCount(client.id)}
                    allCollaborators={collaborators}
                    assignedCollaboratorIds={getAssignedCollaboratorIds(
                      client.id,
                    )}
                    onSelect={(id) =>
                      setSelectedClientId((current) =>
                        current === id ? null : id,
                      )
                    }
                    onHighlight={toggleHighlight}
                    onTogglePriority={togglePriority}
                    onToggleCollaboratorAssignment={toggleAssignment}
                    onOpenChecklist={setTaskClientId}
                    clientCount={visibleClients.length}
                    fitAll={false}
                  />
                </div>
              ))}
            </div>
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
