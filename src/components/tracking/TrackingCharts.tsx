import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { AlertTriangle, TrendingUp, PieChart as PieChartIcon, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemberStats {
  user: { id: string; firstName: string; lastName: string };
  total: number;
  inProgress: number;
  planned: number;
  late: number;
  completed: number;
  performance: number;
  delayCategories: { green: number; yellow: number; orange: number; red: number };
}

interface TrackingChartsProps {
  displayMembers: MemberStats[];
  entityLabel: string;
  entityLabelPlural: string;
}

const COLORS = {
  inProgress: "hsl(var(--primary))",
  planned: "hsl(var(--warning))",
  late: "hsl(var(--danger))",
  completed: "hsl(var(--success))",
};

const DELAY_COLORS = {
  green: "hsl(var(--success))",
  yellow: "hsl(var(--warning))",
  orange: "#f97316",
  red: "hsl(var(--danger))",
};

const TrackingCharts = ({ displayMembers, entityLabel, entityLabelPlural }: TrackingChartsProps) => {
  // Data for bar chart - status by entity
  const statusByEntityData = useMemo(() => {
    return displayMembers.slice(0, 10).map((member) => ({
      name: `${member.user.firstName.charAt(0)}. ${member.user.lastName}`,
      fullName: `${member.user.firstName} ${member.user.lastName}`,
      "En cours": member.inProgress,
      Prévues: member.planned,
      "En retard": member.late,
      Finalisées: member.completed,
    }));
  }, [displayMembers]);

  // Data for delay distribution pie chart
  const delayDistributionData = useMemo(() => {
    const totals = displayMembers.reduce(
      (acc, member) => ({
        green: acc.green + member.delayCategories.green,
        yellow: acc.yellow + member.delayCategories.yellow,
        orange: acc.orange + member.delayCategories.orange,
        red: acc.red + member.delayCategories.red,
      }),
      { green: 0, yellow: 0, orange: 0, red: 0 },
    );

    return [
      { name: "0-50%", value: totals.green, color: DELAY_COLORS.green },
      { name: "50-75%", value: totals.yellow, color: DELAY_COLORS.yellow },
      { name: "75-100%", value: totals.orange, color: DELAY_COLORS.orange },
      { name: ">100%", value: totals.red, color: DELAY_COLORS.red },
    ].filter((item) => item.value > 0);
  }, [displayMembers]);

  // Overall status distribution
  const overallStatusData = useMemo(() => {
    const totals = displayMembers.reduce(
      (acc, member) => ({
        inProgress: acc.inProgress + member.inProgress,
        planned: acc.planned + member.planned,
        late: acc.late + member.late,
        completed: acc.completed + member.completed,
      }),
      { inProgress: 0, planned: 0, late: 0, completed: 0 },
    );

    return [
      { name: "En cours", value: totals.inProgress, color: COLORS.inProgress },
      { name: "Prévues", value: totals.planned, color: COLORS.planned },
      { name: "En retard", value: totals.late, color: COLORS.late },
      { name: "Finalisées", value: totals.completed, color: COLORS.completed },
    ].filter((item) => item.value > 0);
  }, [displayMembers]);

  // Critical points - entities with issues
  const criticalPoints = useMemo(() => {
    return displayMembers
      .filter((m) => m.late > 0 || m.delayCategories.red > 0 || m.performance < 50)
      .sort((a, b) => b.late + b.delayCategories.red - (a.late + a.delayCategories.red))
      .slice(0, 5);
  }, [displayMembers]);

  // Global critical stats
  const globalCriticalStats = useMemo(() => {
    const totalLate = displayMembers.reduce((acc, m) => acc + m.late, 0);
    const totalOverdue = displayMembers.reduce((acc, m) => acc + m.delayCategories.red, 0);
    const avgPerformance =
      displayMembers.length > 0
        ? Math.round(displayMembers.reduce((acc, m) => acc + m.performance, 0) / displayMembers.length)
        : 0;
    const lowPerformers = displayMembers.filter((m) => m.performance < 50).length;

    return { totalLate, totalOverdue, avgPerformance, lowPerformers };
  }, [displayMembers]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="font-medium text-foreground mb-2">{payload[0]?.payload?.fullName || label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6">
      {/* Row 1: Bar Chart + Pie Chart */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Delay Distribution Pie Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              Distribution des retards par délai
            </CardTitle>
          </CardHeader>
          <CardContent>
            {delayDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={delayDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {delayDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune action en cours
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Overview + Critical Points */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Overall Status Overview */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Vue d'ensemble des actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overallStatusData.length > 0 ? (
              <div className="flex flex-col gap-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={overallStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {overallStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {displayMembers.reduce((acc, m) => acc + m.total, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total actions</p>
                  </div>
                  <div className="text-center">
                    <p
                      className={cn(
                        "text-2xl font-bold",
                        globalCriticalStats.avgPerformance >= 80
                          ? "text-success"
                          : globalCriticalStats.avgPerformance >= 50
                            ? "text-warning"
                            : "text-danger",
                      )}
                    >
                      {globalCriticalStats.avgPerformance}%
                    </p>
                    <p className="text-sm text-muted-foreground">Performance moyenne</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                Aucune donnée disponible
              </div>
            )}
          </CardContent>
        </Card>

        {/* Critical Points */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-danger" />
              Points critiques
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Global Critical Stats */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Actions en retard</p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      globalCriticalStats.totalLate > 0 ? "text-danger" : "text-foreground",
                    )}
                  >
                    {globalCriticalStats.totalLate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Délai dépassé (&gt;100%)</p>
                  <p
                    className={cn(
                      "text-xl font-bold",
                      globalCriticalStats.totalOverdue > 0 ? "text-danger" : "text-foreground",
                    )}
                  >
                    {globalCriticalStats.totalOverdue}
                  </p>
                </div>
              </div>

              {/* Critical Entities */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-3">Par {entityLabel.toLowerCase()}</p>
                {criticalPoints.length > 0 ? (
                  <div className="space-y-2">
                    {criticalPoints.map((member) => (
                      <div
                        key={member.user.id}
                        className="flex items-center justify-between p-3 bg-danger-light rounded-lg"
                      >
                        <span className="font-medium text-sm">
                          {member.user.firstName} {member.user.lastName}
                        </span>
                        <div className="flex items-center gap-2">
                          {member.late > 0 && (
                            <Badge className="bg-danger text-danger-foreground text-xs">{member.late} en retard</Badge>
                          )}
                          {member.delayCategories.red > 0 && (
                            <Badge className="bg-orange-500 text-white text-xs">
                              {member.delayCategories.red} dépassées
                            </Badge>
                          )}
                          {member.performance < 50 && (
                            <Badge variant="outline" className="text-danger border-danger text-xs">
                              {member.performance}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p className="text-success font-medium">Aucun point critique</p>
                    <p className="text-sm">Toutes les actions sont dans les délais</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TrackingCharts;
