import { Flame, Leaf, Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import type { Product } from "@/lib/queries";

export function DiscountBadge({ value, className }: { value: number; className?: string }) {
  const { t } = useI18n();
  if (!value) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground shadow-soft",
        className,
      )}
    >
      {value}% {t("off")}
    </span>
  );
}

export function ProductTags({ product, className }: { product: Product; className?: string }) {
  const { t } = useI18n();
  const tags: { icon: typeof Flame; label: string; cls: string }[] = [];
  if (product.is_best_seller)
    tags.push({
      icon: Crown,
      label: t("bestSellers"),
      cls: "bg-primary/15 text-primary",
    });
  if (product.is_new)
    tags.push({ icon: Sparkles, label: t("new"), cls: "bg-success/15 text-success" });
  if (product.is_spicy)
    tags.push({ icon: Flame, label: t("spicy"), cls: "bg-accent/15 text-accent" });
  if (product.is_vegetarian)
    tags.push({ icon: Leaf, label: t("vegetarian"), cls: "bg-success/15 text-success" });

  if (!tags.length) return null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map(({ icon: Icon, label, cls }) => (
        <span
          key={label}
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            cls,
          )}
        >
          <Icon className="size-3" />
          {label}
        </span>
      ))}
    </div>
  );
}

export function Price({
  product,
  currency,
  size = "md",
}: {
  product: Product;
  currency: string;
  size?: "sm" | "md" | "lg";
}) {
  const cur = product.currency || currency || "SAR";
  const sizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  } as const;
  return (
    <div className="flex items-baseline gap-2">
      <span className={cn("font-heading font-extrabold text-foreground", sizes[size])}>
        {Number(product.price).toLocaleString()}
        <span className="ms-1 text-xs font-medium text-muted-foreground">{cur}</span>
      </span>
      {product.old_price ? (
        <span className="text-xs font-medium text-muted-foreground line-through">
          {Number(product.old_price).toLocaleString()}
        </span>
      ) : null}
    </div>
  );
}
