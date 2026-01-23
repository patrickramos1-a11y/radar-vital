import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCollaborators } from '@/hooks/useCollaborators';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { 
  normalizeCollaboratorName, 
  collaboratorSimilarityScore 
} from '@/types/collaborator';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string>('none');
  const [suggestedCollaborator, setSuggestedCollaborator] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { signUp } = useAuth();
  const { collaborators } = useCollaborators();
  const navigate = useNavigate();

  // Check for matching collaborator when name changes
  useEffect(() => {
    if (!displayName.trim() || collaborators.length === 0) {
      setSuggestedCollaborator(null);
      return;
    }

    const normalized = normalizeCollaboratorName(displayName);
    
    // Find exact or close match
    for (const collab of collaborators) {
      const score = collaboratorSimilarityScore(displayName, collab.name);
      if (score >= 0.7) {
        setSuggestedCollaborator(collab.id);
        return;
      }
    }
    
    setSuggestedCollaborator(null);
  }, [displayName, collaborators]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!displayName.trim()) {
      setError('Digite seu nome');
      return;
    }

    setLoading(true);

    const { error } = await signUp(email, password, displayName.trim());

    if (error) {
      if (error.message.includes('already registered')) {
        setError('Este email já está cadastrado');
      } else {
        setError(error.message);
      }
      setLoading(false);
    } else {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-primary-foreground font-bold text-3xl">AC</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Painel AC</h1>
        <p className="text-muted-foreground mt-1">SISRAMOS</p>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Criar conta</CardTitle>
          <CardDescription>
            Preencha os dados para se cadastrar no sistema
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="displayName">Nome completo</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Seu nome"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Suggested collaborator match */}
            {suggestedCollaborator && (
              <Alert>
                <AlertDescription>
                  Encontramos um colaborador com nome similar. Deseja vincular sua conta?
                </AlertDescription>
                <div className="mt-2">
                  <Select 
                    value={selectedCollaboratorId} 
                    onValueChange={setSelectedCollaboratorId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não vincular</SelectItem>
                      {collaborators.map(collab => (
                        <SelectItem key={collab.id} value={collab.id}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: collab.color }}
                            />
                            {collab.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando conta...
                </>
              ) : (
                'Criar conta'
              )}
            </Button>
            
            <p className="text-sm text-muted-foreground text-center">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Entrar
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
