import { motion } from "framer-motion";
import { MapPin, Clock, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { parseWorkingHours, isOpenNow, type RestaurantSettings } from "@/lib/queries";

export function HeroSection({ settings }: { settings: RestaurantSettings | null }) {
  const { t, pick } = useI18n();
  const cover = mediaUrl(settings?.cover_url);
  const name = settings ? pick(settings, "name") : "";
  const desc = settings ? pick(settings, "description") : "";
  const hours = parseWorkingHours(settings);
  const open = isOpenNow(hours);

  return (
    <section className="mx-auto max-w-3xl px-4 pt-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl shadow-elevated"
      >
        <div className="relative aspect-[16/10] w-full sm:aspect-[2/1]">
          {cover ? (
            <img src={cover} alt={name} className="size-full object-cover" />
          ) : (
            <div className="size-full gradient-primary" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-5">
            {settings ? (
              <span
                className={cn(
                  "mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold backdrop-blur",
                  open
                    ? "bg-success/90 text-success-foreground"
                    : "bg-foreground/70 text-background",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    open ? "bg-success-foreground" : "bg-background",
                  )}
                />
                {open ? t("open") : t("closed")}
              </span>
            ) : null}
            <h2 className="font-heading text-3xl font-black leading-tight text-white drop-shadow-sm">
              {name}
            </h2>
            {desc ? (
              <p className="mt-1 line-clamp-2 max-w-md text-sm text-white/85">{desc}</p>
            ) : null}
          </div>
        </div>
      </motion.div>

      {/* Quick actions */}
      <div className="mt-3 grid grid-cols-3 gap-2.5">
        {settings?.google_maps_url ? (
          <QuickAction
            href={settings.google_maps_url}
            icon={MapPin}
            label={t("directions")}
            external
          />
        ) : null}
        {settings?.phone ? (
          <QuickAction href={`tel:${settings.phone}`} icon={Phone} label={t("call")} />
        ) : null}
        {hours.length ? <QuickAction href="#hours" icon={Clock} label={t("workingHours")} /> : null}
      </div>
    </section>
  );
}

function QuickAction({
  href,
  icon: Icon,
  label,
  external,
}: {
  href: string;
  icon: typeof MapPin;
  label: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="press flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card p-3 text-center shadow-soft transition hover:border-primary/40"
    >
      <Icon className="size-5 text-primary" />
      <span className="text-xs font-semibold text-card-foreground">{label}</span>
    </a>
  );
}
