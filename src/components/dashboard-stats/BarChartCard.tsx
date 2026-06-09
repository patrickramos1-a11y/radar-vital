import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, Cell } from "recharts";
import { cn } from "@/lib/utils";

interface BarChartCardProps {
  title: string;
  data: { name: string; value: number; color?: string }[];
  className?: string;
  horizontal?: boolean;
  showLabels?: boolean;
}

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#8B5CF6',
  '#EC4899',
  '#F59E0B',
  '#06B6D4',
  '#10B981',
];

const splitLabel = (label: string, maxLineLength = 16) => {
  const words = label.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLineLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = nextLine;
    }
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3);
};

function HorizontalCategoryTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  if (typeof x !== "number" || typeof y !== "number" || !payload?.value) {
    return null;
  }

  const lines = splitLabel(payload.value);

  return (
    <g transform={`translate(${x},${y})`}>
      <text textAnchor="end" fill="hsl(var(--muted-foreground))" fontSize={11} dominantBaseline="middle">
        {lines.map((line, index) => (
          <tspan key={`${line}-${index}`} x={0} dy={index === 0 ? 0 : 13}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
}

export function BarChartCard({ 
  title, 
  data, 
  className,
  horizontal = false,
  showLabels = true
}: BarChartCardProps) {
  const chartConfig = data.reduce((acc, item, index) => {
    acc[item.name] = {
      label: item.name,
      color: item.color || COLORS[index % COLORS.length],
    };
    return acc;
  }, {} as Record<string, { label: string; color: string }>);

  if (data.length === 0) {
    return (
      <Card className={cn("", className)}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent className="h-[200px] flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
        </CardContent>
      </Card>
    );
  }

  const chartHeight = horizontal
    ? Math.max(280, Math.min(520, data.length * 42 + 90))
    : 260;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-2">
        <ChartContainer
          config={chartConfig}
          className="w-full overflow-visible"
          style={{ height: chartHeight }}
        >
          {horizontal ? (
            <BarChart 
              data={data} 
              layout="vertical" 
              margin={{ top: 8, right: 36, left: 18, bottom: 24 }}
              barCategoryGap={10}
            >
              <XAxis
                type="number"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                tickMargin={8}
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                tickLine={false} 
                axisLine={false}
                width={150}
                interval={0}
                tickMargin={10}
                tick={<HorizontalCategoryTick />}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[0, 5, 5, 0]} minPointSize={3} maxBarSize={18}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 5, right: 16, left: 4, bottom: 20 }}>
              <XAxis 
                dataKey="name" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
                interval={0}
              />
              <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={42}>
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color || COLORS[index % COLORS.length]} 
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
