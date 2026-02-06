import { useMemo, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Play, Pause, SkipForward, SkipBack, Settings, Clock, 
  Monitor, Star, Sparkles, Users, MessageSquare, Building2, X, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useClients } from "@/contexts/ClientContext";
import { useTasks } from "@/hooks/useTasks";
import { useAllClientsCommentCountsWithRefresh } from "@/hooks/useClientComments";
import { useTVMode } from "@/hooks/useTVMode";
import { TVClientCard } from "@/components/tv/TVClientCard";
import { Client, COLLABORATOR_NAMES, COLLABORATOR_COLORS, calculateTotalDemands } from "@/types/client";
import { cn } from "@/lib/utils";

export default function TVMode() {
  const navigate = useNavigate();
  const { activeClients, highlightedClients } = useClients();
  const { getActiveTaskCount } = useTasks();
  const [commentCounts] = useAllClientsCommentCountsWithRefresh();
  const getCommentCount = useCallback((clientId: string) => commentCounts.get(clientId) || 0, [commentCounts]);
  const {
    scenes,
    currentSceneIndex,
    currentScene,
    isPlaying,
    remainingSeconds,
    play,
    pause,
    nextScene,
    previousScene,
  } = useTVMode();

  const handleExit = () => {
    navigate('/');
  };

  // Current time
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Filter clients based on current scene
  const filteredClients = useMemo(() => {
    const { filtros } = currentScene;
    let result = [...activeClients];

    // Filter by client type
    if (filtros.tipoCliente !== 'TODOS') {
      result = result.filter(c => c.clientType === filtros.tipoCliente);
    }

    // Filter by collaborator
    if (filtros.responsavel) {
      result = result.filter(c => c.collaborators[filtros.responsavel!]);
    }

    // Filter by recorte
    switch (filtros.recorte) {
      case 'prioridade':
        result = result.filter(c => c.isPriority);
        break;
      case 'destaque':
        result = result.filter(c => highlightedClients.has(c.id));
        break;
      case 'responsaveis':
        result = result.filter(c => 
          COLLABORATOR_NAMES.some(name => c.collaborators[name])
        );
        break;
      case 'comentarios':
        result = result.filter(c => getCommentCount(c.id) > 0);
        break;
      case 'checklist':
        result = result.filter(c => getActiveTaskCount(c.id) > 0);
        break;
    }

    // Sort
    switch (filtros.ordenarPor) {
      case 'prioridade':
        result.sort((a, b) => {
          if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
          return a.order - b.order;
        });
        break;
      case 'nome':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'demandas':
        result.sort((a, b) => calculateTotalDemands(b.demands) - calculateTotalDemands(a.demands));
        break;
      case 'ordem':
      default:
        result.sort((a, b) => a.order - b.order);
        break;
    }

    return result;
  }, [activeClients, currentScene, highlightedClients, getCommentCount, getActiveTaskCount]);

  // Calculate grid columns based on client count and density
  const gridColumns = useMemo(() => {
    const count = filteredClients.length;
    const { densidade } = currentScene.filtros;
    
    if (densidade === 'gigante') {
      if (count <= 4) return 2;
      if (count <= 9) return 3;
      return 4;
    }
    
    if (densidade === 'compacta') {
      if (count <= 16) return 4;
      if (count <= 36) return 6;
      if (count <= 64) return 8;
      return 10;
    }
    
    // normal
    if (count <= 6) return 3;
    if (count <= 12) return 4;
    if (count <= 20) return 5;
    if (count <= 30) return 6;
    if (count <= 42) return 7;
    return 8;
  }, [filteredClients.length, currentScene.filtros]);

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  };

  const formatRemaining = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = ((currentScene.duracaoSegundos - remainingSeconds) / currentScene.duracaoSegundos) * 100;

  // Get scene icon
  const getSceneIcon = () => {
    const { recorte, responsavel } = currentScene.filtros;
    if (recorte === 'prioridade') return <Star className="w-5 h-5 text-amber-500" />;
    if (recorte === 'destaque') return <Sparkles className="w-5 h-5 text-blue-500" />;
    if (recorte === 'responsaveis') return <Users className="w-5 h-5 text-violet-500" />;
    if (recorte === 'comentarios') return <MessageSquare className="w-5 h-5 text-emerald-500" />;
    if (recorte === 'checklist') return <CheckSquare className="w-5 h-5 text-primary" />;
    if (responsavel) {
      return (
        <div 
          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: COLLABORATOR_COLORS[responsavel] }}
        >
          {responsavel.charAt(0).toUpperCase()}
        </div>
      );
    }
    return <Monitor className="w-5 h-5 text-muted-foreground" />;
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col overflow-hidden">
      {/* Top Control Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-card border-b border-border shrink-0">
        {/* Left: Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousScene}
            className="gap-1"
          >
            <SkipBack className="w-4 h-4" />
          </Button>
          
          <Button
            variant={isPlaying ? "default" : "outline"}
            size="sm"
            onClick={isPlaying ? pause : play}
            className="gap-1 min-w-[80px]"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4" />
                Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Play
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={nextScene}
            className="gap-1"
          >
            <SkipForward className="w-4 h-4" />
          </Button>

          {/* Settings Popover */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Roteiro de Cenas</h4>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {scenes.map((scene, idx) => (
                    <button
                      key={scene.id}
                      onClick={() => {
                        pause();
                        // Direct scene navigation would need goToScene but let's use nextScene loop
                      }}
                      className={cn(
                        "w-full text-left px-2 py-1.5 rounded text-sm transition-colors",
                        idx === currentSceneIndex 
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span>{scene.titulo}</span>
                        <span className="text-xs opacity-70">{scene.duracaoSegundos}s</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Center: Current Scene Info */}
        <div className="flex-1 flex flex-col items-center gap-1 px-4">
          <div className="flex items-center gap-2">
            {getSceneIcon()}
            <span className="font-semibold text-foreground">{currentScene.titulo}</span>
            <span className="text-sm text-muted-foreground">
              ({currentSceneIndex + 1}/{scenes.length})
            </span>
          </div>
          <div className="flex items-center gap-3 w-full max-w-md">
            <Progress value={progressPercent} className="flex-1 h-2" />
            <span className="text-sm font-mono text-muted-foreground min-w-[50px]">
              {formatRemaining(remainingSeconds)}
            </span>
          </div>
        </div>

        {/* Right: Clock + Exit */}
        <div className="flex items-center gap-3 text-right">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-xl font-bold text-foreground">{formatTime(currentTime)}</span>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{formatDate(currentTime)}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExit}
            className="gap-1 text-muted-foreground hover:text-destructive hover:border-destructive"
          >
            <X className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex items-center justify-center gap-4 px-4 py-2 bg-muted/30 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">{filteredClients.length} empresas</span>
        </div>
        {currentScene.filtros.tipoCliente !== 'TODOS' && (
          <span className={cn(
            "px-2 py-0.5 rounded text-xs font-bold",
            currentScene.filtros.tipoCliente === 'AC' 
              ? "bg-emerald-500/20 text-emerald-600" 
              : "bg-amber-500/20 text-amber-600"
          )}>
            {currentScene.filtros.tipoCliente}
          </span>
        )}
        {currentScene.filtros.responsavel && (
          <span 
            className="px-2 py-0.5 rounded text-xs font-bold text-white"
            style={{ backgroundColor: COLLABORATOR_COLORS[currentScene.filtros.responsavel] }}
          >
            {currentScene.filtros.responsavel.charAt(0).toUpperCase() + currentScene.filtros.responsavel.slice(1)}
          </span>
        )}
      </div>

      {/* Client Grid */}
      <div 
        className="flex-1 p-4 overflow-hidden"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
          gap: '12px',
          alignContent: 'start',
        }}
      >
        {filteredClients.map((client, idx) => (
          <TVClientCard
            key={client.id}
            client={client}
            displayNumber={idx + 1}
            isHighlighted={highlightedClients.has(client.id)}
            commentCount={getCommentCount(client.id)}
            taskCount={getActiveTaskCount(client.id)}
            density={currentScene.filtros.densidade}
          />
        ))}
        
        {filteredClients.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-[50vh] text-muted-foreground">
            <div className="text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Nenhuma empresa nesta cena</p>
              <p className="text-sm opacity-70">A próxima cena começa em {formatRemaining(remainingSeconds)}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
