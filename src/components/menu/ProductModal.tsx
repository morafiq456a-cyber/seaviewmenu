import { useEffect, useState } from "react";
import {
  Flame,
  Clock,
  Sparkles,
  Share2,
  Phone,
  MessageCircle,
  Leaf,
  Link2,
  ZoomIn,
  AlertTriangle,
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
  related?: Product[];
  onSelectProduct?: (p: Product) => void;
  onOpenChange: (open: boolean) => void;
}

export function ProductModal({
  product,
  currency,
  settings,
  related = [],
  onSelectProduct,
  onOpenChange,
}: Props) {
  const { pick, t, isRTL } = useI18n();
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    setActive(0);
    setZoom(false);
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

  const copyLink = async () => {
    await navigator.clipboard.writeText(productUrl());
    toast.success(t("linkCopied"));
  };

  const hasNutrition = product.calories || product.prep_time;

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden overflow-y-auto rounded-3xl border-border p-0 sm:max-w-lg no-scrollbar">
        {/* Gallery */}
        <div
          className={cn(
            "relative aspect-[4/3] w-full overflow-hidden bg-muted",
            hero && "cursor-zoom-in",
          )}
          onClick={() => hero && setZoom(true)}
        >
          {hero ? (
            <img src={hero} alt={name} className="size-full object-cover" />
          ) : (
            <div className="size-full gradient-primary" />
          )}
          {hero ? (
            <span className="absolute bottom-3 start-3 flex items-center gap-1 rounded-full bg-background/80 px-2.5 py-1 text-[11px] font-semibold text-foreground backdrop-blur">
              <ZoomIn className="size-3.5" /> {isRTL ? "تكبير" : "Zoom"}
            </span>
          ) : null}

          {product.discount ? (
            <DiscountBadge value={product.discount} className="absolute end-3 top-3" />
          ) : null}
          {!product.is_available ? (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <span className="rounded-full bg-foreground/85 px-4 py-1.5 text-sm font-bold text-background">
                {t("outOfStock")}
              </span>
            </div>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto px-4 pt-4 no-scrollbar">
            {images.map((src, i) => (
              <button
                key={src}
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

        <div className="space-y-4 p-5">
          <div className="space-y-1.5">
            <DialogTitle className="font-heading text-2xl font-extrabold leading-tight">
              {name}
            </DialogTitle>
            {desc ? (
              <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                {desc}
              </DialogDescription>
            ) : (
              <DialogDescription className="sr-only">{name}</DialogDescription>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Price product={product} currency={currency} size="lg" />
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyLink}
                className="gap-1.5 text-muted-foreground"
              >
                <Link2 className="size-4" /> {t("copyLink")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={share}
                className="gap-1.5 text-muted-foreground"
              >
                <Share2 className="size-4" /> {t("share")}
              </Button>
            </div>
          </div>

          {/* Meta chips */}
          <div className="flex flex-wrap gap-2">
            {product.calories ? (
              <Meta icon={Sparkles} label={`${product.calories} ${t("cal")}`} />
            ) : null}
            {product.prep_time ? (
              <Meta icon={Clock} label={`${product.prep_time} ${t("min")}`} />
            ) : null}
            {product.is_spicy ? <Meta icon={Flame} label={t("spicy")} /> : null}
            {product.is_vegetarian ? <Meta icon={Leaf} label={t("vegetarian")} /> : null}
          </div>

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

          {ingredients ? <InfoBlock title={t("ingredients")}>{ingredients}</InfoBlock> : null}

          {allergens ? (
            <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4">
              <h4 className="mb-1.5 flex items-center gap-1.5 font-heading text-sm font-bold text-accent">
                <AlertTriangle className="size-4" /> {t("allergens")}
              </h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{allergens}</p>
            </div>
          ) : null}

          {/* Nutrition */}
          {hasNutrition ? (
            <div className="rounded-2xl bg-muted/60 p-4">
              <h4 className="mb-2.5 font-heading text-sm font-bold">{t("nutrition")}</h4>
              <div className="grid grid-cols-2 gap-3">
                {product.calories ? (
                  <NutriStat label={t("calories")} value={`${product.calories} ${t("cal")}`} />
                ) : null}
                {product.prep_time ? (
                  <NutriStat label={t("prepTime")} value={`${product.prep_time} ${t("min")}`} />
                ) : null}
              </div>
            </div>
          ) : null}

          {notes ? <InfoBlock title={t("notes")}>{notes}</InfoBlock> : null}

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {settings?.whatsapp ? (
              <Button
                asChild
                className="gap-2 rounded-xl bg-success text-success-foreground hover:bg-success/90"
              >
                <a
                  href={`https://wa.me/${settings.whatsapp.replace(/[^0-9]/g, "")}?text=${orderText}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="size-4" /> {t("whatsapp")}
                </a>
              </Button>
            ) : null}
            {settings?.phone ? (
              <Button asChild variant="secondary" className="gap-2 rounded-xl">
                <a href={`tel:${settings.phone}`}>
                  <Phone className="size-4" /> {t("call")}
                </a>
              </Button>
            ) : null}
          </div>

          {/* Related products */}
          {related.length ? (
            <div className="space-y-2.5 border-t border-border pt-4">
              <h4 className="font-heading text-sm font-bold">{t("relatedProducts")}</h4>
              <div className="flex gap-3 overflow-x-auto no-scrollbar">
                {related.map((r) => {
                  const rImg = mediaUrl(orderedImages(r)[0]);
                  return (
                    <button
                      key={r.id}
                      onClick={() => onSelectProduct?.(r)}
                      className="w-28 shrink-0 text-start"
                    >
                      <div className="aspect-square overflow-hidden rounded-xl bg-muted">
                        {rImg ? (
                          <img
                            src={rImg}
                            alt={pick(r, "name")}
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="size-full gradient-primary" />
                        )}
                      </div>
                      <div className="mt-1.5 truncate text-xs font-semibold text-foreground">
                        {pick(r, "name")}
                      </div>
                      <div className="text-xs font-bold text-primary">
                        {r.price} {r.currency}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
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

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-muted/60 p-4">
      <h4 className="mb-1.5 font-heading text-sm font-bold">{title}</h4>
      <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>
    </div>
  );
}

function NutriStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-background/60 p-3 text-center">
      <div className="font-heading text-lg font-black text-primary">{value}</div>
      <div className="text-[11px] font-medium text-muted-foreground">{label}</div>
    </div>
  );
}
