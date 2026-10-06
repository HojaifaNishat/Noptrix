"use client";

import {
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

import {
    Button,
} from "@/components/ui";

interface TablePaginationProps {
    page: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
    className?: string;
}

export function TablePagination({
    page,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    disabled = false,
    className = "",
}: TablePaginationProps) {
    const safeTotalPages = Math.max(totalPages, 1);
    const canPrevious = page > 1;
    const canNext = page < safeTotalPages;

    const startItem =
        totalItems !== undefined && pageSize
            ? Math.min(
                  (page - 1) * pageSize + 1,
                  totalItems,
              )
            : undefined;

    const endItem =
        totalItems !== undefined && pageSize
            ? Math.min(
                  page * pageSize,
                  totalItems,
              )
            : undefined;

    return (
        <div
            className={`
                flex
                flex-wrap
                items-center
                justify-between
                gap-3
                border-t
                border-border
                px-4
                py-3
                ${className}
            `}
        >
            <div className="text-sm text-muted-foreground">
                {startItem !== undefined &&
                endItem !== undefined &&
                totalItems !== undefined ? (
                    <>
                        Showing{" "}
                        <span className="font-medium text-foreground">
                            {startItem}
                        </span>
                        {"–"}
                        <span className="font-medium text-foreground">
                            {endItem}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-foreground">
                            {totalItems}
                        </span>
                    </>
                ) : (
                    <>
                        Page{" "}
                        <span className="font-medium text-foreground">
                            {page}
                        </span>{" "}
                        of{" "}
                        <span className="font-medium text-foreground">
                            {safeTotalPages}
                        </span>
                    </>
                )}
            </div>

            <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={
                        disabled || !canPrevious
                    }
                    onClick={() =>
                        onPageChange(page - 1)
                    }
                    aria-label="Previous page"
                >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">
                        Previous
                    </span>
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    disabled={
                        disabled || !canNext
                    }
                    onClick={() =>
                        onPageChange(page + 1)
                    }
                    aria-label="Next page"
                >
                    <span className="hidden sm:inline">
                        Next
                    </span>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
