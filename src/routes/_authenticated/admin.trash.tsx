import { createFileRoute } from "@tanstack/react-router";
import { Trash2, RotateCcw, Loader2, FolderTree, UtensilsCrossed } from "lucide-react";

import {
  useTrashedProducts,
  useTrashedCategories,
  coverImage,
  type Product,
  type Category,
} from "@/lib/queries";
import { useTrashActions } from "@/lib/soft-delete";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { useAdminT } from "@/lib/admin-i18n";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { PageHeader, Section } from "@/components/admin/primitives";
import { EmptyRow } from "./admin.categories";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin/trash")({
  component: TrashPage,
});

function TrashPage() {
  const t = useAdminT();
  const { pick, lang } = useI18n();
  const confirm = useConfirm();

  const productsQ = useTrashedProducts();
  const categoriesQ = useTrashedCategories();
  const products = productsQ.data ?? [];
  const categories = categoriesQ.data ?? [];

  const productTrash = useTrashActions("products");
  const categoryTrash = useTrashActions("categories");

  const loading = productsQ.isLoading || categoriesQ.isLoading;
  const total = products.length + categories.length;

  function formatDate(iso: string | null): string {
    if (!iso) return "";
    return new Date(iso).toLocaleDateString(lang === "ar" ? "ar" : "en", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function purgeOne(kind: "products" | "categories", id: string) {
    const actions = kind === "products" ? productTrash : categoryTrash;
    void confirm({
      title: t("deleteForeverTitle"),
      description: t("deleteForeverDesc"),
      confirmLabel: t("deleteForever"),
      action: () => actions.purge([id]),
    });
  }

  function emptyTrash() {
    void confirm({
      title: t("emptyTrashTitle"),
      description: t("emptyTrashDesc"),
      confirmLabel: t("deleteForever"),
      action: async () => {
        if (products.length) await productTrash.purge(products.map((p) => p.id));
        if (categories.length) await categoryTrash.purge(categories.map((c) => c.id));
      },
    });
  }

  return (
    <>
      <PageHeader
        title={t("trash")}
        action={
          total > 0 ? (
            <Button size="sm" variant="destructive" onClick={emptyTrash}>
              <Trash2 className="size-4" /> {t("emptyTrash")}
            </Button>
          ) : undefined
        }
      />

      <p className="text-sm text-muted-foreground">{t("trashDesc")}</p>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-8 animate-spin text-primary" />
        </div>
      ) : total === 0 ? (
        <EmptyRow label={t("trashEmpty")} />
      ) : (
        <div className="space-y-5">
          {products.length > 0 ? (
            <Section title={`${t("deletedProducts")} (${products.length})`}>
              <div className="space-y-2.5">
                {products.map((p) => (
                  <TrashRow
                    key={p.id}
                    icon={<UtensilsCrossed className="size-5 text-muted-foreground" />}
                    image={coverImage(p)}
                    title={pick(p, "name")}
                    subtitle={`${t("deletedOn")} ${formatDate((p as Product).deleted_at)}`}
                    onRestore={() => void productTrash.restore([p.id])}
                    onPurge={() => purgeOne("products", p.id)}
                    restoreLabel={t("restore")}
                    purgeLabel={t("deleteForever")}
                  />
                ))}
              </div>
            </Section>
          ) : null}

          {categories.length > 0 ? (
            <Section title={`${t("deletedCategories")} (${categories.length})`}>
              <div className="space-y-2.5">
                {categories.map((c) => (
                  <TrashRow
                    key={c.id}
                    icon={<FolderTree className="size-5 text-muted-foreground" />}
                    image={c.image_url ?? ""}
                    title={pick(c, "name")}
                    subtitle={`${t("deletedOn")} ${formatDate((c as Category).deleted_at)}`}
                    onRestore={() => void categoryTrash.restore([c.id])}
                    onPurge={() => purgeOne("categories", c.id)}
                    restoreLabel={t("restore")}
                    purgeLabel={t("deleteForever")}
                  />
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      )}
    </>
  );
}

function TrashRow({
  icon,
  image,
  title,
  subtitle,
  onRestore,
  onPurge,
  restoreLabel,
  purgeLabel,
}: {
  icon: React.ReactNode;
  image: string;
  title: string;
  subtitle: string;
  onRestore: () => void;
  onPurge: () => void;
  restoreLabel: string;
  purgeLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted">
        {image ? <img src={mediaUrl(image)} alt="" className="size-full object-cover" /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-bold text-foreground">{title || "—"}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <Button size="sm" variant="outline" onClick={onRestore}>
        <RotateCcw className="size-4" /> {restoreLabel}
      </Button>
      <Button size="icon" variant="ghost" onClick={onPurge} aria-label={purgeLabel}>
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}
