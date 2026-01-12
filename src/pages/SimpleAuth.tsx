import { useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User } from 'lucide-react';

const VALID_NAMES = ['Patrick', 'Celine', 'Gabi', 'Darley', 'Vanessa'];

export default function SimpleAuthPage() {
  const [userName, setUserName] = useState('');
  const { login } = useUser();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const success = login(userName);
    
    if (success) {
      toast.success(`Bem-vindo(a), ${userName}!`);
    } else {
      toast.error('Usuário não encontrado. Use: Patrick, Celine, Gabi, Darley ou Vanessa');
    }
  };

  const handleQuickLogin = (name: string) => {
    const success = login(name);
    if (success) {
      toast.success(`Bem-vindo(a), ${name}!`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <User className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold">Painel AC</CardTitle>
          <CardDescription>
            Digite seu nome para entrar no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Seu nome</Label>
              <Input
                id="userName"
                type="text"
                placeholder="Digite seu nome..."
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                autoComplete="off"
                autoFocus
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Entrar
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                ou clique para entrar
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {VALID_NAMES.map((name) => (
              <Button
                key={name}
                variant="outline"
                onClick={() => handleQuickLogin(name)}
                className="text-base py-6"
              >
                {name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
