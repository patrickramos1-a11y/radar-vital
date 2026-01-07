import { ClientData } from "@/components/dashboard/ClientCard";

// Placeholder logos using ui-avatars service with company initials
const generateLogoUrl = (name: string, index: number) => {
  const colors = [
    '0052CC', 'FF5630', '36B37E', 'FFAB00', '6554C0',
    '00B8D9', 'FF8B00', '8777D9', '57D9A3', 'FFC400',
    '403294', 'E34935', '00875A', 'FF991F', '5243AA'
  ];
  const bgColor = colors[index % colors.length];
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${bgColor}&color=fff&size=64&bold=true&rounded=true`;
};

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
  logoUrl: generateLogoUrl(name, index),
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
