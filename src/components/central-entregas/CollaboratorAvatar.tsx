import { useCollaborators } from '@/hooks/useCollaborators';
import { cn } from '@/lib/utils';
import { normalizeAssignee } from '@/lib/taskAssignee';

interface Props {
  name: string;
  size?: number;
  color?: string;
  initials?: string;
  className?: string;
  ring?: boolean;
}

/**
 * Renders collaborator photo when available, otherwise colored initials.
 * Looks up the collaborator by name so it can be used with just a name string.
 */
export function CollaboratorAvatar({ name, size = 32, color, initials, className, ring }: Props) {
  const { collaborators } = useCollaborators();
  const target = normalizeAssignee(name);
  const c = collaborators.find(x => normalizeAssignee(x.name) === target);
  const photo = c?.photoUrl;
  const bg = c?.color || color || '#6B9B37';
  const ini = c?.initials || initials || name.slice(0, 2).toUpperCase();

  const style = { width: size, height: size, fontSize: Math.max(9, Math.floor(size * 0.4)) };

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        style={style}
        className={cn('rounded-full object-cover shrink-0', ring && 'ring-2 ring-white', className)}
      />
    );
  }

  return (
    <div
      style={{ ...style, backgroundColor: bg }}
      className={cn('rounded-full flex items-center justify-center font-bold text-white shrink-0', ring && 'ring-2 ring-white', className)}
    >
      {ini}
    </div>
  );
}
