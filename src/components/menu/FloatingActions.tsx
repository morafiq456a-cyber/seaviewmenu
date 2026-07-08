import { Phone, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { RestaurantSettings } from "@/lib/queries";
import type { ThemeConfig } from "@/lib/theme-config";

export function FloatingActions({
  settings,
  config,
}: {
  settings: RestaurantSettings | null;
  config: ThemeConfig;
}) {
  const wa = settings?.whatsapp?.replace(/[^0-9]/g, "");
  const showWa = config.showFloatingWhatsapp && wa;
  const showCall = config.showFloatingCall && settings?.phone;

  if (!showWa && !showCall) return null;

  return (
    <div className="fixed bottom-5 end-4 z-40 flex flex-col gap-3">
      {showWa ? (
        <motion.a
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.3 }}
          whileTap={{ scale: 0.9 }}
          href={`https://wa.me/${wa}`}
          target="_blank"
          rel="noreferrer"
          aria-label="WhatsApp"
          className="flex size-14 items-center justify-center rounded-full bg-success text-success-foreground shadow-elevated"
        >
          <MessageCircle className="size-6" />
        </motion.a>
      ) : null}
      {showCall ? (
        <motion.a
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.4 }}
          whileTap={{ scale: 0.9 }}
          href={`tel:${settings?.phone}`}
          aria-label="Call"
          className="flex size-14 items-center justify-center rounded-full gradient-primary text-primary-foreground shadow-elevated"
        >
          <Phone className="size-6" />
        </motion.a>
      ) : null}
    </div>
  );
}
