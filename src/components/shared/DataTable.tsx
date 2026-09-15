import { useState, type ReactNode } from "react";
import {
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DataTableProps<T> {
  columns: ColumnDef<T, any>[];
  data: T[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  getRowId?: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: (selection: RowSelectionState) => void;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: (visibility: VisibilityState) => void;
  page?: number;
  limit?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  /**
   * How much room a row gets.
   *
   * `compact` is the console default and what every existing table renders at —
   * 13px in a 2px-padded cell, tuned for fitting a lot of records on screen.
   * `spacious` is for the two lists people actually *read* rather than scan for
   * a row they already know: Leads and Applications. Bigger type, room to put a
   * second line under a name, and a row you can pick out from across a desk.
   */
  density?: "compact" | "spacious";
}

export function DataTable<T>({
  columns,
  data,
  isLoading,
  emptyState,
  getRowId,
  onRowClick,
  selectable,
  rowSelection,
  onRowSelectionChange,
  columnVisibility,
  onColumnVisibilityChange,
  page = 1,
  limit = 20,
  total,
  onPageChange,
  density = "compact",
}: DataTableProps<T>) {
  const spacious = density === "spacious";
  const [sorting, setSorting] = useState<SortingState>([]);

  const allColumns: ColumnDef<T, any>[] = selectable
    ? [
        {
          id: "__select",
          size: 36,
          header: ({ table }) => (
            <Checkbox
              checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(!!v)}
              onClick={(e) => e.stopPropagation()}
              aria-label="Select row"
            />
          ),
        },
        ...columns,
      ]
    : columns;

  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      rowSelection: rowSelection ?? {},
      columnVisibility: columnVisibility ?? {},
    },
    getRowId,
    enableRowSelection: selectable,
    onSortingChange: setSorting,
    onRowSelectionChange: (updater) => {
      if (!onRowSelectionChange) return;
      const next = typeof updater === "function" ? updater(rowSelection ?? {}) : updater;
      onRowSelectionChange(next);
    },
    onColumnVisibilityChange: (updater) => {
      if (!onColumnVisibilityChange) return;
      const next = typeof updater === "function" ? updater(columnVisibility ?? {}) : updater;
      onColumnVisibilityChange(next);
    },
    columnResizeMode: "onChange",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const totalPages = total !== undefined ? Math.max(1, Math.ceil(total / limit)) : undefined;

  return (
    /*
      No card around the list.

      Every list in the console used to sit inside a rounded, ringed `bg-card`
      panel — a box drawn around data that is already the whole point of the
      page. It made the table read as one more widget on the screen rather than
      as the screen's content, and it inset the first column from the page's own
      left edge, so the heading above it and the first value under it never
      lined up.

      What is left is the data and its hairlines. Rows still separate, the
      header still reads as a header, and the first and last cells sit flush
      with the page gutter so the table aligns with everything above it.

      Two things went with the card, both deliberately. The internal
      `max-height` scroll area: these lists are paginated at 20 rows, so it
      almost never engaged, and when it did it put a second scrollbar inside the
      page — the clearest possible signal that you are looking at a box. And the
      sticky header, which only worked *because* of that inner scroller; over 20
      rows it was earning nothing.
    */
    <div className="w-full">
      {/* No scroll wrapper here: `Table` already renders its own
          `relative w-full overflow-x-auto` container, and nesting a second one
          gave the page two horizontal scrollbars for the same overflow. */}
      <div>
        {/*
          `minWidth`, not `width`. Pinning the table to the sum of its column
          sizes meant it stopped wherever those added up to — on a wide screen
          the rows ended short of the page's right edge, with the hairlines
          trailing off into empty space, which looked like a container even
          after the container was gone. As a minimum it fills whatever room
          there is and still scrolls horizontally when the columns need more.
        */}
        <Table className="w-full" style={{ minWidth: table.getTotalSize() }}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDir = header.column.getIsSorted();
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                      className={cn(
                        "relative select-none whitespace-nowrap bg-transparent font-medium tracking-[0.005em] text-muted-foreground",
                        "first:pl-0 last:pr-0",
                        spacious ? "h-11 px-4 text-[12px] uppercase tracking-[0.06em]" : "text-[11.5px]",
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <button
                          type="button"
                          disabled={!canSort}
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn("inline-flex items-center gap-1", canSort && "cursor-pointer hover:text-foreground")}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort &&
                            (sortDir === "asc" ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : sortDir === "desc" ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : (
                              <ArrowUpDown className="h-3 w-3 opacity-40" />
                            ))}
                        </button>
                      )}
                      {header.column.getCanResize() && (
                        <div
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          className="absolute right-0 top-0 h-full w-1 cursor-col-resize touch-none select-none bg-transparent hover:bg-border"
                        />
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={allColumns.length} className="h-40 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={allColumns.length} className="p-0">
                  {emptyState ?? <div className="py-16 text-center text-sm text-muted-foreground">No results.</div>}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={cn("first:pl-0 last:pr-0", spacious ? "px-4 py-4 text-[15px]" : "text-[13px]")}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {total !== undefined && onPageChange && (
        <div className="flex items-center justify-between border-t border-border py-3">
          <p className="text-xs text-muted-foreground">
            {total === 0 ? "0 results" : `${(page - 1) * limit + 1}–${Math.min(page * limit, total)} of ${total}`}
          </p>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="icon" className="h-7 w-7" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <span className="min-w-[70px] text-center text-xs tabular-nums text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={totalPages !== undefined && page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
