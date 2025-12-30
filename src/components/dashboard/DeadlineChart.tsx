import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Action } from '@/types';

interface DeadlineChartProps {
  actions: Action[];
  title?: string;
}

const DeadlineChart = ({ actions, title = 'Respect des délais' }: DeadlineChartProps) => {
  // Calculate deadline statistics
  const completedOrValidated = actions.filter(a => a.status === 'completed' || a.status === 'validated');
  const inProgressOrPlanned = actions.filter(a => a.status === 'in_progress' || a.status === 'planned');
  
  const finishedOnTime = completedOrValidated.filter(a => {
    if (a.completedAt) {
      return new Date(a.completedAt) <= new Date(a.dueDate);
    }
    return false;
  }).length;

  const finishedLate = completedOrValidated.filter(a => {
    if (a.completedAt) {
      return new Date(a.completedAt) > new Date(a.dueDate);
    }
    return false;
  }).length;

  const inProgressOnTime = inProgressOrPlanned.filter(a => {
    return new Date() <= new Date(a.dueDate);
  }).length;

  const inProgressLate = inProgressOrPlanned.filter(a => {
    return new Date() > new Date(a.dueDate);
  }).length;

  const data = [
    { name: 'Finalisées dans les délais', value: finishedOnTime, color: 'hsl(142, 71%, 45%)' },
    { name: 'Finalisées en retard', value: finishedLate, color: 'hsl(0, 84%, 60%)' },
    { name: 'En cours dans les délais', value: inProgressOnTime, color: 'hsl(217, 91%, 40%)' },
    { name: 'En cours en retard', value: inProgressLate, color: 'hsl(38, 92%, 50%)' },
  ];

  const filteredData = data.filter(d => d.value > 0);
  const total = data.reduce((acc, d) => acc + d.value, 0);

  return (
    <Card className="shadow-card border-border/50 animate-fade-in">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row items-center gap-6">
          {/* Donut Chart */}
          <div className="w-full lg:w-1/2">
            {filteredData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={filteredData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
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
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                Aucune donnée
              </div>
            )}
          </div>
          
          {/* Stats Table */}
          <div className="w-full lg:w-1/2 space-y-3">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-foreground">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-foreground">{item.value}</span>
                  <span className="text-xs text-muted-foreground">
                    ({total > 0 ? Math.round((item.value / total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DeadlineChart;
