import React, { useState } from 'react';
import {
  Database,
  Trash2,
  TrendingUp,
  AlertTriangle,
  FileText,
  Settings,
  Save,
  RefreshCw,
  Globe,
  Palette,
  Hash,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const AdminSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    urgentThreshold: 80,
    language: 'fr',
    dateFormat: 'dd/MM/yyyy',
    autoNumbering: true,
    backupEnabled: true,
    backupFrequency: 'daily',
    cleanOrphanFiles: false,
    trsTarget: 85,
    statusColors: {
      identified: '#6b7280',
      planned: '#3b82f6',
      in_progress: '#f59e0b',
      completed: '#22c55e',
      late: '#ef4444',
      validated: '#8b5cf6',
    },
  });

  const [hasChanges, setHasChanges] = useState(false);

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    toast.success('Paramètres enregistrés avec succès');
    setHasChanges(false);
  };

  const handleBackup = () => {
    toast.success('Backup lancé avec succès');
  };

  const handleCleanFiles = () => {
    toast.success('Nettoyage des fichiers orphelins terminé');
  };

  const systemCards = [
    {
      title: 'Configuration TRS',
      description: 'Objectifs de taux de rendement synthétique',
      icon: TrendingUp,
      color: 'bg-green-500',
      action: (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Objectif TRS global</Label>
              <span className="font-bold text-lg">{settings.trsTarget}%</span>
            </div>
            <Slider
              value={[settings.trsTarget]}
              onValueChange={([value]) => updateSetting('trsTarget', value)}
              max={100}
              min={50}
              step={1}
            />
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-red-100 text-red-700 rounded">
              &lt;70% Critique
            </div>
            <div className="p-2 bg-orange-100 text-orange-700 rounded">
              70-85% Moyen
            </div>
            <div className="p-2 bg-green-100 text-green-700 rounded">
              &gt;85% Optimal
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Seuils d\'urgence',
      description: 'Configuration des niveaux d\'alerte',
      icon: AlertTriangle,
      color: 'bg-red-500',
      action: (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Seuil critique (%)</Label>
              <span className="font-bold">{settings.urgentThreshold}%</span>
            </div>
            <Slider
              value={[settings.urgentThreshold]}
              onValueChange={([value]) => updateSetting('urgentThreshold', value)}
              max={100}
              min={50}
              step={5}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Les actions dépassant ce seuil seront marquées comme urgentes
          </p>
        </div>
      ),
    },
    {
      title: 'Logs système',
      description: 'Historique des événements système',
      icon: FileText,
      color: 'bg-purple-500',
      action: (
        <div className="space-y-3">
          <div className="p-3 bg-muted rounded-lg space-y-2 max-h-[150px] overflow-y-auto">
            <div className="flex items-center justify-between text-sm">
              <span>Nouvel utilisateur créé</span>
              <span className="text-muted-foreground">09:15</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Action validée #AC-2024-001</span>
              <span className="text-muted-foreground">08:45</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Connexion administrateur</span>
              <span className="text-muted-foreground">08:00</span>
            </div>
          </div>
          <Button variant="outline" className="w-full">
            Voir tous les logs
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paramètres système</h1>
          <p className="text-muted-foreground">Configuration globale de l'application</p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges} className="gap-2">
          <Save className="h-4 w-4" />
          Enregistrer les paramètres
        </Button>
      </div>

      {/* System Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {systemCards.map((card, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center`}>
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription className="text-xs">{card.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>{card.action}</CardContent>
          </Card>
        ))}
      </div>

      {/* General Settings */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-500 flex items-center justify-center">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle>Paramètres généraux</CardTitle>
              <CardDescription>Configuration de l'affichage et des formats</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Langue
              </Label>
              <Select 
                value={settings.language} 
                onValueChange={(value) => updateSetting('language', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">العربية</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Format de date
              </Label>
              <Select 
                value={settings.dateFormat} 
                onValueChange={(value) => updateSetting('dateFormat', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                  <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Hash className="h-4 w-4" />
                Numérotation auto
              </Label>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm">AC-2024-XXX</span>
                <Switch
                  checked={settings.autoNumbering}
                  onCheckedChange={(checked) => updateSetting('autoNumbering', checked)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Couleurs statuts
              </Label>
              <div className="flex gap-1 p-3 bg-muted rounded-lg">
                {Object.entries(settings.statusColors).slice(0, 5).map(([key, color]) => (
                  <div
                    key={key}
                    className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: color }}
                    title={key}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettingsPage;
