import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { Offer } from "@/lib/queries";

function activeOffers(offers: Offer[]): Offer[] {
  const now = Date.now();
  return offers.filter((o) => {
    if (!o.is_active) return false;
    if (o.start_date && new Date(o.start_date).getTime() > now) return false;
    if (o.end_date && new Date(o.end_date).getTime() < now) return false;
    return true;
  });
}

export function OffersCarousel({ offers }: { offers: Offer[] }) {
  const { pick } = useI18n();
  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start", direction: undefined });

  const list = activeOffers(offers).filter((o) => o.type === "hero" || o.type === "offer");
  if (!list.length) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 pt-4">
      <div ref={emblaRef} className="overflow-hidden">
        <div className="flex gap-3">
          {list.map((offer, i) => {
            const img = mediaUrl(offer.image_url);
            const title = pick(offer, "title");
            const subtitle = pick(offer, "subtitle");
            const inner = (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="relative aspect-[2.6/1] w-full overflow-hidden rounded-3xl shadow-soft"
              >
                {img ? (
                  <img src={img} alt={title} className="size-full object-cover" />
                ) : (
                  <div className="size-full gradient-primary" />
                )}
                {(title || subtitle) && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <h3 className="font-heading text-lg font-black text-white">{title}</h3>
                      {subtitle ? <p className="text-xs text-white/85">{subtitle}</p> : null}
                    </div>
                  </>
                )}
              </motion.div>
            );
            return (
              <div key={offer.id} className="min-w-0 shrink-0 basis-[88%]">
                {offer.link ? (
                  <a href={offer.link} target="_blank" rel="noreferrer">
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
