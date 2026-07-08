import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { ProductCard } from "@/components/menu/ProductCard";
import type { Product } from "@/lib/queries";

/**
 * Search overlay. The filtering behaviour is identical to the inline
 * header search — only the presentation changes:
 *  - Mobile: fullscreen modal.
 *  - Desktop: centred dialog.
 * The underlying page is never scrolled, so closing the overlay leaves
 * the visitor exactly where they were.
 */
export function SearchDialog({
  open,
  onOpenChange,
  products,
  currency,
  onSelectProduct,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  products: Product[];
  currency: string;
  onSelectProduct: (p: Product) => void;
}) {
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset + focus each time it opens.
  useEffect(() => {
    if (open) {
      setQuery("");
      const id = window.setTimeout(() => inputRef.current?.focus(), 80);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  const q = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!q) return [];
    return products.filter((p) =>
      [p.name_ar, p.name_en, p.description_ar, p.description_en, p.ingredients_ar, p.ingredients_en]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [products, q]);

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed z-50 flex flex-col bg-background shadow-elevated outline-none duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            // Mobile: fullscreen
            "inset-0 h-[100dvh] w-full",
            // Desktop: centred dialog
            "sm:inset-auto sm:left-1/2 sm:top-[12%] sm:h-auto sm:max-h-[76vh] sm:w-full sm:max-w-lg sm:-translate-x-1/2 sm:rounded-2xl sm:border sm:border-border sm:data-[state=closed]:zoom-out-95 sm:data-[state=open]:zoom-in-95",
          )}
        >
          <DialogPrimitive.Title className="sr-only">{t("search")}</DialogPrimitive.Title>

          {/* Search field */}
          <div className="flex items-center gap-2 border-b border-border p-4">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search")}
                className="h-11 w-full rounded-xl border border-border bg-card ps-10 pe-10 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
              />
              {query ? (
                <button
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="clear"
                  className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
            <DialogPrimitive.Close
              aria-label="close"
              className="press flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:border-primary/40"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-4">
            {!q ? (
              <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                <Search className="mb-3 size-8" />
                <p className="text-sm">{t("search")}</p>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                  <SearchX className="size-8" />
                </div>
                <h3 className="font-heading text-lg font-bold text-foreground">{t("noResults")}</h3>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t("noResultsDesc")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {results.map((p, i) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    currency={currency}
                    layout="list"
                    index={i}
                    onClick={() => onSelectProduct(p)}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
