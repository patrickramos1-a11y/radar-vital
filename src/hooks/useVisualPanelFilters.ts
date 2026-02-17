import { useState, useMemo } from "react";
import { Client, CollaboratorName } from "@/types/client";
import { VisualSortOption, VisualSortDirection, VisualClientTypeFilter, FilterFlags } from "@/components/visual-panels/VisualPanelFilters";

interface UseVisualPanelFiltersOptions {
  clients: Client[];
  highlightedClients: Set<string>;
  getActiveTaskCount?: (id: string) => number;
  defaultSort?: VisualSortOption;
  customSorter?: (a: Client, b: Client, sortBy: VisualSortOption, multiplier: number) => number | null;
}

export function useVisualPanelFilters({ 
  clients, 
  highlightedClients, 
  getActiveTaskCount, 
  defaultSort = 'order',
  customSorter 
}: UseVisualPanelFiltersOptions) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<VisualSortOption>(defaultSort);
  const [sortDirection, setSortDirection] = useState<VisualSortDirection>('desc');
  const [clientTypeFilter, setClientTypeFilter] = useState<VisualClientTypeFilter>('all');
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
      result = result.filter(c => c.name.toLowerCase().includes(q) || c.initials.toLowerCase().includes(q));
    }

    if (clientTypeFilter !== 'all') {
      result = result.filter(c => c.clientType === clientTypeFilter);
    }

    if (collaboratorFilters.length > 0) {
      result = result.filter(c => collaboratorFilters.some(name => c.collaborators[name]));
    }

    // Apply flags
    if (filterFlags.priority) result = result.filter(c => c.isPriority);
    if (filterFlags.highlighted) result = result.filter(c => highlightedClients.has(c.id));
    if (filterFlags.selected) result = result.filter(c => c.isChecked);
    
    // Sort
    const multiplier = sortDirection === 'desc' ? 1 : -1;
    result.sort((a, b) => {
      if (customSorter) {
        const custom = customSorter(a, b, sortBy, multiplier);
        if (custom !== null) return custom;
      }
      
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name) * multiplier;
        case 'priority':
          if (a.isPriority !== b.isPriority) return (a.isPriority ? -1 : 1) * multiplier;
          return (a.order - b.order) * multiplier;
        default: return (a.order - b.order) * multiplier;
      }
    });

    return result;
  }, [clients, searchQuery, clientTypeFilter, collaboratorFilters, sortBy, sortDirection, highlightedClients, filterFlags, customSorter]);

  const handleCollaboratorFilterToggle = (name: CollaboratorName) => {
    setCollaboratorFilters(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleFilterFlagToggle = (flag: keyof FilterFlags) => {
    setFilterFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setClientTypeFilter('all');
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
    clientTypeFilter,
    setClientTypeFilter,
    collaboratorFilters,
    filteredClients,
    filterFlags,
    counts,
    handleFilterFlagToggle,
    handleCollaboratorFilterToggle,
    handleClearFilters,
  };
}
