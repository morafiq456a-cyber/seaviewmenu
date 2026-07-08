import { motion } from "framer-motion";
import { Megaphone } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { Offer } from "@/lib/queries";

export function AnnouncementBar({ offers }: { offers: Offer[] }) {
  const { pick } = useI18n();
  const now = Date.now();
  const announcement = offers.find((o) => {
    if (o.type !== "announcement" || !o.is_active) return false;
    if (o.start_date && new Date(o.start_date).getTime() > now) return false;
    if (o.end_date && new Date(o.end_date).getTime() < now) return false;
    return true;
  });

  if (!announcement) return null;
  const text = pick(announcement, "title");
  if (!text) return null;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      className="gradient-primary text-primary-foreground"
    >
      <div className="mx-auto flex max-w-3xl items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold sm:text-sm">
        <Megaphone className="size-4 shrink-0" />
        <span>{text}</span>
      </div>
    </motion.div>
  );
}
