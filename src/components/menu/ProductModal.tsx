import { useEffect, useRef, useState } from "react";
import {
  Flame,
  Clock,
  Sparkles,
  Share2,
  Phone,
  MessageCircle,
  Leaf,
  ZoomIn,
  AlertTriangle,
  X,
  Info,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { orderedImages, productTags, type Product, type RestaurantSettings } from "@/lib/queries";
import { DiscountBadge, Price } from "./badges";
import { toast } from "sonner";

interface Props {
  product: Product | null;
  currency: string;
  settings: RestaurantSettings | null;
  onOpenChange: (open: boolean) => void;
}

export function ProductModal({
  product,
  currency,
  settings,
  onOpenChange,
}: Props) {
  const { pick, t, isRTL } = useI18n();
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    setActive(0);
    setZoom(false);
  }, [product?.id]);

  // Mobile hardware back button closes the modal instead of leaving the site.
  // We push a synthetic history entry when the modal opens and pop it on close.
  const onOpenChangeRef = useRef(onOpenChange);
  onOpenChangeRef.current = onOpenChange;
  useEffect(() => {
    if (!product || typeof window === "undefined") return;
    const marker = `product-${product.id}-${Date.now()}`;
    window.history.pushState({ productModal: marker }, "");
    const onPop = () => onOpenChangeRef.current(false);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // If our synthetic entry is still on top (user closed via X / backdrop),
      // remove it so the URL history stays clean.
      if (
        typeof window !== "undefined" &&
        window.history.state &&
        (window.history.state as { productModal?: string }).productModal === marker
      ) {
        window.history.back();
      }
    };
  }, [product?.id]);

  if (!product) return null;

  const name = pick(product, "name");
  const desc = pick(product, "description");
  const ingredients = pick(product, "ingredients");
  const allergens = pick(product, "allergens");
  const notes = pick(product, "notes");
  const tags = productTags(product);
  const images = orderedImages(product).map(mediaUrl).filter(Boolean);
  const hero = images[active] || images[0];

  const orderText = encodeURIComponent(
    isRTL ? `مرحباً، أريد طلب: ${name}` : `Hello, I'd like to order: ${name}`,
  );

  const productUrl = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("item", product.id);
    return url.toString();
  };

  const share = async () => {
    const url = productUrl();
    if (navigator.share) {
      try {
        await navigator.share({ title: name, text: desc, url });
      } catch {
        /* cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t("linkCopied"));
    }
  };

  const ingredientChips = ingredients
    ? ingredients
        .split(/[,،\n]/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex! max-h-[92vh] w-[calc(100%-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden overflow-y-auto rounded-3xl border-border bg-background p-0 no-scrollbar [&>button.absolute]:hidden"
      >
        {/* ===== SECTION 1 — Image ===== */}
        <div className="relative w-full">
          <div
            className={cn(
              "relative aspect-[16/9] w-full overflow-hidden rounded-t-3xl bg-muted",
              hero && "cursor-zoom-in",
            )}
            onClick={() => hero && setZoom(true)}
          >
            {hero ? (
              <img src={hero} alt={name} className="size-full object-cover" />
            ) : (
              <div className="size-full gradient-primary" />
            )}

            {/* readability gradient */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

            {hero ? (
              <span className="pointer-events-none absolute bottom-3 end-3 inline-flex items-center gap-1 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
                <ZoomIn className="size-3.5" />
                {isRTL ? "تكبير" : "Zoom"}
              </span>
            ) : null}

            {!product.is_available ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                <span className="rounded-full bg-foreground/85 px-4 py-1.5 text-sm font-bold text-background">
                  {t("outOfStock")}
                </span>
              </div>
            ) : null}

            {/* Gallery indicators */}
            {images.length > 1 ? (
              <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                {images.map((src, i) => (
                  <button
                    key={src}
                    aria-label={`Image ${i + 1}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActive(i);
                    }}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === active ? "w-6 bg-white" : "w-1.5 bg-white/50",
                    )}
                  />
                ))}
              </div>
            ) : null}
          </div>

          {/* Top-left: Close */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            style={{ left: "0.75rem", top: "0.75rem" }}
            className="absolute z-10 grid size-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70 active:scale-95"
          >
            <X className="size-5" />
          </button>

          {/* Top-right: Share */}
          <button
            type="button"
            aria-label={t("share")}
            onClick={share}
            style={{ right: "0.75rem", top: "0.75rem" }}
            className="absolute z-10 grid size-11 place-items-center rounded-full bg-black/50 text-white backdrop-blur-md transition hover:bg-black/70 active:scale-95"
          >
            <Share2 className="size-5" />
          </button>

          {/* Thumbnail strip (kept for multi-image navigation) */}
          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto px-5 pt-4 no-scrollbar">
              {images.map((src, i) => (
                <button
                  key={`thumb-${src}`}
                  onClick={() => setActive(i)}
                  className={cn(
                    "size-14 shrink-0 overflow-hidden rounded-xl border-2 transition",
                    i === active ? "border-primary" : "border-transparent opacity-70",
                  )}
                >
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* ===== SECTION 2 — Content card ===== */}
        <div className="relative -mt-5 rounded-t-3xl bg-card shadow-elevated">
          <div className="space-y-4 p-5">
            {/* Name */}
            <DialogTitle className="font-heading text-2xl font-extrabold leading-tight text-card-foreground">
              {name}
            </DialogTitle>

            {/* Price + discount */}
            <div className="flex flex-wrap items-center gap-3">
              <Price product={product} currency={currency} size="lg" />
              {product.discount ? <DiscountBadge value={product.discount} /> : null}
            </div>

            {/* Description */}
            {desc ? (
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {desc}
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only">{name}</DialogDescription>
            )}

            {/* Prep time + Calories — side by side */}
            {(product.prep_time || product.calories) && (
              <div className="grid grid-cols-2 gap-2.5">
                {product.prep_time ? (
                  <StatCard
                    icon={Clock}
                    label={t("prepTime")}
                    value={`${product.prep_time} ${t("min")}`}
                  />
                ) : null}
                {product.calories ? (
                  <StatCard
                    icon={Sparkles}
                    label={t("calories")}
                    value={`${product.calories} ${t("cal")}`}
                  />
                ) : null}
              </div>
            )}

            {/* Meta chips (spicy / vegetarian) */}
            {(product.is_spicy || product.is_vegetarian) && (
              <div className="flex flex-wrap gap-2">
                {product.is_spicy ? <Meta icon={Flame} label={t("spicy")} /> : null}
                {product.is_vegetarian ? <Meta icon={Leaf} label={t("vegetarian")} /> : null}
              </div>
            )}

            {/* Ingredients as chips */}
            {ingredientChips.length ? (
              <section className="space-y-2.5">
                <h4 className="font-heading text-sm font-bold text-card-foreground">
                  {t("ingredients")}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {ingredientChips.map((chip, i) => (
                    <span
                      key={`${chip}-${i}`}
                      className="rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {/* Tags */}
            {tags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            ) : null}

            {/* Allergens — warning card */}
            {allergens ? (
              <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
                <h4 className="mb-1.5 flex items-center gap-1.5 font-heading text-sm font-bold text-accent">
                  <AlertTriangle className="size-4" /> {t("allergens")}
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {allergens}
                </p>
              </div>
            ) : null}

            {/* Notes — info card */}
            {notes ? (
              <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4">
                <h4 className="mb-1.5 flex items-center gap-1.5 font-heading text-sm font-bold text-primary">
                  <Info className="size-4" /> {t("notes")}
                </h4>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {notes}
                </p>
              </div>
            ) : null}

            {/* Actions — WhatsApp then Call */}
            {(settings?.whatsapp || settings?.phone) && (
              <div className="grid grid-cols-1 gap-2.5 pt-1">
                {settings?.whatsapp ? (
                  <Button
                    asChild
                    size="lg"
                    className="h-12 gap-2 rounded-2xl bg-success text-success-foreground shadow-soft hover:bg-success/90"
                  >
                    <a
                      href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}?text=${orderText}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle className="size-5" /> {t("whatsapp")}
                    </a>
                  </Button>
                ) : null}
                {settings?.phone ? (
                  <Button
                    asChild
                    size="lg"
                    variant="secondary"
                    className="h-12 gap-2 rounded-2xl"
                  >
                    <a href={`tel:${settings.phone}`}>
                      <Phone className="size-5" /> {t("call")}
                    </a>
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </DialogContent>

      {/* Zoom lightbox */}
      <Dialog open={zoom} onOpenChange={setZoom}>
        <DialogContent className="max-w-3xl border-none bg-transparent p-0 shadow-none">
          <DialogTitle className="sr-only">{name}</DialogTitle>
          {hero ? (
            <img src={hero} alt={name} className="max-h-[85vh] w-full rounded-2xl object-contain" />
          ) : null}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

function Meta({ icon: Icon, label }: { icon: typeof Flame; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-secondary-foreground">
      <Icon className="size-3.5" />
      {label}
    </span>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/50 p-3">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <div className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="truncate font-heading text-base font-black text-card-foreground">
          {value}
        </div>
      </div>
    </div>
  );
}
