import React from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { 
  Briefcase, 
  Building, 
  Layers, 
  Users, 
  MapPin, 
  Calendar
} from 'lucide-react';
import { User, ROLE_LABELS } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useData } from '@/contexts/DataContext';

interface ProfessionalInfoTabProps {
  user: User;
}

const ProfessionalInfoTab: React.FC<ProfessionalInfoTabProps> = ({
  user,
}) => {
  const { services, lines, teams, posts } = useData();

  const getServiceName = (id?: string) => {
    if (!id) return 'Non assigné';
    const service = services.find(s => s.id === id);
    return service?.name || 'Non assigné';
  };

  const getLineName = (id?: string) => {
    if (!id) return 'Non assignée';
    const line = lines.find(l => l.id === id);
    return line?.name || 'Non assignée';
  };

  const getTeamName = (id?: string) => {
    if (!id) return 'Non assignée';
    const team = teams.find(t => t.id === id);
    return team?.name || 'Non assignée';
  };

  const getPostName = (id?: string) => {
    if (!id) return 'Non assigné';
    const post = posts.find(p => p.id === id);
    return post?.name || 'Non assigné';
  };

  // Determine which fields to show based on role - never show factory
  const showService = ['manager', 'supervisor', 'team_leader', 'operator'].includes(user.role);
  const showLine = ['supervisor', 'team_leader', 'operator'].includes(user.role);
  const showTeam = ['team_leader', 'operator'].includes(user.role);
  const showPost = user.role === 'operator';

  return (
    <div className="space-y-6">
      {/* Informations professionnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Informations professionnelles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Rôle
              </label>
              <Badge variant="secondary" className="bg-primary/10 text-primary text-sm">
                {ROLE_LABELS[user.role]}
              </Badge>
            </div>

            {showService && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Service
                </label>
                <p className="text-foreground font-medium">{getServiceName(user.serviceId)}</p>
              </div>
            )}

            {showLine && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  Ligne
                </label>
                <p className="text-foreground font-medium">{getLineName(user.lineId)}</p>
              </div>
            )}

            {showTeam && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Équipe
                </label>
                <p className="text-foreground font-medium">{getTeamName(user.teamId)}</p>
              </div>
            )}

            {showPost && (
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Poste
                </label>
                <p className="text-foreground font-medium">{getPostName(user.postId)}</p>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date d'entrée
              </label>
              <p className="text-foreground font-medium">
                {user.hireDate 
                  ? format(new Date(user.hireDate), 'dd MMMM yyyy', { locale: fr })
                  : 'Non renseignée'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ProfessionalInfoTab;
