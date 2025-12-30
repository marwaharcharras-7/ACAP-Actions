import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToCSV, exportToPDF, ExportColumn } from '@/lib/exportUtils';
import { toast } from 'sonner';

interface ExportDropdownProps {
  data: Record<string, unknown>[];
  columns: ExportColumn[];
  filename: string;
  title: string;
}

const ExportDropdown = ({ data, columns, filename, title }: ExportDropdownProps) => {
  const handleExportCSV = () => {
    try {
      exportToCSV(data, columns, filename);
      toast.success('Export Excel réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export');
    }
  };

  const handleExportPDF = () => {
    try {
      exportToPDF(data, columns, title, filename);
      toast.success('Export PDF réussi');
    } catch (error) {
      toast.error('Erreur lors de l\'export PDF');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exporter
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-card border-border">
        <DropdownMenuItem onClick={handleExportCSV}>
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Export Excel (CSV)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="w-4 h-4 mr-2" />
          Export PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ExportDropdown;
