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
        <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
          <div className="w-6 h-6 rounded-full bg-muted-foreground flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
            Selecionar usuário
          </span>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {collaborators.map((collab) => (
            <DropdownMenuItem
              key={collab.id}
              onClick={() => selectUser(collab)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: collab.color }}
              >
                {collab.initials}
              </div>
              <span>{collab.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors hover:opacity-80" style={{ backgroundColor: `${currentUser.color}20` }}>
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
          style={{ backgroundColor: currentUser.color }}
        >
          {currentUser.initials}
        </div>
        <span
          className="text-sm font-medium hidden sm:inline"
          style={{ color: currentUser.color }}
        >
          {currentUser.name}
        </span>
        <ChevronDown className="w-4 h-4" style={{ color: currentUser.color }} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {collaborators.map((collab) => (
          <DropdownMenuItem
            key={collab.id}
            onClick={() => selectUser(collab)}
            className={`flex items-center gap-2 cursor-pointer ${collab.id === currentUser.id ? 'bg-accent' : ''}`}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: collab.color }}
            >
              {collab.initials}
            </div>
            <span>{collab.name}</span>
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
