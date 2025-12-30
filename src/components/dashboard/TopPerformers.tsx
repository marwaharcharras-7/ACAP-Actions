import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Action, User } from '@/types';
import { Trophy, Medal, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopPerformersProps {
  actions: Action[];
  users: User[];
  title?: string;
}

const TopPerformers = ({ actions, users, title = 'Top 5 utilisateurs actifs' }: TopPerformersProps) => {
  // Calculate contributions per user - count completed actions with efficiency > 80%
  const contributions = actions.reduce((acc, action) => {
    const pilotId = action.pilotId;
    if (!acc[pilotId]) {
      acc[pilotId] = { total: 0, effectiveCount: 0 };
    }
    acc[pilotId].total++;
    
    // Count only if: completed/validated + efficiency > 80%
    if ((action.status === 'completed' || action.status === 'validated') && 
        action.efficiencyPercent !== null && 
        action.efficiencyPercent !== undefined && 
        action.efficiencyPercent > 80) {
      acc[pilotId].effectiveCount++;
    }
    return acc;
  }, {} as Record<string, { total: number; effectiveCount: number }>);

  const topUsers = Object.entries(contributions)
    .map(([userId, stats]) => {
      const user = users.find(u => u.id === userId);
      return {
        id: userId,
        name: user ? `${user.firstName} ${user.lastName}` : 'Utilisateur inconnu',
        avatar: user?.avatarUrl,
        ...stats,
      };
    })
    .sort((a, b) => b.effectiveCount - a.effectiveCount)
    .slice(0, 5);

  const getIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-4 h-4 text-warning" />;
    if (index === 1) return <Medal className="w-4 h-4 text-muted-foreground" />;
    if (index === 2) return <Award className="w-4 h-4 text-warning/60" />;
    return null;
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    return parts.length >= 2 
      ? `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase()
      : name.charAt(0).toUpperCase();
  };

  return (
    <Card className="shadow-card border-border/50 animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="w-5 h-5 text-warning" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topUsers.length > 0 ? (
          <div className="space-y-3">
            {topUsers.map((user, index) => (
              <div
                key={user.id}
                className={cn(
                  'flex items-center gap-4 p-3 rounded-lg transition-colors',
                  index === 0 ? 'bg-warning/10' : 'hover:bg-muted/50'
                )}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-bold text-muted-foreground">
                  {index + 1}
                </div>
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground truncate">{user.name}</span>
                    {getIcon(index)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {user.effectiveCount} actions efficaces
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary">{user.effectiveCount}</div>
                  <p className="text-xs text-muted-foreground">actions</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucune donnée disponible</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopPerformers;
