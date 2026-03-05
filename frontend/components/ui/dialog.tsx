import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

const Dialog = ({ open, onOpenChange, children }: { open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => onOpenChange(false)}>
            <div className="relative bg-background text-foreground rounded-lg shadow-2xl w-full max-w-lg border border-border" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={() => onOpenChange(false)}
                    className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
                {children}
            </div>
        </div>
    );
};

const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("grid gap-4 p-6", className)}>{children}</div>
);

const DialogHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>{children}</div>
);

const DialogFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)}>{children}</div>
);

const DialogTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <h3 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>{children}</h3>
);

const DialogDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
);

const DialogTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogTrigger };
