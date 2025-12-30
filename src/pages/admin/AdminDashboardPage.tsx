import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import {
  Users,
  UserCheck,
  UserCog,
  Briefcase,
  Building2,
  Factory,
  Layers,
  MapPin,
  TrendingUp,
  FileText,
  Shield,
  Settings,
  UserPlus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, services, lines, teams, posts } = useData();
  const { notifications, unreadCount, isLoading, markAllAsRead } = useNotifications();

  // Exclude admins from all counts
  const nonAdminUsers = users.filter(u => u.role !== 'admin');
  const operatorsCount = nonAdminUsers.filter(u => u.role === 'operator').length;
  const teamLeadersCount = nonAdminUsers.filter(u => u.role === 'team_leader').length;
  const supervisorsCount = nonAdminUsers.filter(u => u.role === 'supervisor').length;
  const managersCount = nonAdminUsers.filter(u => u.role === 'manager').length;

  const kpis = [
    { label: 'Total utilisateurs', value: nonAdminUsers.length, icon: Users, color: 'bg-blue-500' },
    { label: 'Opérateurs', value: operatorsCount, icon: UserCheck, color: 'bg-green-500' },
    { label: 'Chefs d\'équipe', value: teamLeadersCount, icon: UserCog, color: 'bg-purple-500' },
    { label: 'Superviseurs', value: supervisorsCount, icon: Users, color: 'bg-orange-500' },
    { label: 'Managers', value: managersCount, icon: Briefcase, color: 'bg-rose-500' },
    { label: 'Services', value: services.length, icon: Building2, color: 'bg-cyan-500' },
    { label: 'Lignes', value: lines.length, icon: Factory, color: 'bg-indigo-500' },
    { label: 'Équipes', value: teams.length, icon: Layers, color: 'bg-pink-500' },
    { label: 'Postes', value: posts.length, icon: MapPin, color: 'bg-amber-500' },
  ];

  const navigationCards = [
    { 
      title: 'Gestion utilisateurs', 
      description: 'Gérer les comptes et les accès',
      icon: Users, 
      path: '/admin/users',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      title: 'Organisation', 
      description: 'Services, lignes, équipes et postes',
      icon: Building2, 
      path: '/admin/organization',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      title: 'Fichiers', 
      description: 'Gérer les documents et pièces jointes',
      icon: FileText, 
      path: '/admin/files',
      color: 'from-green-500 to-green-600'
    },
    { 
      title: 'Rôles & Permissions', 
      description: 'Configurer les droits d\'accès',
      icon: Shield, 
      path: '/admin/roles',
      color: 'from-orange-500 to-orange-600'
    },
    { 
      title: 'Paramètres système', 
      description: 'Configuration globale de l\'application',
      icon: Settings, 
      path: '/admin/settings',
      color: 'from-slate-500 to-slate-600'
    },
  ];

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'user_created':
        return UserPlus;
      case 'action_late':
        return AlertTriangle;
      case 'action_completed':
        return CheckCircle2;
      case 'role_changed':
        return Shield;
      default:
        return Users;
    }
  };

  const getNotificationStyle = (type: Notification['type']) => {
    switch (type) {
      case 'action_late':
        return 'bg-destructive/10 text-destructive';
      case 'action_completed':
        return 'bg-green-500/10 text-green-500';
      case 'user_created':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestion globale – Mon espace</h1>
        <p className="text-muted-foreground">Vue d'ensemble de l'administration système</p>
      </div>

      {/* KPIs Grid - Now 9 cards including Managers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-4">
        {kpis.map((kpi, index) => (
          <Card key={index} className="bg-card border-0 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className={`w-10 h-10 rounded-lg ${kpi.color} flex items-center justify-center mb-3`}>
                <kpi.icon className="h-5 w-5 text-white" />
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* TRS Global Card */}
      <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-primary-foreground/80 text-sm">TRS Global</p>
              <p className="text-4xl font-bold">87.5%</p>
              <p className="text-sm text-primary-foreground/70 flex items-center gap-1 mt-1">
                <TrendingUp className="h-4 w-4" />
                +2.3% par rapport au mois dernier
              </p>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-primary-foreground/30 flex items-center justify-center">
              <TrendingUp className="h-10 w-10 text-primary-foreground/80" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Navigation Cards */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Accès rapide</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {navigationCards.map((card, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-all duration-200 border-0 overflow-hidden group"
                onClick={() => navigate(card.path)}
              >
                <CardContent className="p-0">
                  <div className={`h-2 bg-gradient-to-r ${card.color}`} />
                  <div className="p-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${card.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <card.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold text-foreground">{card.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{card.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Real-time Notifications Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Notifications récentes</h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Badge variant="destructive">{unreadCount} nouvelles</Badge>
              )}
              {notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Tout marquer lu
                </Button>
              )}
            </div>
          </div>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-0 divide-y divide-border max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="p-4 flex items-center justify-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Chargement...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <p>Aucune notification</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => {
                  const Icon = getNotificationIcon(notification.type);
                  return (
                    <div 
                      key={notification.id} 
                      className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors flex items-start gap-3 ${
                        !notification.isRead ? 'bg-primary/5' : ''
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationStyle(notification.type)}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm ${!notification.isRead ? 'font-medium' : ''} text-foreground`}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: fr })}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
