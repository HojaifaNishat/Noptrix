import type {
    ReactNode,
} from "react";

interface AvatarProps {
    src?: string | null;
    alt?: string;
    fallback?: string;
    size?: "sm" | "md" | "lg" | "xl";
    children?: ReactNode;
    className?: string;
}

const sizeClasses = {
    sm: "h-7 w-7 text-xs",
    md: "h-9 w-9 text-sm",
    lg: "h-11 w-11 text-base",
    xl: "h-14 w-14 text-lg",
};

export function Avatar({
    src,
    alt = "",
    fallback = "?",
    size = "md",
    children,
    className = "",
}: AvatarProps) {
    return (
        <div
            className={`
                relative
                flex
                shrink-0
                items-center
                justify-center
                overflow-hidden
                rounded-full
                bg-primary/10
                font-semibold
                text-primary
                ${sizeClasses[size]}
                ${className}
            `}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover"
                />
            ) : (
                children || fallback
            )}
        </div>
    );
}
