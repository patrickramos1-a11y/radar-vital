import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { User, UserPlus, UserX, Check, Link } from 'lucide-react';
import { Collaborator, CollaboratorMatchResult, collaboratorSimilarityScore, generateCollaboratorInitials, generateCollaboratorColor } from '@/types/collaborator';
import { useCollaborators } from '@/hooks/useCollaborators';

interface CollaboratorMatchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  responsaveisToMatch: string[];
  onComplete: (results: CollaboratorMatchResult[]) => void;
}

export function CollaboratorMatchDialog({
  isOpen,
  onClose,
  responsaveisToMatch,
  onComplete,
}: CollaboratorMatchDialogProps) {
  const { collaborators, addCollaborator } = useCollaborators();
  const [matchResults, setMatchResults] = useState<CollaboratorMatchResult[]>([]);
  const [creatingNew, setCreatingNew] = useState<string | null>(null);
  const [newCollabName, setNewCollabName] = useState('');
  const [processing, setProcessing] = useState(false);

  // Initialize match results when dialog opens
  useEffect(() => {
    if (!isOpen || responsaveisToMatch.length === 0) return;

    const results: CollaboratorMatchResult[] = responsaveisToMatch.map(responsavel => {
      // Try to find exact match first
      const exactMatch = collaborators.find(
        c => c.name.toLowerCase() === responsavel.toLowerCase()
      );

      if (exactMatch) {
        return {
          responsavelExcel: responsavel,
          collaboratorId: exactMatch.id,
          collaboratorName: exactMatch.name,
          matchType: 'exact' as const,
        };
      }

      // Find suggestions
      const suggestions = collaborators
        .map(c => ({
          id: c.id,
          name: c.name,
          score: collaboratorSimilarityScore(responsavel, c.name),
        }))
        .filter(s => s.score >= 0.3)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      if (suggestions.length > 0 && suggestions[0].score >= 0.7) {
        return {
          responsavelExcel: responsavel,
          collaboratorId: suggestions[0].id,
          collaboratorName: suggestions[0].name,
          matchType: 'suggested' as const,
          suggestions,
        };
      }

      return {
        responsavelExcel: responsavel,
        matchType: 'none' as const,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };
    });

    setMatchResults(results);
  }, [isOpen, responsaveisToMatch, collaborators]);

  const handleSelectCollaborator = (responsavel: string, collaboratorId: string) => {
    const collab = collaborators.find(c => c.id === collaboratorId);
    setMatchResults(prev => prev.map(r => 
      r.responsavelExcel === responsavel
        ? {
            ...r,
            collaboratorId,
            collaboratorName: collab?.name,
            matchType: 'suggested' as const,
            createNew: false,
            ignored: false,
          }
        : r
    ));
  };

  const handleIgnore = (responsavel: string) => {
    setMatchResults(prev => prev.map(r => 
      r.responsavelExcel === responsavel
        ? {
            ...r,
            collaboratorId: undefined,
            collaboratorName: undefined,
            ignored: true,
            createNew: false,
          }
        : r
    ));
  };

  const handleCreateNew = async (responsavel: string) => {
    setCreatingNew(responsavel);
    setNewCollabName(responsavel);
  };

  const handleConfirmCreate = async () => {
    if (!creatingNew || !newCollabName.trim()) return;
    
    setProcessing(true);
    
    const color = generateCollaboratorColor();
    const initials = generateCollaboratorInitials(newCollabName);
    
    const newCollab = await addCollaborator(newCollabName.trim(), color, initials);
    
    if (newCollab) {
      setMatchResults(prev => prev.map(r => 
        r.responsavelExcel === creatingNew
          ? {
              ...r,
              collaboratorId: newCollab.id,
              collaboratorName: newCollab.name,
              createNew: true,
              ignored: false,
            }
          : r
      ));
    }
    
    setCreatingNew(null);
    setNewCollabName('');
    setProcessing(false);
  };

  const handleComplete = () => {
    onComplete(matchResults);
    onClose();
  };

  const unmatchedCount = matchResults.filter(r => !r.collaboratorId && !r.ignored).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Vincular Responsáveis
          </DialogTitle>
          <DialogDescription>
            Encontramos {responsaveisToMatch.length} responsáveis no arquivo. 
            Vincule cada um a um colaborador existente, crie um novo ou ignore.
          </DialogDescription>
        </DialogHeader>

        {creatingNew ? (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do novo colaborador</Label>
              <Input
                value={newCollabName}
                onChange={(e) => setNewCollabName(e.target.value)}
                placeholder="Nome do colaborador"
                disabled={processing}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCreatingNew(null)}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmCreate}
                disabled={processing || !newCollabName.trim()}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Criar colaborador
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-3">
              {matchResults.map((result) => (
                <div 
                  key={result.responsavelExcel}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{result.responsavelExcel}</div>
                    {result.matchType === 'exact' && (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Vinculado
                      </Badge>
                    )}
                    {result.collaboratorId && result.matchType === 'suggested' && (
                      <Badge variant="default" className="bg-blue-500">
                        <Link className="h-3 w-3 mr-1" />
                        Vinculado
                      </Badge>
                    )}
                    {result.ignored && (
                      <Badge variant="secondary">
                        <UserX className="h-3 w-3 mr-1" />
                        Ignorado
                      </Badge>
                    )}
                  </div>

                  {!result.ignored && (
                    <div className="flex flex-wrap gap-2">
                      <Select
                        value={result.collaboratorId || 'none'}
                        onValueChange={(value) => {
                          if (value !== 'none') {
                            handleSelectCollaborator(result.responsavelExcel, value);
                          }
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Selecionar colaborador..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" disabled>Selecionar...</SelectItem>
                          {collaborators.map(collab => (
                            <SelectItem key={collab.id} value={collab.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full flex-shrink-0" 
                                  style={{ backgroundColor: collab.color }}
                                />
                                {collab.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateNew(result.responsavelExcel)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Criar novo
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleIgnore(result.responsavelExcel)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Ignorar
                      </Button>
                    </div>
                  )}

                  {result.ignored && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setMatchResults(prev => prev.map(r => 
                        r.responsavelExcel === result.responsavelExcel
                          ? { ...r, ignored: false }
                          : r
                      ))}
                    >
                      Desfazer
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <Separator />

        <DialogFooter className="flex-row justify-between">
          <div className="text-sm text-muted-foreground">
            {unmatchedCount > 0 ? (
              <span className="text-yellow-600">
                {unmatchedCount} responsável(is) não vinculado(s)
              </span>
            ) : (
              <span className="text-green-600">
                Todos os responsáveis foram processados
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleComplete}>
              Confirmar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
