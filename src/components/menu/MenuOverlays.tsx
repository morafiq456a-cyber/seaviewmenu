import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Languages, Moon, Sun, UtensilsCrossed } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-provider";
import { mediaUrl } from "@/lib/media";
import type { RestaurantSettings } from "@/lib/queries";

/** Floating back-to-top + quick language / theme controls (bottom-start). */
export function MenuFloatingControls() {
  const { lang, toggleLang } = useI18n();
  const { mode, toggleMode } = useTheme();
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="fixed bottom-5 start-4 z-40 flex flex-col items-center gap-2.5">
      <button
        onClick={toggleLang}
        aria-label="Language"
        className="press flex size-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-soft backdrop-blur"
      >
        <span className="text-xs font-black">{lang === "ar" ? "EN" : "ع"}</span>
      </button>
      <button
        onClick={toggleMode}
        aria-label="Theme"
        className="press flex size-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-soft backdrop-blur"
      >
        {mode === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
      </button>
      <AnimatePresence>
        {show ? (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Back to top"
            className="flex size-12 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-elevated"
          >
            <ArrowUp className="size-5" />
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

/** Premium branded splash shown on first load. */
export function MenuLoadingScreen({ settings }: { settings: RestaurantSettings | null }) {
  const logo = mediaUrl(settings?.logo_url);
  const name = settings?.name_en || settings?.name_ar || "";
  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-background"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="absolute inset-0 animate-ping rounded-2xl bg-primary/20" />
        {logo ? (
          <img
            src={logo}
            alt={name}
            className="relative size-20 rounded-2xl object-cover shadow-elevated"
          />
        ) : (
          <div className="relative flex size-20 items-center justify-center rounded-2xl gradient-primary text-primary-foreground shadow-elevated">
            <UtensilsCrossed className="size-9" />
          </div>
        )}
      </motion.div>
      {name ? (
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="font-heading text-xl font-black text-foreground"
        >
          {name}
        </motion.h1>
      ) : null}
      <div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
        <motion.div
          className="h-full w-1/2 rounded-full bg-primary"
          animate={{ x: ["-100%", "220%"] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut" }}
        />
      </div>
    </motion.div>
  );
}
