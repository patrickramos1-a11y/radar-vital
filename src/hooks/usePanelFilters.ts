import { useState, useMemo } from "react";
import { Client, CollaboratorName } from "@/types/client";
import { FilterFlags } from "@/components/visual-panels/VisualPanelFilters";

export type PanelSortOption = 'order' | 'name' | 'priority' | 'jackbox';
export type PanelSortDirection = 'asc' | 'desc';

interface UsePanelFiltersOptions {
  clients: Client[];
  highlightedClients: Set<string>;
  getActiveTaskCount?: (id: string) => number;
  defaultSort?: PanelSortOption;
  customSorter?: (a: Client, b: Client, sortBy: PanelSortOption, multiplier: number) => number | null;
}

export function usePanelFilters({ 
  clients, 
  highlightedClients,
  getActiveTaskCount,
  defaultSort = 'order',
  customSorter 
}: UsePanelFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<PanelSortOption>(defaultSort);
  const [sortDirection, setSortDirection] = useState<PanelSortDirection>('desc');
  const [collaboratorFilters, setCollaboratorFilters] = useState<CollaboratorName[]>([]);
  
  const [filterFlags, setFilterFlags] = useState<FilterFlags>({
    priority: false,
    highlighted: false,
    selected: false,
    hasCollaborators: false,
    withJackbox: false,
    withComments: false,
  });

  const filteredClients = useMemo(() => {
    let result = [...clients];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => c.name.toLowerCase().includes(q));
    }

    if (collaboratorFilters.length > 0) {
      result = result.filter(c => collaboratorFilters.some(name => c.collaborators[name]));
    }

    const multiplier = sortDirection === 'desc' ? 1 : -1;
    result.sort((a, b) => {
      if (customSorter) {
        const custom = customSorter(a, b, sortBy, multiplier);
        if (custom !== null) return custom;
      }
      
      switch (sortBy) {
        case 'name': result.sort((a, b) => a.name.localeCompare(b.name)); break;
        case 'priority': result.sort((a, b) => {
          if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
          return a.order - b.order;
        }); break;
        default: result.sort((a, b) => a.order - b.order);
      }
      return 0;
    });

    return result;
  }, [clients, searchQuery, sortBy, sortDirection, collaboratorFilters, highlightedClients, customSorter]);

  const handleCollaboratorFilterToggle = (name: CollaboratorName) => {
    setCollaboratorFilters(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleFilterFlagToggle = (flag: keyof FilterFlags) => {
    setFilterFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setCollaboratorFilters([]);
    setFilterFlags({
      priority: false,
      highlighted: false,
      selected: false,
      hasCollaborators: false,
      withJackbox: false,
      withComments: false,
    });
  };

  const counts = {
    highlighted: clients.filter(c => highlightedClients.has(c.id)).length,
    jackbox: getActiveTaskCount ? clients.filter(c => getActiveTaskCount(c.id) > 0).length : 0,
    checked: clients.filter(c => c.isChecked).length,
  };

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    collaboratorFilters,
    setCollaboratorFilters,
    filteredClients,
    filterFlags,
    counts,
    handleFilterFlagToggle,
    handleCollaboratorFilterToggle,
    handleClearFilters,
  };
}
