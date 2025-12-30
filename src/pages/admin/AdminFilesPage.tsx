import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  FileText,
  FileImage,
  FileSpreadsheet,
  File,
  Eye,
  Download,
  Trash2,
  MoreHorizontal,
  Video,
  Loader2,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useFileUpload } from '@/hooks/useFileUpload';
import AdminPagination from '@/components/common/AdminPagination';

const ITEMS_PER_PAGE = 4;

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  actionId: string;
  actionTitle: string;
  uploadedById: string;
  uploadedByName: string;
  lineName: string | null;
  createdAt: string;
}

const getFileType = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.includes('pdf')) return 'pdf';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('xlsx')) return 'excel';
  if (mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('docx')) return 'doc';
  if (mimeType.startsWith('video/')) return 'video';
  return 'other';
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="h-5 w-5 text-red-500" />;
    case 'image': return <FileImage className="h-5 w-5 text-green-500" />;
    case 'excel': return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
    case 'doc': return <FileText className="h-5 w-5 text-blue-500" />;
    case 'video': return <Video className="h-5 w-5 text-pink-500" />;
    default: return <File className="h-5 w-5 text-gray-500" />;
  }
};

const getTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    pdf: 'bg-red-100 text-red-700',
    image: 'bg-green-100 text-green-700',
    excel: 'bg-emerald-100 text-emerald-700',
    doc: 'bg-blue-100 text-blue-700',
    video: 'bg-pink-100 text-pink-700',
    other: 'bg-gray-100 text-gray-700',
  };
  return colors[type] || colors.other;
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const AdminFilesPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [lineFilter, setLineFilter] = useState('all');
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { getSignedUrl, deleteAttachment } = useFileUpload();

  // Fetch all attachments from database
  const { data: files = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-files'],
    queryFn: async (): Promise<FileItem[]> => {
      const { data, error } = await supabase
        .from('attachments')
        .select(`
          *,
          profiles:uploaded_by_id(first_name, last_name),
          actions:action_id(title, line_id, lines:line_id(name))
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        size: a.size,
        url: a.url,
        actionId: a.action_id,
        actionTitle: a.actions?.title || 'Action inconnue',
        uploadedById: a.uploaded_by_id,
        uploadedByName: a.profiles ? `${a.profiles.first_name} ${a.profiles.last_name}` : 'Inconnu',
        lineName: a.actions?.lines?.name || null,
        createdAt: a.created_at,
      }));
    },
  });

  const filteredFiles = useMemo(() => {
    return files.filter(file => {
      const fileType = getFileType(file.type);
      const matchesSearch = file.name.toLowerCase().includes(search.toLowerCase()) ||
        file.actionTitle.toLowerCase().includes(search.toLowerCase());
      const matchesType = typeFilter === 'all' || fileType === typeFilter;
      const matchesLine = lineFilter === 'all' || file.lineName === lineFilter;
      return matchesSearch && matchesType && matchesLine;
    });
  }, [files, search, typeFilter, lineFilter]);

  const paginatedFiles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFiles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFiles, currentPage]);

  const totalPages = Math.ceil(filteredFiles.length / ITEMS_PER_PAGE);

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, typeFilter, lineFilter]);

  const uniqueLines = [...new Set(files.filter(f => f.lineName).map(f => f.lineName as string))];

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${file.name}" ?`)) return;
    
    setDeletingId(file.id);
    try {
      const success = await deleteAttachment(file.id, file.url);
      if (success) {
        await refetch();
        toast.success('Fichier supprimé');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (file: FileItem) => {
    setDownloadingId(file.id);
    try {
      const signedUrl = await getSignedUrl('attachments', file.url);
      if (signedUrl) {
        // Force download using fetch and blob
        const response = await fetch(signedUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Téléchargement de ${file.name}`);
      } else {
        toast.error('Impossible de télécharger le fichier');
      }
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreview = async (file: FileItem) => {
    setPreviewFile(file);
    setPreviewUrl(null);
    
    const fileType = getFileType(file.type);
    if (fileType === 'image') {
      const signedUrl = await getSignedUrl('attachments', file.url);
      setPreviewUrl(signedUrl);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestion des fichiers</h1>
          <p className="text-muted-foreground">
            {files.length} fichier{files.length > 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un fichier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="image">Image</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="doc">Document</SelectItem>
                <SelectItem value="video">Vidéo</SelectItem>
              </SelectContent>
            </Select>
            <Select value={lineFilter} onValueChange={setLineFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Ligne" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les lignes</SelectItem>
                {uniqueLines.map(line => (
                  <SelectItem key={line} value={line}>{line}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Action liée</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Taille</TableHead>
                  <TableHead className="hidden lg:table-cell">Ajouté par</TableHead>
                  <TableHead className="hidden lg:table-cell">Ligne</TableHead>
                  <TableHead className="hidden xl:table-cell">Date</TableHead>
                  <TableHead className="w-12">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedFiles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Aucun fichier trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedFiles.map((file) => {
                    const fileType = getFileType(file.type);
                    return (
                      <TableRow key={file.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {getFileIcon(fileType)}
                            <span className="font-medium">{file.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground max-w-[200px] truncate">
                          {file.actionTitle}
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeBadge(fileType)}>
                            {fileType.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatFileSize(file.size)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{file.uploadedByName}</TableCell>
                        <TableCell className="hidden lg:table-cell">{file.lineName || '-'}</TableCell>
                        <TableCell className="hidden xl:table-cell text-muted-foreground">
                          {format(new Date(file.createdAt), 'dd MMM yyyy', { locale: fr })}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={downloadingId === file.id || deletingId === file.id}>
                                {(downloadingId === file.id || deletingId === file.id) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handlePreview(file)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Aperçu
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDownload(file)}>
                                <Download className="h-4 w-4 mr-2" />
                                Télécharger
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDelete(file)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredFiles.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => { setPreviewFile(null); setPreviewUrl(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {previewFile && getFileIcon(getFileType(previewFile.type))}
              {previewFile?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-muted rounded-lg p-8 flex items-center justify-center min-h-[300px]">
              {previewUrl && getFileType(previewFile?.type || '') === 'image' ? (
                <img src={previewUrl} alt={previewFile?.name} className="max-w-full max-h-[400px] rounded" />
              ) : (
                <div className="text-center">
                  {previewFile && getFileIcon(getFileType(previewFile.type))}
                  <p className="mt-4 text-muted-foreground">Aperçu non disponible</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => previewFile && handleDownload(previewFile)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger pour voir
                  </Button>
                </div>
              )}
            </div>
            {previewFile && (
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taille:</span>
                  <span>{formatFileSize(previewFile.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ajouté par:</span>
                  <span>{previewFile.uploadedByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{format(new Date(previewFile.createdAt), 'dd MMMM yyyy', { locale: fr })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Action liée:</span>
                  <span className="truncate max-w-[200px]">{previewFile.actionTitle}</span>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFilesPage;
