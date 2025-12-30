import React from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Activity, Edit, CheckSquare, Target } from "lucide-react";
import { User, ROLE_PERMISSIONS, Action } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityPermissionsTabProps {
  user: User;
  actions: Action[];
}

const ActivityPermissionsTab: React.FC<ActivityPermissionsTabProps> = ({ user, actions }) => {
  const permissions = ROLE_PERMISSIONS[user.role] || [];

  // Calculate user activity stats
  const userPilotedActions = actions.filter((a) => a.pilotId === user.id);
  const totalPilotedActions = userPilotedActions.length;

  const lastModifiedAction = [...actions]
    .filter((a) => a.pilotId === user.id)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];

  const lastValidatedAction = [...actions]
    .filter((a) => a.validatedAt && (a.pilotId === user.id || user.role === "supervisor" || user.role === "manager"))
    .sort((a, b) => new Date(b.validatedAt!).getTime() - new Date(a.validatedAt!).getTime())[0];

  const canShowModifiedAction = ["team_leader", "supervisor", "manager", "admin"].includes(user.role);
  const canShowValidatedAction = ["supervisor", "manager", "admin"].includes(user.role);
  const canShowPilotedCount = ["operator", "team_leader", "supervisor", "manager"].includes(user.role);

  return (
    <div className="space-y-6">
      {/* Activité */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Activité
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canShowModifiedAction && (
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Edit className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Dernière action modifiée</h4>
                {lastModifiedAction ? (
                  <div className="mt-1">
                    <p className="text-sm text-foreground">{lastModifiedAction.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(lastModifiedAction.updatedAt), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Aucune action modifiée</p>
                )}
              </div>
            </div>
          )}

          {canShowValidatedAction && (
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 bg-success/10 rounded-lg">
                <CheckSquare className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Dernière action validée</h4>
                {lastValidatedAction ? (
                  <div className="mt-1">
                    <p className="text-sm text-foreground">{lastValidatedAction.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(lastValidatedAction.validatedAt!), "dd MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Aucune action validée</p>
                )}
              </div>
            </div>
          )}

          {canShowPilotedCount && (
            <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="p-2 bg-accent/10 rounded-lg">
                <Target className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Actions pilotées</h4>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="secondary" className="text-lg font-bold">
                    {totalPilotedActions}
                  </Badge>
                  <span className="text-sm text-muted-foreground">actions au total</span>
                </div>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
};

export default ActivityPermissionsTab;
