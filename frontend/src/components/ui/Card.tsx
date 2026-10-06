import type {
    HTMLAttributes,
    ReactNode,
} from "react";

interface CardProps
    extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
}

export function Card({
    children,
    className = "",
    ...props
}: CardProps) {
    return (
        <div
            className={`
                rounded-xl
                border
                border-border
                bg-card
                text-card-foreground
                shadow-sm
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({
    children,
    className = "",
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`p-5 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardTitle({
    children,
    className = "",
    ...props
}: HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h3
            className={`
                text-base
                font-semibold
                text-foreground
                ${className}
            `}
            {...props}
        >
            {children}
        </h3>
    );
}

export function CardContent({
    children,
    className = "",
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`px-5 pb-5 ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardFooter({
    children,
    className = "",
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`
                flex
                items-center
                border-t
                border-border
                px-5
                py-4
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
}
