import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

import { useI18n } from "@/lib/i18n";
import { useAdminT } from "@/lib/admin-i18n";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the destructive style (default true). */
  destructive?: boolean;
  /**
   * Optional async work executed while the dialog shows a spinner and disables
   * its buttons. On success the dialog closes and the promise resolves `true`.
   * On error a toast is shown and the dialog stays open for another attempt.
   */
  action?: () => Promise<void> | void;
}

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Provides a promise-based confirmation dialog for every destructive action in
 * the admin panel. A single premium Alert Dialog is rendered here and driven by
 * `useConfirm()`, keeping call sites terse while guaranteeing consistent copy,
 * animation, RTL support, focus management and loading behaviour everywhere.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const t = useAdminT();
  const { dir } = useI18n();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((value: boolean) => {
    resolver.current?.(value);
    resolver.current = null;
  }, []);

  const confirm = useCallback<ConfirmFn>((opts = {}) => {
    setOptions(opts);
    setBusy(false);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleCancel = useCallback(() => {
    if (busy) return;
    setOpen(false);
    settle(false);
  }, [busy, settle]);

  const handleConfirm = useCallback(async () => {
    if (options.action) {
      setBusy(true);
      try {
        await options.action();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : String(e));
        setBusy(false);
        return; // keep the dialog open so the user can retry or cancel
      }
      setBusy(false);
    }
    setOpen(false);
    settle(true);
  }, [options, settle]);

  const destructive = options.destructive ?? true;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AlertDialog open={open} onOpenChange={(o) => !o && handleCancel()}>
        <AlertDialogContent
          dir={dir}
          onEscapeKeyDown={(e) => {
            if (busy) e.preventDefault();
          }}
          className="max-w-md gap-0 overflow-hidden rounded-3xl border-border/70 p-0 shadow-elevated"
        >
          <AlertDialogHeader className="items-center gap-3 p-6 text-center sm:text-center">
            <span
              className={cn(
                "flex size-12 items-center justify-center rounded-2xl",
                destructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
              )}
            >
              <AlertTriangle className="size-6" />
            </span>
            <AlertDialogTitle className="font-heading text-xl font-black">
              {options.title ?? t("areYouSure")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-balance text-sm leading-relaxed">
              {options.description ?? t("deleteWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse gap-2 border-t border-border/60 bg-muted/30 p-4 sm:flex-row sm:justify-center sm:gap-3 sm:space-x-0">
            <AlertDialogCancel disabled={busy} className="mt-0 flex-1 rounded-xl sm:flex-1">
              {options.cancelLabel ?? t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                void handleConfirm();
              }}
              className={cn(
                "flex-1 rounded-xl sm:flex-1",
                destructive && buttonVariants({ variant: "destructive" }),
              )}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              {options.confirmLabel ?? t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

/** Returns `confirm(options): Promise<boolean>` for destructive actions. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
