import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface ConfirmDialogProps {
    trigger: ReactNode;
    title?: string;
    description?: string;
    actionLabel?: string;
    cancelLabel?: string;
    variant?: "default" | "destructive";
    onConfirm: () => void;
}

export function ConfirmDialog({
    trigger,
    title = "Are you absolutely sure?",
    description = "This action cannot be undone.",
    actionLabel = "Continue",
    cancelLabel = "Cancel",
    variant = "default",
    onConfirm,
}: ConfirmDialogProps) {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                    >
                        {actionLabel}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
