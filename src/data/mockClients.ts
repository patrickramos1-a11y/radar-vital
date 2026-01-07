import { ClientData } from "@/components/dashboard/ClientCard";

// Generate 40 mock clients
const clientNames = [
  "Mineração Vale Verde", "Construtora Horizonte", "Agropecuária Boa Terra", "Indústria Química Nova Era",
  "Energia Solar Brasil", "Frigorífico Bom Corte", "Logística Expressa", "Cerâmica Artesanal",
  "Metalúrgica Forte", "Têxtil Algodão Fino", "Plásticos Recicla", "Papel e Celulose Norte",
  "Alimentos Naturais", "Distribuidora Central", "Farmacêutica Vida", "Cosméticos Beleza Pura",
  "Petroquímica Sul", "Madeireira Floresta", "Bebidas Refrescantes", "Laticínios Campo Bom",
  "Cimento Estrutural", "Vidros Transparentes", "Borracha Flex", "Tintas ColorMix",
  "Aço Inox Premium", "Embalagens Verdes", "Transportes Rápido", "Granja Feliz",
  "Pescados do Mar", "Fertilizantes Terra", "Ração Animal Top", "Couro Natural",
  "Móveis Rustic", "Eletrônicos Tech", "Confecções Moda", "Calçados Confort",
  "Joias Brilhante", "Perfumes Essence", "Sabões Limpo", "Químicos Industriais"
];

const priorityClients = [0, 2, 8, 14, 16, 24, 30, 35]; // Indices of priority clients

export const mockClients: ClientData[] = clientNames.map((name, index) => ({
  id: `client-${index + 1}`,
  name,
  number: index + 1,
  isPriority: priorityClients.includes(index),
  processes: Math.floor(Math.random() * 15) + 1,
  licenses: Math.floor(Math.random() * 10) + 1,
  demands: {
    completed: Math.floor(Math.random() * 20) + 5,
    inProgress: Math.floor(Math.random() * 8) + 1,
    notStarted: Math.floor(Math.random() * 5),
    cancelled: Math.floor(Math.random() * 3),
  },
}));

// Helper function to calculate totals
export function calculateTotals(clients: ClientData[]) {
  return {
    totalClients: clients.length,
    totalProcesses: clients.reduce((sum, c) => sum + c.processes, 0),
    totalLicenses: clients.reduce((sum, c) => sum + c.licenses, 0),
    totalDemands: clients.reduce((sum, c) => 
      sum + c.demands.completed + c.demands.inProgress + c.demands.notStarted + c.demands.cancelled, 0
    ),
  };
}
