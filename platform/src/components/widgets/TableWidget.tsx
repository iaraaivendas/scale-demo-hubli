import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { useState, useMemo } from "react";

export interface TableColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  format?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
  width?: string;
}

interface TableWidgetProps {
  data: Array<Record<string, unknown>>;
  columns: TableColumn[];
  maxRows?: number;
  showPagination?: boolean;
  onRowClick?: (row: Record<string, unknown>) => void;
  highlightColumn?: string;
  className?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function TableWidget({
  data,
  columns,
  maxRows = 10,
  showPagination = false,
  onRowClick,
  highlightColumn,
  className,
}: TableWidgetProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      }
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal || '');
      const bStr = String(bVal || '');
      return sortDirection === 'asc' 
        ? aStr.localeCompare(bStr) 
        : bStr.localeCompare(aStr);
    });
  }, [data, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    const start = currentPage * maxRows;
    return sortedData.slice(start, start + maxRows);
  }, [sortedData, currentPage, maxRows]);

  const totalPages = Math.ceil(data.length / maxRows);

  const renderCellValue = (column: TableColumn, row: Record<string, unknown>) => {
    const value = row[column.key];

    if (column.format) {
      return column.format(value, row);
    }

    if (typeof value === 'number') {
      return (
        <span className="font-mono-data">
          {value.toLocaleString('pt-BR')}
        </span>
      );
    }

    if (typeof value === 'boolean') {
      return (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Sim' : 'Não'}
        </Badge>
      );
    }

    return String(value || '-');
  };

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortColumn !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-primary" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1 text-primary" />;
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="rounded-md border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  className={cn(
                    "text-xs font-semibold",
                    column.align === 'right' && "text-right",
                    column.align === 'center' && "text-center",
                    column.sortable && "cursor-pointer hover:bg-muted select-none"
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className={cn(
                    "flex items-center",
                    column.align === 'right' && "justify-end",
                    column.align === 'center' && "justify-center"
                  )}>
                    {column.label}
                    {column.sortable && <SortIcon columnKey={column.key} />}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex}
                className={cn(
                  "hover:bg-muted/30 transition-colors",
                  onRowClick && "cursor-pointer"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column) => (
                  <TableCell 
                    key={column.key}
                    className={cn(
                      "text-sm py-2.5",
                      column.align === 'right' && "text-right",
                      column.align === 'center' && "text-center",
                      highlightColumn === column.key && "font-semibold text-primary"
                    )}
                  >
                    {renderCellValue(column, row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {paginatedData.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                  Nenhum dado disponível
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 text-sm text-muted-foreground">
          <span>
            Mostrando {currentPage * maxRows + 1} - {Math.min((currentPage + 1) * maxRows, data.length)} de {data.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="px-2 py-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-2">
              {currentPage + 1} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="px-2 py-1 rounded hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próximo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
