import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartData } from '@/types';

interface StatusChartProps {
  data: ChartData[];
  title?: string;
}

const StatusChart = ({ data, title = 'Répartition par statut' }: StatusChartProps) => {
  const filteredData = data.filter(d => d.value > 0);

  const renderCustomLabel = ({ name, value, percent }: any) => {
    if (percent < 0.05) return null;
    return `${Math.round(percent * 100)}%`;
  };

  return (
    <Card className="shadow-card border-border/50 animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={filteredData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomLabel}
                outerRadius={100}
                innerRadius={60}
                paddingAngle={2}
                dataKey="value"
              >
                {filteredData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px hsl(var(--foreground) / 0.1)',
                }}
                formatter={(value: number, name: string) => [value, name]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value) => (
                  <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatusChart;
