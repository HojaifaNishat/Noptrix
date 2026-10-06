import type {
    HTMLAttributes,
} from "react";

interface SkeletonProps
    extends HTMLAttributes<HTMLDivElement> {
    width?: string;
    height?: string;
}

export function Skeleton({
    width,
    height,
    className = "",
    style,
    ...props
}: SkeletonProps) {
    return (
        <div
            aria-hidden="true"
            className={`
                animate-pulse
                rounded-md
                bg-muted
                ${className}
            `}
            style={{
                width,
                height,
                ...style,
            }}
            {...props}
        />
    );
}
