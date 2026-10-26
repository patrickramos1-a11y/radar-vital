import { ChevronDown, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserSelector() {
  const { currentUser, collaborators, selectUser, clearUser } = useAuth();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label={currentUser ? `Perfil: ${currentUser.name}` : "Selecionar usuário"} className="flex h-9 items-center gap-1 rounded-md border border-transparent px-1.5 transition-colors hover:border-border/50 hover:bg-secondary/50 sm:gap-2 sm:px-2">
        {currentUser ? (
          currentUser.photoUrl ? (
            <img src={currentUser.photoUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: currentUser.color }}>
              {currentUser.initials}
            </div>
          )
        ) : (
          <div className="grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
        )}
        <span className="hidden text-xs font-semibold lg:inline" style={{ color: currentUser?.color }}>
          {currentUser?.name ?? "Selecionar usuário"}
        </span>
        <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        {collaborators.map((collaborator) => (
          <DropdownMenuItem
            key={collaborator.id}
            className="flex cursor-pointer items-center gap-2"
            onClick={() => selectUser(collaborator)}
          >
            <div className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: collaborator.color }}>
              {collaborator.initials}
            </div>
            <span>{collaborator.name}</span>
          </DropdownMenuItem>
        ))}
        {currentUser && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex cursor-pointer items-center gap-2 text-muted-foreground" onClick={clearUser}>
              <LogOut className="h-4 w-4" />
              Trocar usuário
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
