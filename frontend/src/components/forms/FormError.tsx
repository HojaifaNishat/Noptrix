interface FormErrorProps {
    message?: string | null;
    className?: string;
}

export function FormError({
    message,
    className = "",
}: FormErrorProps) {
    if (!message) {
        return null;
    }

    return (
        <p
            className={`
                text-sm
                font-medium
                text-destructive
                ${className}
            `}
            role="alert"
        >
            {message}
        </p>
    );
}
