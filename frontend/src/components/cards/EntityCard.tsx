import type {
    ReactNode,
} from "react";

interface EntityCardProps {
    title: string;
    description?: string;
    avatar?: ReactNode;
    badge?: ReactNode;
    metadata?: ReactNode;
    actions?: ReactNode;
    onClick?: () => void;
    className?: string;
}

export function EntityCard({
    title,
    description,
    avatar,
    badge,
    metadata,
    actions,
    onClick,
    className = "",
}: EntityCardProps) {
    const content = (
        <>
            <div className="flex items-start gap-4">
                {avatar && (
                    <div className="shrink-0">
                        {avatar}
                    </div>
                )}

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-semibold">
                            {title}
                        </h3>

                        {badge}
                    </div>

                    {description && (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {description}
                        </p>
                    )}

                    {metadata && (
                        <div className="mt-3">
                            {metadata}
                        </div>
                    )}
                </div>
            </div>

            {actions && (
                <div
                    className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-4"
                    onClick={(event) => {
                        event.stopPropagation();
                    }}
                >
                    {actions}
                </div>
            )}
        </>
    );

    const classes = `
        rounded-xl
        border
        border-border
        bg-background
        p-5
        shadow-sm
        transition
        ${onClick ? "cursor-pointer hover:border-foreground/20 hover:shadow-md" : ""}
        ${className}
    `;

    if (onClick) {
        return (
            <button
                type="button"
                className={`block w-full text-left ${classes}`}
                onClick={onClick}
            >
                {content}
            </button>
        );
    }

    return (
        <div className={classes}>
            {content}
        </div>
    );
}
