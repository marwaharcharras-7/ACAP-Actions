import { useData } from '@/contexts/DataContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STATUS_LABELS } from '@/types';
import { useMemo } from 'react';

interface FilterState {
  service: string;
  usine: string;
  ligne: string;
  poste: string;
  equipe: string;
  statut: string;
  periode: string;
}

interface DashboardFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
}

const DashboardFilters = ({ filters, onFilterChange }: DashboardFiltersProps) => {
  const { services, lines, teams, posts } = useData();

  const serviceOptions = useMemo(() => [
    { id: 'all', name: 'Tous les services' },
    ...services.map(s => ({ id: s.id, name: s.name }))
  ], [services]);

  const lineOptions = useMemo(() => [
    { id: 'all', name: 'Toutes les lignes' },
    ...lines.map(l => ({ id: l.id, name: l.name }))
  ], [lines]);

  const teamOptions = useMemo(() => [
    { id: 'all', name: 'Toutes les équipes' },
    ...teams.map(t => ({ id: t.id, name: t.name }))
  ], [teams]);

  const postOptions = useMemo(() => [
    { id: 'all', name: 'Tous les postes' },
    ...posts.map(p => ({ id: p.id, name: p.name }))
  ], [posts]);

  // Exclude 'archived' from status filter - archived actions only show in archive page
  const statuts = [
    { id: 'all', name: 'Tous les statuts' },
    { id: 'identified', name: STATUS_LABELS.identified },
    { id: 'planned', name: STATUS_LABELS.planned },
    { id: 'in_progress', name: STATUS_LABELS.in_progress },
    { id: 'completed', name: STATUS_LABELS.completed },
    { id: 'validated', name: STATUS_LABELS.validated },
    { id: 'late', name: STATUS_LABELS.late },
  ];

  const periodes = [
    { id: 'all', name: 'Toutes les périodes' },
    { id: 'today', name: 'Aujourd\'hui' },
    { id: 'week', name: 'Cette semaine' },
    { id: 'month', name: 'Ce mois' },
    { id: 'quarter', name: 'Ce trimestre' },
    { id: 'year', name: 'Cette année' },
  ];

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-card rounded-xl border border-border shadow-card animate-fade-in">
      <Select value={filters.service} onValueChange={(value) => onFilterChange('service', value)}>
        <SelectTrigger className="w-[160px] bg-background border-border rounded-lg">
          <SelectValue placeholder="Service" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {serviceOptions.map((item) => (
            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.ligne} onValueChange={(value) => onFilterChange('ligne', value)}>
        <SelectTrigger className="w-[160px] bg-background border-border rounded-lg">
          <SelectValue placeholder="Ligne" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {lineOptions.map((item) => (
            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.equipe} onValueChange={(value) => onFilterChange('equipe', value)}>
        <SelectTrigger className="w-[160px] bg-background border-border rounded-lg">
          <SelectValue placeholder="Équipe" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {teamOptions.map((item) => (
            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.poste} onValueChange={(value) => onFilterChange('poste', value)}>
        <SelectTrigger className="w-[160px] bg-background border-border rounded-lg">
          <SelectValue placeholder="Poste" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {postOptions.map((item) => (
            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.statut} onValueChange={(value) => onFilterChange('statut', value)}>
        <SelectTrigger className="w-[160px] bg-background border-border rounded-lg">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {statuts.map((item) => (
            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.periode} onValueChange={(value) => onFilterChange('periode', value)}>
        <SelectTrigger className="w-[160px] bg-background border-border rounded-lg">
          <SelectValue placeholder="Période" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {periodes.map((item) => (
            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default DashboardFilters;
