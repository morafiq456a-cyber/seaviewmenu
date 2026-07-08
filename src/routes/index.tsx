import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UtensilsCrossed, SearchX } from "lucide-react";

import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-provider";
import {
  useSettings,
  useSocial,
  useCategories,
  useProducts,
  useOffers,
  settingsQuery,
  type Product,
  type Category,
  type RestaurantSettings,
} from "@/lib/queries";
import { mediaUrl } from "@/lib/media";

import { MenuHeader } from "@/components/menu/MenuHeader";
import { HeroSection } from "@/components/menu/HeroSection";
import { AnnouncementBar } from "@/components/menu/AnnouncementBar";
import { OffersCarousel } from "@/components/menu/OffersCarousel";
import { CategoryNav } from "@/components/menu/CategoryNav";
import { ProductCard } from "@/components/menu/ProductCard";
import { ProductModal } from "@/components/menu/ProductModal";
import { FloatingActions } from "@/components/menu/FloatingActions";
import { FloatingTopBar } from "@/components/menu/FloatingTopBar";
import { SearchDialog } from "@/components/menu/SearchDialog";
import { MenuFooter } from "@/components/menu/MenuFooter";
import { MenuSkeleton } from "@/components/menu/skeletons";
import { MenuFloatingControls, MenuLoadingScreen } from "@/components/menu/MenuOverlays";

const SITE_URL = "https://test-qrmenu.lovable.app";

/** Build an absolute URL for a stored media reference (needed for OG/Twitter). */
function absoluteMedia(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  const url = mediaUrl(path);
  if (!url) return undefined;
  return url.startsWith("http") ? url : `${SITE_URL}${url}`;
}

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    let s = await context.queryClient.ensureQueryData(settingsQuery);
    // Fresh remix: schema present but tables empty. Seed the full demo once,
    // then re-read so the first visit already shows a complete editable menu.
    if (!s) {
      try {
        const { ensureDemoSeed } = await import("@/lib/seed.functions");
        const res = await ensureDemoSeed();
        if (res.seeded) {
          context.queryClient.removeQueries();
          s = await context.queryClient.ensureQueryData(settingsQuery);
        }
      } catch {
        // Seeding is best-effort; never block the menu from rendering.
      }
    }
    return s;
  },
  head: ({ loaderData }) => {
    const s = loaderData as RestaurantSettings | null;
    const preferEn = s?.default_language === "en";
    const name = s
      ? (preferEn ? s.name_en || s.name_ar : s.name_ar || s.name_en) || "Digital Menu"
      : "Digital Menu";
    const desc = s
      ? (preferEn ? s.description_en || s.description_ar : s.description_ar || s.description_en) || ""
      : "";

    const favicon = s?.favicon_url ? mediaUrl(s.favicon_url) : undefined;
    const appleIcon = s?.logo_url ? mediaUrl(s.logo_url) : undefined;
    const ogImage =
      absoluteMedia(s?.og_image_url) || absoluteMedia(s?.cover_url) || absoluteMedia(s?.logo_url);

    const meta: Record<string, string>[] = [
      { title: name },
      { name: "description", content: desc },
      { property: "og:title", content: name },
      { property: "og:description", content: desc },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: name },
      { name: "twitter:description", content: desc },
    ];
    if (ogImage) {
      meta.push({ property: "og:image", content: ogImage });
      meta.push({ name: "twitter:image", content: ogImage });
    }

    const links: Record<string, string>[] = [{ rel: "canonical", href: SITE_URL }];
    if (favicon) links.push({ rel: "icon", href: favicon });
    if (appleIcon) links.push({ rel: "apple-touch-icon", href: appleIcon });

    return { meta, links };
  },
  component: MenuPage,
});

function MenuPage() {
  const { t, pick, isRTL } = useI18n();
  const { config } = useTheme();

  const settingsQ = useSettings();
  const socialQ = useSocial();
  const categoriesQ = useCategories();
  const productsQ = useProducts();
  const offersQ = useOffers();

  const settings = settingsQ.data ?? null;
  const currency = settings?.currency || "SAR";

  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());
  const clickScrolling = useRef(false);

  const categories = useMemo(
    () => (categoriesQ.data ?? []).filter((c) => !c.is_hidden),
    [categoriesQ.data],
  );

  const products = useMemo(
    () => (productsQ.data ?? []).filter((p) => !p.is_hidden),
    [productsQ.data],
  );

  const query = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return products;
    return products.filter((p) =>
      [p.name_ar, p.name_en, p.description_ar, p.description_en, p.ingredients_ar, p.ingredients_en]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [products, query]);

  // Group filtered products by category, preserving category order.
  const grouped = useMemo(() => {
    const map = new Map<string, { category: Category; items: Product[] }>();
    for (const cat of categories) map.set(cat.id, { category: cat, items: [] });
    const uncategorized: Product[] = [];
    for (const p of filtered) {
      if (p.category_id && map.has(p.category_id)) map.get(p.category_id)!.items.push(p);
      else uncategorized.push(p);
    }
    const result = [...map.values()].filter((g) => g.items.length > 0);
    return { result, uncategorized };
  }, [categories, filtered]);

  const visibleCatIds = useMemo(() => grouped.result.map((g) => g.category.id), [grouped]);

  useEffect(() => {
    if (!activeCat && visibleCatIds.length) setActiveCat(visibleCatIds[0]);
  }, [visibleCatIds, activeCat]);

  // Deep-link: open a shared product via ?item=<id>.
  useEffect(() => {
    if (typeof window === "undefined" || !products.length) return;
    const id = new URLSearchParams(window.location.search).get("item");
    if (!id) return;
    const found = products.find((p) => p.id === id);
    if (found) setSelected(found);
  }, [products]);

  // Scrollspy.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickScrolling.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveCat(visible[0].target.id.replace("cat-", ""));
      },
      { rootMargin: "-180px 0px -60% 0px", threshold: 0 },
    );
    sectionRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [grouped]);

  const scrollToCategory = (id: string) => {
    setActiveCat(id);
    const el = sectionRefs.current.get(id);
    if (el) {
      clickScrolling.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      window.setTimeout(() => (clickScrolling.current = false), 700);
    }
  };

  const loading = settingsQ.isLoading || categoriesQ.isLoading || productsQ.isLoading;

  // Maintenance mode
  if (settings?.maintenance_mode) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        <div className="max-w-sm space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl gradient-primary text-primary-foreground">
            <UtensilsCrossed className="size-8" />
          </div>
          <h1 className="font-heading text-2xl font-black text-foreground">
            {pick(settings, "name")}
          </h1>
          <p className="text-muted-foreground">
            {pick(settings, "maintenance_message") ||
              (isRTL ? "سنعود قريباً" : "We'll be back soon")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6">
      <AnnouncementBar offers={offersQ.data ?? []} />
      <MenuHeader settings={settings} search={search} onSearch={setSearch} />

      {loading ? (
        <MenuSkeleton />
      ) : (
        <>
          {!query ? (
            <>
              <HeroSection settings={settings} />
              <OffersCarousel offers={offersQ.data ?? []} />
            </>
          ) : null}

          {!query ? (
            <CategoryNav
              categories={grouped.result.map((g) => g.category)}
              activeId={activeCat}
              onSelect={scrollToCategory}
            />
          ) : null}

          <main className="mx-auto max-w-3xl px-4 pt-6">
            {grouped.result.length === 0 && grouped.uncategorized.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <div className="flex flex-col" style={{ gap: "var(--menu-gap)" }}>
                {grouped.result.map((group) => (
                  <section
                    key={group.category.id}
                    id={`cat-${group.category.id}`}
                    ref={(el) => {
                      if (el) sectionRefs.current.set(group.category.id, el);
                      else sectionRefs.current.delete(group.category.id);
                    }}
                    className="scroll-mt-44"
                  >
                    <SectionHeading category={group.category} count={group.items.length} />
                    <ProductList
                      items={group.items}
                      currency={currency}
                      layout={config.layout}
                      onSelect={setSelected}
                    />
                  </section>
                ))}

                {grouped.uncategorized.length ? (
                  <section>
                    <h2 className="mb-4 font-heading text-xl font-black text-foreground">
                      {t("menu")}
                    </h2>
                    <ProductList
                      items={grouped.uncategorized}
                      currency={currency}
                      layout={config.layout}
                      onSelect={setSelected}
                    />
                  </section>
                ) : null}
              </div>
            )}
          </main>
        </>
      )}

      <MenuFooter settings={settings} social={socialQ.data ?? null} />
      <FloatingActions settings={settings} config={config} />
      <FloatingTopBar settings={settings} onSearch={() => setSearchOpen(true)} />
      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        products={products}
        currency={currency}
        onSelectProduct={(p) => {
          setSelected(p);
          setSearchOpen(false);
        }}
      />
      <MenuFloatingControls />
      <AnimatePresence>
        {settingsQ.isLoading ? <MenuLoadingScreen settings={settings} /> : null}
      </AnimatePresence>
      <ProductModal
        product={selected}
        currency={currency}
        settings={settings}
        related={
          selected
            ? products
                .filter((p) => p.id !== selected.id && p.category_id === selected.category_id)
                .slice(0, 6)
            : []
        }
        onSelectProduct={(p) => setSelected(p)}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </div>
  );
}

function SectionHeading({ category, count }: { category: Category; count: number }) {
  const { pick } = useI18n();
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2 className="font-heading text-xl font-black text-foreground">{pick(category, "name")}</h2>
      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-secondary-foreground">
        {count}
      </span>
    </div>
  );
}

function ProductList({
  items,
  currency,
  layout,
  onSelect,
}: {
  items: Product[];
  currency: string;
  layout: "grid" | "list";
  onSelect: (p: Product) => void;
}) {
  return (
    <div className={layout === "grid" ? "grid grid-cols-2 gap-3.5" : "grid grid-cols-1 gap-3"}>
      {items.map((p, i) => (
        <ProductCard
          key={p.id}
          product={p}
          currency={currency}
          layout={layout}
          index={i}
          onClick={() => onSelect(p)}
        />
      ))}
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  const { t } = useI18n();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-20 text-center"
    >
      <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        {query ? <SearchX className="size-8" /> : <UtensilsCrossed className="size-8" />}
      </div>
      <h3 className="font-heading text-lg font-bold text-foreground">{t("noResults")}</h3>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">{t("noResultsDesc")}</p>
    </motion.div>
  );
}
