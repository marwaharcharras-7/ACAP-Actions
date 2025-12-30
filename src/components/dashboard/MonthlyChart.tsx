import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MonthlyChartProps {
  data: Array<{
    name: string;
    created: number;
    completed: number;
    validated: number;
  }>;
  title?: string;
}

const MonthlyChart = ({ data, title = 'Évolution mensuelle' }: MonthlyChartProps) => {
  return (
    <Card className="shadow-card border-border/50 animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="name" 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px hsl(var(--foreground) / 0.1)',
              }}
            />
            <Legend 
              formatter={(value) => (
                <span style={{ color: 'hsl(var(--foreground))' }}>{value}</span>
              )}
            />
            <Bar 
              dataKey="created" 
              name="Créées" 
              fill="hsl(217, 91%, 40%)" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="completed" 
              name="Finalisées" 
              fill="hsl(199, 89%, 48%)" 
              radius={[4, 4, 0, 0]} 
            />
            <Bar 
              dataKey="validated" 
              name="Validées" 
              fill="hsl(142, 71%, 45%)" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default MonthlyChart;
