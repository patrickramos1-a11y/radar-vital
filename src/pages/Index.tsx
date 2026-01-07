import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ClientGrid } from "@/components/dashboard/ClientGrid";
import { useClients } from "@/contexts/ClientContext";
import { calculateTotals } from "@/types/client";

const Index = () => {
  const { activeClients } = useClients();
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  const totals = useMemo(() => calculateTotals(activeClients), [activeClients]);

  const handleSelectClient = (id: string) => {
    setSelectedClientId(prev => prev === id ? null : id);
  };

  const togglePresentationMode = () => {
    setIsPresentationMode(prev => !prev);
  };

  return (
    <div className={`
      flex flex-col h-screen w-screen overflow-hidden
      ${isPresentationMode ? 'presentation-mode' : ''}
    `}>
      {/* Header */}
      <DashboardHeader
        totalClients={totals.totalClients}
        totalProcesses={totals.totalProcesses}
        totalLicenses={totals.totalLicenses}
        totalDemands={totals.totalDemands}
        isPresentationMode={isPresentationMode}
        onTogglePresentationMode={togglePresentationMode}
      />

      {/* Main Content - Client Grid */}
      <main className="flex-1 overflow-hidden">
        <ClientGrid
          clients={activeClients}
          selectedClientId={selectedClientId}
          onSelectClient={handleSelectClient}
        />
      </main>
    </div>
  );
};

export default Index;
