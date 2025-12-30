import { useState, useMemo } from 'react';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, UserCheck, UserX } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, ROLE_LABELS } from '@/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import SortableTableHeader, { useSorting, SortDirection } from '@/components/common/SortableTableHeader';

const UsersPage = () => {
  const { users, updateUser, deleteUser } = useData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedUsers = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredUsers;

    return [...filteredUsers].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      // Handle special cases
      if (sortKey === 'fullName') {
        aVal = `${a.firstName} ${a.lastName}`.toLowerCase();
        bVal = `${b.firstName} ${b.lastName}`.toLowerCase();
      } else if (sortKey === 'createdAt') {
        aVal = new Date(a.createdAt).getTime();
        bVal = new Date(b.createdAt).getTime();
      } else {
        aVal = (a as any)[sortKey];
        bVal = (b as any)[sortKey];
      }

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      let comparison = 0;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal);
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        comparison = aVal - bVal;
      } else if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
        comparison = aVal === bVal ? 0 : aVal ? -1 : 1;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredUsers, sortKey, sortDirection]);

  const handleToggleActive = (user: User) => {
    updateUser(user.id, { isActive: !user.isActive });
    toast({
      title: user.isActive ? 'Utilisateur désactivé' : 'Utilisateur activé',
      description: `${user.firstName} ${user.lastName} a été ${user.isActive ? 'désactivé' : 'activé'}.`,
    });
  };

  const handleDelete = (user: User) => {
    deleteUser(user.id);
    toast({ title: 'Utilisateur supprimé', description: `${user.firstName} ${user.lastName} a été supprimé.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground">{filteredUsers.length} utilisateur(s)</p>
        </div>
        <Button className="gradient-primary text-primary-foreground gap-2">
          <Plus className="w-4 h-4" /> Ajouter
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border p-4 shadow-card">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Rechercher..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <SortableTableHeader label="Utilisateur" sortKey="fullName" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
              <SortableTableHeader label="Email" sortKey="email" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
              <SortableTableHeader label="Rôle" sortKey="role" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
              <SortableTableHeader label="Statut" sortKey="isActive" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
              <SortableTableHeader label="Date création" sortKey="createdAt" currentSortKey={sortKey} currentSortDirection={sortDirection} onSort={handleSort} />
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.avatarUrl} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell><Badge variant="outline">{ROLE_LABELS[user.role]}</Badge></TableCell>
                <TableCell>
                  <Badge className={cn(user.isActive ? 'bg-success-light text-success' : 'bg-danger-light text-danger')}>
                    {user.isActive ? 'Actif' : 'Inactif'}
                  </Badge>
                </TableCell>
                <TableCell>{format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem><Pencil className="w-4 h-4 mr-2" />Modifier</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(user)}>
                        {user.isActive ? <><UserX className="w-4 h-4 mr-2" />Désactiver</> : <><UserCheck className="w-4 h-4 mr-2" />Activer</>}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(user)} className="text-danger"><Trash2 className="w-4 h-4 mr-2" />Supprimer</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UsersPage;
