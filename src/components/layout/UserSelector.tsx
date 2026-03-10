import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, LogOut, User } from 'lucide-react';

export function UserSelector() {
  const { currentUser, collaborators, selectUser, clearUser } = useAuth();

  if (!currentUser) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors border border-border/50">
          <div className="w-6 h-6 rounded-full bg-muted-foreground/30 flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
            Selecionar usuário
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {collaborators.map((collab) => (
            <DropdownMenuItem
              key={collab.id}
              onClick={() => selectUser(collab)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
                style={{ backgroundColor: collab.color }}
              >
                {collab.initials}
              </div>
              <span className="text-sm">{collab.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:bg-secondary/50 border border-transparent hover:border-border/50">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ring-2 ring-offset-1 ring-offset-background shadow-sm"
          style={{ backgroundColor: currentUser.color }}
        >
          {currentUser.initials}
        </div>
        <span
          className="text-xs font-semibold hidden sm:inline"
          style={{ color: currentUser.color }}
        >
          {currentUser.name}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {collaborators.map((collab) => (
          <DropdownMenuItem
            key={collab.id}
            onClick={() => selectUser(collab)}
            className={`flex items-center gap-2 cursor-pointer ${collab.id === currentUser.id ? 'bg-accent/20' : ''}`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ backgroundColor: collab.color }}
            >
              {collab.initials}
            </div>
            <span className="text-sm">{collab.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={clearUser}
          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
        >
          <LogOut className="w-4 h-4" />
          <span>Trocar usuário</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
