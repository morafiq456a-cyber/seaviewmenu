import { motion } from "framer-motion";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { coverImage, type Product } from "@/lib/queries";
import { DiscountBadge, Price, ProductTags } from "./badges";

interface Props {
  product: Product;
  currency: string;
  layout: "grid" | "list";
  index?: number;
  onClick: () => void;
}

export function ProductCard({ product, currency, layout, index = 0, onClick }: Props) {
  const { pick, t } = useI18n();
  const name = pick(product, "name");
  const desc = pick(product, "description");
  const img = mediaUrl(coverImage(product));
  const unavailable = !product.is_available;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.3), ease: [0.22, 1, 0.36, 1] }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        "menu-card group relative overflow-hidden rounded-2xl text-start hover:-translate-y-0.5",
        layout === "list" && "flex items-stretch",
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "relative overflow-hidden bg-muted",
          layout === "grid" ? "aspect-[4/3] w-full" : "aspect-square w-28 shrink-0 sm:w-36",
        )}
      >
        {img ? (
          <img
            src={img}
            alt={name}
            loading="lazy"
            className={cn(
              "size-full object-cover transition-transform duration-500 group-hover:scale-105",
              unavailable && "grayscale",
            )}
          />
        ) : (
          <div className="flex size-full items-center justify-center gradient-primary opacity-90">
            <ImageOff className="size-8 text-primary-foreground/70" />
          </div>
        )}

        {product.discount ? (
          <DiscountBadge value={product.discount} className="absolute start-2 top-2" />
        ) : null}

        {unavailable ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[1px]">
            <span className="rounded-full bg-foreground/85 px-3 py-1 text-xs font-bold text-background">
              {t("outOfStock")}
            </span>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div
        className={cn("flex flex-1 flex-col gap-1.5 p-3.5", layout === "list" && "justify-center")}
      >
        <ProductTags product={product} />
        <h3 className="font-heading text-base font-bold leading-tight text-card-foreground">
          {name}
        </h3>
        {desc ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">{desc}</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-1.5">
          <Price product={product} currency={currency} size="md" />
          {product.calories ? (
            <span className="text-[11px] font-medium text-muted-foreground">
              {product.calories} {t("cal")}
            </span>
          ) : null}
        </div>
      </div>
    </motion.button>
  );
}
