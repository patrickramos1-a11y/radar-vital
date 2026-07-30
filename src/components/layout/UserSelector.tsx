import { ChevronDown, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserSelector() {
  const { currentUser, isAdmin, signOut } = useAuth();

  if (!currentUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 transition-colors hover:bg-secondary/50 border border-transparent hover:border-border/50">
        {currentUser.photoUrl ? (
          <img
            src={currentUser.photoUrl}
            alt=""
            className="w-7 h-7 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-7 h-7 rounded-full grid place-items-center text-white text-xs font-bold shadow-sm"
            style={{ backgroundColor: currentUser.color }}
          >
            {currentUser.initials}
          </div>
        )}
        <span
          className="text-xs font-semibold hidden sm:inline"
          style={{ color: currentUser.color }}
        >
          {currentUser.name}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <div className="px-2 py-2">
          <p className="text-sm font-medium">{currentUser.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {currentUser.email}
          </p>
        </div>
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 flex items-center gap-2 text-xs text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Administrador
            </div>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => void signOut()}
          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
        >
          <LogOut className="w-4 h-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
