import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Facebook,
  Instagram,
  Youtube,
  Twitter,
  Globe,
  Music2,
  Ghost,
  AtSign,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import {
  parseWorkingHours,
  isOpenNow,
  type RestaurantSettings,
  type SocialLinks,
  type WorkingHour,
} from "@/lib/queries";

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

export function MenuFooter({
  settings,
  social,
}: {
  settings: RestaurantSettings | null;
  social: SocialLinks | null;
}) {
  const { t, pick } = useI18n();
  const hours = parseWorkingHours(settings);
  const logo = mediaUrl(settings?.logo_url);
  const name = settings ? pick(settings, "name") : "";

  const socials: { key: keyof SocialLinks; icon: typeof Facebook }[] = [
    { key: "instagram", icon: Instagram },
    { key: "facebook", icon: Facebook },
    { key: "tiktok", icon: Music2 },
    { key: "snapchat", icon: Ghost },
    { key: "x", icon: Twitter },
    { key: "threads", icon: AtSign },
    { key: "youtube", icon: Youtube },
    { key: "website", icon: Globe },
  ];
  const activeSocials = socials.filter((s) => social && (social[s.key] as string));

  return (
    <footer id="hours" className="mt-10 border-t border-border bg-card">
      <div className="mx-auto max-w-3xl space-y-7 px-4 py-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          {logo ? (
            <img src={logo} alt={name} className="size-12 rounded-2xl object-cover shadow-soft" />
          ) : (
            <div className="flex size-12 items-center justify-center rounded-2xl gradient-primary font-heading text-xl font-black text-primary-foreground">
              {name ? name.charAt(0) : "M"}
            </div>
          )}
          <div>
            <h3 className="font-heading text-lg font-extrabold text-card-foreground">{name}</h3>
            {settings ? (
              <p className="text-xs text-muted-foreground">{pick(settings, "address")}</p>
            ) : null}
          </div>
        </div>

        {/* Working hours (compact) */}
        {hours.length ? <WorkingHoursCard hours={hours} /> : null}

        {/* Contact */}
        <div className="grid gap-2.5">
          {settings?.phone ? (
            <ContactRow icon={Phone} label={settings.phone} href={`tel:${settings.phone}`} />
          ) : null}
          {settings?.email ? (
            <ContactRow icon={Mail} label={settings.email} href={`mailto:${settings.email}`} />
          ) : null}
          {settings?.google_maps_url ? (
            <ContactRow
              icon={MapPin}
              label={t("directions")}
              href={settings.google_maps_url}
              external
            />
          ) : null}
        </div>

        {/* Social */}
        {activeSocials.length ? (
          <div>
            <h4 className="mb-3 font-heading text-sm font-bold">{t("followUs")}</h4>
            <div className="flex flex-wrap gap-2.5">
              {activeSocials.map(({ key, icon: Icon }) => (
                <a
                  key={key}
                  href={social![key] as string}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={key}
                  className="press flex size-11 items-center justify-center rounded-xl border border-border bg-background text-foreground transition hover:border-primary hover:text-primary"
                >
                  <Icon className="size-5" />
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <p className="pt-2 text-center text-[11px] text-muted-foreground">
          © {new Date().getFullYear()} {name} ·{" "}
          <Link to="/auth" className="transition-colors hover:text-primary">
            {t("poweredBy")}
          </Link>
        </p>
      </div>
    </footer>
  );
}

/** Compact working-hours card: status + today's hours + weekly schedule modal. */
function WorkingHoursCard({ hours }: { hours: WorkingHour[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const isOpen = isOpenNow(hours);
  const todayIdx = new Date().getDay();
  const today = hours.find((h) => h.day === todayIdx);

  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                isOpen ? "bg-success" : "bg-muted-foreground",
              )}
            />
            <span
              className={cn(
                "font-heading text-sm font-bold",
                isOpen ? "text-success" : "text-muted-foreground",
              )}
            >
              {isOpen ? t("open") : t("closed")}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {t("today")}:{" "}
            <span className="font-medium text-foreground">
              {today ? (today.closed ? t("closed") : `${today.open} - ${today.close}`) : "—"}
            </span>
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="press inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground transition hover:border-primary/40"
        >
          <Clock className="size-3.5 text-primary" />
          {t("viewWeeklySchedule")}
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="size-4 text-primary" />
              {t("weeklySchedule")}
            </DialogTitle>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            {hours.map((h) => (
              <li
                key={h.day}
                className={cn(
                  "flex items-center justify-between rounded-lg px-2.5 py-2",
                  h.day === todayIdx && "bg-muted",
                )}
              >
                <span className="text-muted-foreground">{t(DAY_KEYS[h.day])}</span>
                <span className="font-medium text-foreground">
                  {h.closed ? t("closed") : `${h.open} - ${h.close}`}
                </span>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  href,
  external,
}: {
  icon: typeof Phone;
  label: string;
  href: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex items-center gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm transition hover:border-primary/40"
    >
      <Icon className="size-4 shrink-0 text-primary" />
      <span dir="ltr" className="truncate text-foreground">
        {label}
      </span>
    </a>
  );
}
