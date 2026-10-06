import type {
    InputHTMLAttributes,
} from "react";

export type CheckboxProps =
    InputHTMLAttributes<HTMLInputElement>;

export function Checkbox({
    className = "",
    ...props
}: CheckboxProps) {
    return (
        <input
            type="checkbox"
            className={`
                h-4 w-4
                cursor-pointer
                rounded
                border-border
                accent-primary
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${className}
            `}
            {...props}
        />
    );
}
