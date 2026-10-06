import type {
    ReactNode,
} from "react";

interface FormActionsProps {
    children: ReactNode;
    align?: "start" | "center" | "end" | "between";
    className?: string;
}

const alignmentClasses = {
    start: "justify-start",
    center: "justify-center",
    end: "justify-end",
    between: "justify-between",
};

export function FormActions({
    children,
    align = "end",
    className = "",
}: FormActionsProps) {
    return (
        <div
            className={`
                flex
                flex-wrap
                items-center
                gap-3
                ${alignmentClasses[align]}
                ${className}
            `}
        >
            {children}
        </div>
    );
}
