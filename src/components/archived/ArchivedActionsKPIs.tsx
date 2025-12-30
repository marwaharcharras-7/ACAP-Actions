import { Archive, Calendar, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ArchivedActionsKPIsProps {
  totalArchived: number;
  archivedThisMonth: number;
  onTimePercent: number;
  latePercent: number;
}

const ArchivedActionsKPIs = ({
  totalArchived,
  archivedThisMonth,
  onTimePercent,
  latePercent,
}: ArchivedActionsKPIsProps) => {
  const kpis = [
    {
      title: "Total Actions Archivées",
      value: totalArchived,
      icon: Archive,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Archivées ce Mois",
      value: archivedThisMonth,
      icon: Calendar,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      title: "Finalisées dans les Délais",
      value: `${onTimePercent}%`,
      icon: CheckCircle,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      title: "Finalisées en Retard",
      value: `${latePercent}%`,
      icon: Clock,
      color: "text-danger",
      bgColor: "bg-danger/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi) => (
        <Card key={kpi.title} className="border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.title}</p>
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ArchivedActionsKPIs;
