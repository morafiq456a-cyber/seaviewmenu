import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Store,
  FolderTree,
  UtensilsCrossed,
  Tag,
  Palette,
  QrCode,
  ArrowLeftRight,
  Trash2,
  LogOut,
  Loader2,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";

import { ConfirmProvider } from "@/components/admin/ConfirmDialog";

import { useSession, useIsAdmin, useSignOut } from "@/hooks/use-auth";
import { useAdminT } from "@/lib/admin-i18n";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-provider";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

import type { AdminTKey } from "@/lib/admin-i18n";
import type { LucideIcon } from "lucide-react";

type AdminPath =
  | "/admin"
  | "/admin/settings"
  | "/admin/categories"
  | "/admin/products"
  | "/admin/offers"
  | "/admin/appearance"
  | "/admin/qr"
  | "/admin/import-export"
  | "/admin/trash";

type NavItem = { to: AdminPath; key: AdminTKey; icon: LucideIcon; exact?: boolean };

const navItems: NavItem[] = [
  { to: "/admin", key: "overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/settings", key: "settings", icon: Store },
  { to: "/admin/categories", key: "categories", icon: FolderTree },
  { to: "/admin/products", key: "products", icon: UtensilsCrossed },
  { to: "/admin/offers", key: "offers", icon: Tag },
  { to: "/admin/appearance", key: "appearance", icon: Palette },
  { to: "/admin/qr", key: "qrcode", icon: QrCode },
  { to: "/admin/import-export", key: "importExport", icon: ArrowLeftRight },
  { to: "/admin/trash", key: "trash", icon: Trash2 },
];

function AdminLayout() {
  const t = useAdminT();
  const { isRTL, lang, toggleLang } = useI18n();
  const { mode, toggleMode } = useTheme();
  const navigate = useNavigate();
  const signOut = useSignOut();

  const { session, loading } = useSession();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin(!!session);

  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || adminLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session && isAdmin === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="size-8" />
        </div>
        <p className="max-w-xs text-muted-foreground">{t("notAdmin")}</p>
        <Button variant="outline" onClick={() => signOut().then(() => navigate({ to: "/auth" }))}>
          <LogOut className="size-4" /> {t("signOut")}
        </Button>
      </div>
    );
  }

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <ConfirmProvider>
      <div className="min-h-screen bg-muted/30 md:flex">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-e border-border bg-card md:flex">
          <div className="flex items-center gap-2.5 px-5 py-5">
            <div className="flex size-9 items-center justify-center rounded-xl gradient-primary text-primary-foreground">
              <UtensilsCrossed className="size-5" />
            </div>
            <span className="font-heading text-base font-black text-foreground">
              {t("adminPanel")}
            </span>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-2">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive(item.to, item.exact)
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <item.icon className="size-4.5 shrink-0" />
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div className="space-y-1 border-t border-border p-3">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <ExternalLink className="size-4.5 shrink-0" /> {t("viewMenu")}
            </a>
            <button
              onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="size-4.5 shrink-0" /> {t("signOut")}
            </button>
          </div>
        </aside>

        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/90 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg gradient-primary text-primary-foreground">
              <UtensilsCrossed className="size-4" />
            </div>
            <span className="font-heading text-sm font-black text-foreground">
              {t("adminPanel")}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={toggleLang} className="text-xs font-bold">
              {lang === "ar" ? "EN" : "ع"}
            </Button>
            <button
              onClick={() => signOut().then(() => navigate({ to: "/auth" }))}
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="hidden items-center justify-end gap-2 border-b border-border bg-card/60 px-6 py-2.5 md:flex">
            <Button size="sm" variant="ghost" onClick={toggleLang} className="font-bold">
              {lang === "ar" ? "English" : "العربية"}
            </Button>
            <Button size="sm" variant="ghost" onClick={toggleMode}>
              {mode === "dark" ? "☀︎" : "☾"}
            </Button>
          </div>
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="mx-auto w-full max-w-4xl flex-1 space-y-5 px-4 py-5 pb-28 sm:px-6 md:pb-8"
          >
            <Outlet />
          </motion.main>
        </div>

        {/* Mobile bottom nav */}
        <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border bg-card/95 px-1 py-1.5 backdrop-blur md:hidden">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-lg py-1.5 text-[10px] font-bold transition-colors ${
                isActive(item.to, item.exact) ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <item.icon className="size-5" />
              <span className="max-w-full truncate">{t(item.key)}</span>
            </Link>
          ))}
        </nav>

        <div className="sr-only" aria-hidden>
          {isRTL ? "" : ""}
        </div>
      </div>
    </ConfirmProvider>
  );
}
