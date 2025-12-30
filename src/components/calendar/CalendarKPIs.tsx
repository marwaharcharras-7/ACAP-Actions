import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, AlertTriangle, Timer } from 'lucide-react';

interface CalendarKPIsProps {
  total: number;
  thisWeek: number;
  late: number;
  nearDeadline: number;
}

const CalendarKPIs = ({ total, thisWeek, late, nearDeadline }: CalendarKPIsProps) => {
  const kpis = [
    {
      label: 'Total actions',
      value: total,
      icon: Calendar,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      label: 'Prévues cette semaine',
      value: thisWeek,
      icon: Clock,
      bgColor: 'bg-info/10',
      iconColor: 'text-info',
    },
    {
      label: 'En retard',
      value: late,
      icon: AlertTriangle,
      bgColor: 'bg-danger/10',
      iconColor: 'text-danger',
    },
    {
      label: 'Échéance ≤ 3 jours',
      value: nearDeadline,
      icon: Timer,
      bgColor: 'bg-warning/10',
      iconColor: 'text-warning',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label} className="shadow-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${kpi.bgColor} flex items-center justify-center`}>
                <kpi.icon className={`w-5 h-5 ${kpi.iconColor}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default CalendarKPIs;
