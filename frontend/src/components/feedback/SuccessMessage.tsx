import {
    CheckCircle2,
} from "lucide-react";

interface SuccessMessageProps {
    title?: string;
    message: string;
    className?: string;
}

export function SuccessMessage({
    title = "Success",
    message,
    className = "",
}: SuccessMessageProps) {
    return (
        <div
            className={`
                flex
                gap-3
                rounded-lg
                border
                border-emerald-500/20
                bg-emerald-500/5
                px-4
                py-3
                text-emerald-700
                dark:text-emerald-400
                ${className}
            `}
            role="status"
        >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

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
