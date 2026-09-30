export type ID = string;

export type Nullable<T> = T | null;

export type Optional<T> = T | undefined;

export interface SelectOption<T extends string = string> {
    label: string;
    value: T;
}

export interface DateRange {
    from?: string;
    to?: string;
}

export interface SortConfig {
    field: string;
    direction: "asc" | "desc";
}

export interface SearchParams {
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}