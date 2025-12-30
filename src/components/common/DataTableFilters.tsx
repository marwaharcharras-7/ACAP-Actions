import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Filter, X, RefreshCw } from 'lucide-react';

export interface FilterConfig {
  key: string;
  label: string;
  placeholder: string;
  options: { id: string; name: string }[];
}

interface DataTableFiltersProps {
  searchPlaceholder?: string;
  filters: FilterConfig[];
  onApply: (values: Record<string, string>) => void;
  onReset?: () => void;
}

const DataTableFilters = ({
  searchPlaceholder = 'Rechercher...',
  filters,
  onApply,
  onReset,
}: DataTableFiltersProps) => {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  // Initialize filter values
  useEffect(() => {
    const initial: Record<string, string> = { search: '' };
    filters.forEach(f => (initial[f.key] = 'all'));
    setFilterValues(initial);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilterValues(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApply({ ...filterValues, search });
  };

  const handleReset = () => {
    setSearch('');
    const reset: Record<string, string> = { search: '' };
    filters.forEach(f => (reset[f.key] = 'all'));
    setFilterValues(reset);
    onApply(reset);
    onReset?.();
  };

  const hasActiveFilters = search !== '' || Object.values(filterValues).some(v => v !== 'all' && v !== '');

  return (
    <div className="space-y-4 p-4 bg-card rounded-xl border border-border shadow-sm">
      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-background border-border"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
      </div>

      {/* Filter selects */}
      <div className="flex flex-wrap gap-3">
        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={filterValues[filter.key] || 'all'}
            onValueChange={(value) => handleFilterChange(filter.key, value)}
          >
            <SelectTrigger className="w-[150px] bg-background border-border rounded-lg">
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="all">{filter.label}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
      </div>

      {/* Apply and Reset buttons */}
      <div className="flex items-center gap-2">
        <Button onClick={handleApply} className="gap-2">
          <Filter className="w-4 h-4" />
          Appliquer
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" onClick={handleReset} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Réinitialiser
          </Button>
        )}
      </div>
    </div>
  );
};

export default DataTableFilters;
