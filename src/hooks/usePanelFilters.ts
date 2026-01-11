import { useState, useMemo, useCallback } from "react";
import { Client, CollaboratorName } from "@/types/client";
import { PanelFilterFlags, PanelSortOption, SortDirection } from "@/components/panels/PanelFilters";

interface UsePanelFiltersProps {
  clients: Client[];
  highlightedClients: Set<string>;
  getActiveTaskCount: (clientId: string) => number;
  defaultSort?: PanelSortOption;
  customSorter?: (a: Client, b: Client, sortBy: PanelSortOption, multiplier: number) => number | null;
}

export function usePanelFilters({
  clients,
  highlightedClients,
  getActiveTaskCount,
  defaultSort = 'priority',
  customSorter,
}: UsePanelFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<PanelSortOption>(defaultSort);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterFlags, setFilterFlags] = useState<PanelFilterFlags>({
    priority: false,
    highlighted: false,
    withJackbox: false,
    checked: false,
  });
  const [collaboratorFilters, setCollaboratorFilters] = useState<CollaboratorName[]>([]);

  // Counts for filter badges
  const counts = useMemo(() => ({
    highlighted: highlightedClients.size,
    jackbox: clients.filter(c => getActiveTaskCount(c.id) > 0).length,
    checked: clients.filter(c => c.isChecked).length,
  }), [clients, highlightedClients, getActiveTaskCount]);

  // Toggle filter flag
  const handleFilterFlagToggle = useCallback((flag: keyof PanelFilterFlags) => {
    setFilterFlags(prev => ({
      ...prev,
      [flag]: !prev[flag],
    }));
  }, []);

  // Toggle collaborator filter
  const handleCollaboratorFilterToggle = useCallback((collaborator: CollaboratorName) => {
    setCollaboratorFilters(prev => 
      prev.includes(collaborator)
        ? prev.filter(c => c !== collaborator)
        : [...prev, collaborator]
    );
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setFilterFlags({
      priority: false,
      highlighted: false,
      withJackbox: false,
      checked: false,
    });
    setCollaboratorFilters([]);
  }, []);

  // Filter and sort clients
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(query) ||
        c.initials.toLowerCase().includes(query)
      );
    }

    // Flag filters
    if (filterFlags.priority) {
      result = result.filter(c => c.isPriority);
    }
    if (filterFlags.highlighted) {
      result = result.filter(c => highlightedClients.has(c.id));
    }
    if (filterFlags.withJackbox) {
      result = result.filter(c => getActiveTaskCount(c.id) > 0);
    }
    if (filterFlags.checked) {
      result = result.filter(c => c.isChecked);
    }

    // Collaborator filters (OR logic)
    if (collaboratorFilters.length > 0) {
      result = result.filter(c => 
        collaboratorFilters.some(collab => c.collaborators[collab])
      );
    }

    // Sort
    const multiplier = sortDirection === 'desc' ? 1 : -1;
    
    result.sort((a, b) => {
      // Check custom sorter first
      if (customSorter) {
        const customResult = customSorter(a, b, sortBy, multiplier);
        if (customResult !== null) return customResult;
      }

      switch (sortBy) {
        case 'priority':
          if (a.isPriority !== b.isPriority) {
            return (a.isPriority ? -1 : 1) * multiplier;
          }
          return a.name.localeCompare(b.name);
        
        case 'jackbox':
          const aCount = getActiveTaskCount(a.id);
          const bCount = getActiveTaskCount(b.id);
          if (aCount !== bCount) {
            return (bCount - aCount) * multiplier;
          }
          return a.name.localeCompare(b.name);
        
        case 'checked':
          if (a.isChecked !== b.isChecked) {
            return (a.isChecked ? -1 : 1) * multiplier;
          }
          return a.name.localeCompare(b.name);
        
        case 'name':
          return a.name.localeCompare(b.name) * multiplier;
        
        default:
          return 0;
      }
    });

    return result;
  }, [clients, searchQuery, filterFlags, collaboratorFilters, sortBy, sortDirection, highlightedClients, getActiveTaskCount, customSorter]);

  return {
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    filterFlags,
    collaboratorFilters,
    counts,
    filteredClients,
    handleFilterFlagToggle,
    handleCollaboratorFilterToggle,
    handleClearFilters,
  };
}
