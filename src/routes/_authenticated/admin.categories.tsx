import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useCategories, type Category } from "@/lib/queries";
import { useCrud, useReorder } from "@/lib/admin-crud";
import { useTrashActions } from "@/lib/soft-delete";
import { useAdminT } from "@/lib/admin-i18n";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { PageHeader } from "@/components/admin/primitives";
import { Field } from "@/components/admin/primitives";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { SortableList, SortableItem } from "@/components/admin/Sortable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: CategoriesPage,
});

type Draft = {
  id?: string;
  name_ar: string;
  name_en: string;
  icon: string;
  color: string;
  image_url: string;
  is_hidden: boolean;
  sort_order: number;
};

const emptyDraft = (order: number): Draft => ({
  name_ar: "",
  name_en: "",
  icon: "",
  color: "",
  image_url: "",
  is_hidden: false,
  sort_order: order,
});

function CategoriesPage() {
  const t = useAdminT();
  const { pick } = useI18n();
  const categories = useCategories().data ?? [];
  const { save } = useCrud("categories", "categories");
  const trash = useTrashActions("categories");
  const reorder = useReorder("categories", "categories");

  const [draft, setDraft] = useState<Draft | null>(null);
  const [order, setOrder] = useState<Category[]>(categories);

  // Keep local order in sync with the server list unless mid-reorder.
  useEffect(() => {
    if (!reorder.isPending) setOrder(categories);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  async function submit() {
    if (!draft) return;
    if (!draft.name_ar && !draft.name_en) {
      toast.error(t("nameEn"));
      return;
    }
    await save.mutateAsync(draft);
    setDraft(null);
  }

  function handleReorder(ids: string[]) {
    const next = ids
      .map((id) => order.find((c) => c.id === id))
      .filter((c): c is Category => Boolean(c));
    setOrder(next);
    reorder.mutate(next.map((c, i) => ({ id: c.id, sort_order: i })));
    toast.success(t("reorderSaved"));
  }

  return (
    <>
      <PageHeader
        title={t("categories")}
        action={
          <Button size="sm" onClick={() => setDraft(emptyDraft(order.length))}>
            <Plus className="size-4" /> {t("addNew")}
          </Button>
        }
      />

      {order.length === 0 ? (
        <EmptyRow label={t("noItems")} />
      ) : (
        <>
          <p className="text-xs text-muted-foreground">{t("dragToReorder")}</p>
          <SortableList
            ids={order.map((c) => c.id)}
            onReorder={handleReorder}
            className="space-y-2.5"
          >
            {order.map((c) => (
              <SortableItem key={c.id} id={c.id}>
                <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 ps-9 shadow-sm">
                  <div className="size-11 shrink-0 overflow-hidden rounded-xl bg-muted">
                    {c.image_url ? (
                      <img src={mediaUrl(c.image_url)} alt="" className="size-full object-cover" />
                    ) : (
                      <div className="flex size-full items-center justify-center text-lg">
                        {c.icon || "🍽️"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold text-foreground">{pick(c, "name")}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.name_en}</div>
                  </div>
                  {c.is_hidden ? (
                    <EyeOff className="size-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <Eye className="size-4 shrink-0 text-primary" />
                  )}
                  <Button size="icon" variant="ghost" onClick={() => setDraft({ ...c })}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => void trash.softDelete([c.id])}
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </SortableItem>
            ))}
          </SortableList>
        </>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? t("edit") : t("addNew")}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("nameAr")}>
                  <Input
                    dir="rtl"
                    value={draft.name_ar}
                    onChange={(e) => setDraft({ ...draft, name_ar: e.target.value })}
                  />
                </Field>
                <Field label={t("nameEn")}>
                  <Input
                    dir="ltr"
                    value={draft.name_en}
                    onChange={(e) => setDraft({ ...draft, name_en: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("icon")}>
                  <Input
                    value={draft.icon}
                    onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                    placeholder="🥙"
                  />
                </Field>
                <Field label={t("color")}>
                  <Input
                    value={draft.color}
                    onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                    placeholder="#b8863b"
                  />
                </Field>
              </div>
              <Field label={t("image")}>
                <ImageUploader
                  value={draft.image_url}
                  onChange={(v) => setDraft({ ...draft, image_url: v })}
                  folder="categories"
                  aspect="wide"
                />
              </Field>
              <label className="flex items-center justify-between rounded-xl border border-border p-3">
                <span className="text-sm font-semibold">{t("visible")}</span>
                <Switch
                  checked={!draft.is_hidden}
                  onCheckedChange={(v) => setDraft({ ...draft, is_hidden: !v })}
                />
              </label>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)}>
              {t("cancel")}
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? <Loader2 className="size-4 animate-spin" /> : t("save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}
