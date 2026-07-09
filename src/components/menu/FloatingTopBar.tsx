import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Languages, Moon, Search, Sun, X } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-provider";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import type { RestaurantSettings } from "@/lib/queries";

/**
 * Single compact floating header shown once the user scrolls past 80px.
 * Contains ONLY: search (expands inline), language switch, theme switch.
 * The full header, hero and categories scroll away naturally with the page.
 */
export function FloatingTopBar({
  settings,
  search,
  onSearch,
}: {
  settings: RestaurantSettings | null;
  search: string;
  onSearch: (v: string) => void;
}) {
  const { t, pick, lang, toggleLang } = useI18n();
  const { mode, toggleMode } = useTheme();
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (expanded) {
      const id = window.setTimeout(() => inputRef.current?.focus(), 180);
      return () => window.clearTimeout(id);
    }
  }, [expanded]);

  const name = settings ? pick(settings, "name") : "";
  const logo = mediaUrl(settings?.logo_url);

  const closeSearch = () => {
    onSearch("");
    setExpanded(false);
  };

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
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-3 py-2">
            {/* Brand (hidden while search expanded) */}
            <AnimatePresence initial={false}>
              {!expanded ? (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex min-w-0 items-center gap-2 overflow-hidden"
                >
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
                </motion.div>
              ) : null}
            </AnimatePresence>

            {/* Search — icon collapses into an input */}
            <motion.div
              layout
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                "flex items-center",
                expanded ? "flex-1" : "ms-auto",
              )}
            >
              {!expanded ? (
                <button
                  onClick={() => setExpanded(true)}
                  aria-label={t("search")}
                  className="press flex size-10 shrink-0 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-soft"
                >
                  <Search className="size-5" />
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className="relative flex-1"
                >
                  <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    ref={inputRef}
                    value={search}
                    onChange={(e) => onSearch(e.target.value)}
                    placeholder={t("search")}
                    className="h-10 w-full rounded-full border border-border bg-card ps-9 pe-9 text-sm text-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
                  />
                  <button
                    onClick={closeSearch}
                    aria-label="close"
                    className="absolute end-1.5 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
                  >
                    <X className="size-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>

            {/* Language + Theme (hidden while search expanded to save room) */}
            {!expanded ? (
              <>
                <button
                  onClick={toggleLang}
                  aria-label="Language"
                  className="press flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-soft backdrop-blur"
                >
                  <Languages className="size-[16px]" />
                  <span className="ms-0.5 text-[10px] font-black">
                    {lang === "ar" ? "EN" : "ع"}
                  </span>
                </button>
                <button
                  onClick={toggleMode}
                  aria-label="Theme"
                  className="press flex size-10 shrink-0 items-center justify-center rounded-full border border-border bg-card/80 text-foreground shadow-soft backdrop-blur"
                >
                  {mode === "dark" ? <Sun className="size-[16px]" /> : <Moon className="size-[16px]" />}
                </button>
              </>
            ) : null}
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
