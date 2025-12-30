import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User } from '@/types';

export interface CalendarFilterState {
  usine: string;
  service: string;
  ligne: string;
  poste: string;
  pilote: string;
  statut: string;
}

interface CalendarFiltersProps {
  filters: CalendarFilterState;
  onFilterChange: (key: keyof CalendarFilterState, value: string) => void;
  pilots: User[];
}

const CalendarFilters = ({ filters, onFilterChange, pilots }: CalendarFiltersProps) => {
  const usines = [
    { value: 'A', label: 'Usine A' },
    { value: 'B', label: 'Usine B' },
  ];

  const services = [
    { value: 'qualite', label: 'Qualité' },
    { value: 'production', label: 'Production' },
    { value: 'logistique', label: 'Logistique' },
    { value: 'maintenance', label: 'Maintenance' },
  ];

  const lignes = [
    { value: '1', label: 'Ligne 1' },
    { value: '2', label: 'Ligne 2' },
    { value: '3', label: 'Ligne 3' },
  ];

  const postes = [
    { value: '1', label: 'Poste 1' },
    { value: '2', label: 'Poste 2' },
    { value: '3', label: 'Poste 3' },
  ];

  const statuts = [
    { value: 'planned', label: 'Prévue' },
    { value: 'in_progress', label: 'En cours' },
    { value: 'completed', label: 'Finalisée' },
    { value: 'near_deadline', label: 'Délai proche' },
    { value: 'late', label: 'En retard' },
  ];

  return (
    <div className="flex flex-wrap gap-3 p-4 bg-card rounded-lg border border-border">
      <Select value={filters.usine} onValueChange={(v) => onFilterChange('usine', v)}>
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Usine" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Toutes usines</SelectItem>
          {usines.map((u) => (
            <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.service} onValueChange={(v) => onFilterChange('service', v)}>
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Service" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Tous services</SelectItem>
          {services.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.ligne} onValueChange={(v) => onFilterChange('ligne', v)}>
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Ligne" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Toutes lignes</SelectItem>
          {lignes.map((l) => (
            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.poste} onValueChange={(v) => onFilterChange('poste', v)}>
        <SelectTrigger className="w-[140px] bg-background">
          <SelectValue placeholder="Poste" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Tous postes</SelectItem>
          {postes.map((p) => (
            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.pilote} onValueChange={(v) => onFilterChange('pilote', v)}>
        <SelectTrigger className="w-[160px] bg-background">
          <SelectValue placeholder="Pilote" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Tous pilotes</SelectItem>
          {pilots.map((p) => (
            <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.statut} onValueChange={(v) => onFilterChange('statut', v)}>
        <SelectTrigger className="w-[150px] bg-background">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent className="bg-popover z-50">
          <SelectItem value="all">Tous statuts</SelectItem>
          {statuts.map((s) => (
            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default CalendarFilters;
