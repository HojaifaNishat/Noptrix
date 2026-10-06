import {
    LoadingSpinner,
} from "./LoadingSpinner";

interface PageLoaderProps {
    label?: string;
    className?: string;
}

export function PageLoader({
    label = "Loading page...",
    className = "",
}: PageLoaderProps) {
    return (
        <div
            className={`
                flex
                min-h-[240px]
                w-full
                items-center
                justify-center
                ${className}
            `}
        >
            <div className="flex flex-col items-center gap-3">
                <LoadingSpinner
                    size="lg"
                    label={label}
                />

                <p className="text-sm text-muted-foreground">
                    {label}
                </p>
            </div>
        </div>
    );
}
