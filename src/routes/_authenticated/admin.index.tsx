import { createFileRoute, Link } from "@tanstack/react-router";
import { UtensilsCrossed, FolderTree, Tag, EyeOff, ExternalLink, Sparkles } from "lucide-react";

import { useCategories, useProducts, useOffers, useSettings } from "@/lib/queries";
import { useAdminT } from "@/lib/admin-i18n";
import { useI18n } from "@/lib/i18n";
import { PageHeader } from "@/components/admin/primitives";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: OverviewPage,
});

function OverviewPage() {
  const t = useAdminT();
  const { pick } = useI18n();
  const settings = useSettings().data;
  const products = useProducts().data ?? [];
  const categories = useCategories().data ?? [];
  const offers = useOffers().data ?? [];

  const hidden = products.filter((p) => p.is_hidden).length;
  const activeOffers = offers.filter((o) => o.is_active).length;

  const stats = [
    {
      label: t("totalProducts"),
      value: products.length,
      icon: UtensilsCrossed,
      to: "/admin/products" as const,
    },
    {
      label: t("totalCategories"),
      value: categories.length,
      icon: FolderTree,
      to: "/admin/categories" as const,
    },
    { label: t("activeOffers"), value: activeOffers, icon: Tag, to: "/admin/offers" as const },
    { label: t("hiddenItems"), value: hidden, icon: EyeOff, to: "/admin/products" as const },
  ];

  return (
    <>
      <PageHeader
        title={settings ? pick(settings, "name") : t("dashboard")}
        action={
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-sm font-bold text-primary-foreground shadow-sm transition-transform hover:scale-[1.02]"
          >
            <ExternalLink className="size-4" /> {t("viewMenu")}
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            to={s.to}
            className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <s.icon className="size-5" />
            </div>
            <div className="font-heading text-3xl font-black text-foreground">{s.value}</div>
            <div className="mt-0.5 text-xs font-medium text-muted-foreground">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-6">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card text-primary shadow-sm">
            <Sparkles className="size-5" />
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground">{t("adminPanel")}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{t("firstAdminNote")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <QuickLink to="/admin/products" label={t("products")} />
              <QuickLink to="/admin/settings" label={t("settings")} />
              <QuickLink to="/admin/appearance" label={t("appearance")} />
              <QuickLink to="/admin/qr" label={t("qrcode")} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function QuickLink({
  to,
  label,
}: {
  to: "/admin/products" | "/admin/settings" | "/admin/appearance" | "/admin/qr";
  label: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-full border border-border bg-card px-3.5 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
    >
      {label}
    </Link>
  );
}
