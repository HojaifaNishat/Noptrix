import type {
    ReactNode,
} from "react";

export interface DataTableColumn<T> {
    key: string;
    header: string;
    cell: (row: T, index: number) => ReactNode;
    className?: string;
    headerClassName?: string;
}

interface DataTableProps<T> {
    columns: DataTableColumn<T>[];
    data: T[];
    getRowKey?: (row: T, index: number) => string;
    onRowClick?: (row: T, index: number) => void;
    loading?: boolean;
    emptyMessage?: string;
    loadingRows?: number;
    className?: string;
}

export function DataTable<T>({
    columns,
    data,
    getRowKey,
    onRowClick,
    loading = false,
    emptyMessage = "No records found.",
    loadingRows = 5,
    className = "",
}: DataTableProps<T>) {
    return (
        <div
            className={`
                overflow-hidden
                rounded-xl
                border border-border
                bg-card
                ${className}
            `}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse">
                    <thead>
                        <tr className="border-b border-border bg-muted/40">
                            {columns.map((column) => (
                                <th
                                    key={column.key}
                                    className={`
                                        px-4
                                        py-3
                                        text-left
                                        text-xs
                                        font-semibold
                                        uppercase
                                        tracking-wide
                                        text-muted-foreground
                                        ${column.headerClassName || ""}
                                    `}
                                >
                                    {column.header}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            Array.from({
                                length: loadingRows,
                            }).map((_, rowIndex) => (
                                <tr
                                    key={`loading-${rowIndex}`}
                                    className="border-b border-border last:border-0"
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className="px-4 py-4"
                                        >
                                            <div
                                                className="
                                                    h-4
                                                    w-3/4
                                                    animate-pulse
                                                    rounded
                                                    bg-muted
                                                "
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={columns.length}
                                    className="
                                        px-4
                                        py-12
                                        text-center
                                        text-sm
                                        text-muted-foreground
                                    "
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            data.map((row, index) => (
                                <tr
                                    key={
                                        getRowKey
                                            ? getRowKey(row, index)
                                            : index
                                    }
                                    onClick={
                                        onRowClick
                                            ? () =>
                                                  onRowClick(
                                                      row,
                                                      index,
                                                  )
                                            : undefined
                                    }
                                    className={`
                                        border-b
                                        border-border
                                        last:border-0
                                        transition-colors
                                        ${
                                            onRowClick
                                                ? "cursor-pointer hover:bg-muted/40"
                                                : "hover:bg-muted/20"
                                        }
                                    `}
                                >
                                    {columns.map((column) => (
                                        <td
                                            key={column.key}
                                            className={`
                                                px-4
                                                py-3.5
                                                text-sm
                                                text-foreground
                                                ${column.className || ""}
                                            `}
                                        >
                                            {column.cell(
                                                row,
                                                index,
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
