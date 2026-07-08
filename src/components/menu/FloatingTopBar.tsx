import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { RestaurantSettings } from "@/lib/queries";

/**
 * Minimal floating bar that appears once the user scrolls past 80px.
 * Holds a small brand mark plus a 48×48 circular search button.
 * Nothing else stays sticky — the full header, hero and categories
 * scroll away naturally with the page.
 */
export function FloatingTopBar({
  settings,
  onSearch,
}: {
  settings: RestaurantSettings | null;
  onSearch: () => void;
}) {
  const { t, pick } = useI18n();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const name = settings ? pick(settings, "name") : "";
  const logo = mediaUrl(settings?.logo_url);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          initial={{ y: -64, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -64, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="glass fixed inset-x-0 top-0 z-40 border-b border-border/60"
        >
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2">
            <div className="flex min-w-0 items-center gap-2">
              {logo ? (
                <img src={logo} alt={name} className="size-8 shrink-0 rounded-lg object-cover" />
              ) : (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg gradient-primary text-xs font-black text-primary-foreground">
                  {name ? name.charAt(0) : "M"}
                </div>
              )}
              <span className="truncate font-heading text-sm font-extrabold text-foreground">
                {name}
              </span>
            </div>
            <button
              onClick={onSearch}
              aria-label={t("search")}
              className="press flex size-12 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-elevated"
            >
              <Search className="size-5" />
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
