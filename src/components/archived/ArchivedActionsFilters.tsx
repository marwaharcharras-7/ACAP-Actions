import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";
import { useData } from "@/contexts/DataContext";

interface ArchivedFilters {
  dateStart: string;
  dateEnd: string;
  factory: string;
  service: string;
  line: string;
  team: string;
  post: string;
  search: string;
}

interface ArchivedActionsFiltersProps {
  filters: ArchivedFilters;
  onFilterChange: (key: keyof ArchivedFilters, value: string) => void;
}

const ArchivedActionsFilters = ({
  filters,
  onFilterChange,
}: ArchivedActionsFiltersProps) => {
  const { services, lines, teams, posts } = useData();

  // Build options from real data
  const serviceOptions = useMemo(() => {
    return [{ value: 'all', label: 'Tous les services' }, ...services.map(s => ({ value: s.id, label: s.name }))];
  }, [services]);

  const lineOptions = useMemo(() => {
    let filtered = lines;
    if (filters.service !== 'all') {
      filtered = lines.filter(l => l.serviceId === filters.service);
    }
    return [{ value: 'all', label: 'Toutes les lignes' }, ...filtered.map(l => ({ value: l.id, label: l.name }))];
  }, [lines, filters.service]);

  const teamOptions = useMemo(() => {
    let filtered = teams;
    if (filters.line !== 'all') {
      filtered = teams.filter(t => t.lineId === filters.line);
    }
    return [{ value: 'all', label: 'Toutes les équipes' }, ...filtered.map(t => ({ value: t.id, label: t.name }))];
  }, [teams, filters.line]);

  const postOptions = useMemo(() => {
    let filtered = posts;
    if (filters.team !== 'all') {
      filtered = posts.filter(p => p.teamId === filters.team);
    }
    return [{ value: 'all', label: 'Tous les postes' }, ...filtered.map(p => ({ value: p.id, label: p.name }))];
  }, [posts, filters.team]);

  // Handle cascading resets
  const handleFilterChange = (key: keyof ArchivedFilters, value: string) => {
    onFilterChange(key, value);
    
    // Reset dependent filters when parent changes
    if (key === 'service') {
      onFilterChange('line', 'all');
      onFilterChange('team', 'all');
      onFilterChange('post', 'all');
    } else if (key === 'line') {
      onFilterChange('team', 'all');
      onFilterChange('post', 'all');
    } else if (key === 'team') {
      onFilterChange('post', 'all');
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Filtres</h3>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Du:</label>
          <Input
            type="date"
            value={filters.dateStart}
            onChange={(e) => onFilterChange("dateStart", e.target.value)}
            className="w-auto"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground whitespace-nowrap">Au:</label>
          <Input
            type="date"
            value={filters.dateEnd}
            onChange={(e) => onFilterChange("dateEnd", e.target.value)}
            className="w-auto"
          />
        </div>

        {/* Service */}
        <Select
          value={filters.service}
          onValueChange={(value) => handleFilterChange("service", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            {serviceOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Line */}
        <Select
          value={filters.line}
          onValueChange={(value) => handleFilterChange("line", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Ligne" />
          </SelectTrigger>
          <SelectContent>
            {lineOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Team */}
        <Select
          value={filters.team}
          onValueChange={(value) => handleFilterChange("team", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Équipe" />
          </SelectTrigger>
          <SelectContent>
            {teamOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Post */}
        <Select
          value={filters.post}
          onValueChange={(value) => handleFilterChange("post", value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Poste" />
          </SelectTrigger>
          <SelectContent>
            {postOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => onFilterChange("search", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
};

export default ArchivedActionsFilters;
