import {
    Info,
} from "lucide-react";

interface InfoMessageProps {
    title?: string;
    message: string;
    className?: string;
}

export function InfoMessage({
    title = "Information",
    message,
    className = "",
}: InfoMessageProps) {
    return (
        <div
            className={`
                flex
                gap-3
                rounded-lg
                border
                border-blue-500/20
                bg-blue-500/5
                px-4
                py-3
                text-blue-700
                dark:text-blue-400
                ${className}
            `}
            role="status"
        >
            <Info className="mt-0.5 h-4 w-4 shrink-0" />

            <div className="min-w-0">
                <p className="text-sm font-semibold">
                    {title}
                </p>

                <p className="mt-0.5 text-sm opacity-90">
                    {message}
                </p>
            </div>
        </div>
    );
}
