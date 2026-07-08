import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { useOffers, type Offer } from "@/lib/queries";
import { useCrud } from "@/lib/admin-crud";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { useAdminT } from "@/lib/admin-i18n";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { PageHeader, Field } from "@/components/admin/primitives";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { EmptyRow } from "./admin.categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/admin/offers")({
  component: OffersPage,
});

type Draft = {
  id?: string;
  type: "offer" | "banner" | "announcement";
  title_ar: string;
  title_en: string;
  subtitle_ar: string;
  subtitle_en: string;
  image_url: string;
  link: string;
  is_active: boolean;
  sort_order: number;
};

const emptyDraft = (order: number): Draft => ({
  type: "offer",
  title_ar: "",
  title_en: "",
  subtitle_ar: "",
  subtitle_en: "",
  image_url: "",
  link: "",
  is_active: true,
  sort_order: order,
});

function OffersPage() {
  const t = useAdminT();
  const { pick } = useI18n();
  const offers = useOffers().data ?? [];
  const { save, remove } = useCrud("offers", "offers");
  const confirm = useConfirm();

  const [draft, setDraft] = useState<Draft | null>(null);

  function requestDelete(offer: Offer) {
    void confirm({
      title: t("deleteForeverTitle"),
      description: t("deleteForeverDesc"),
      confirmLabel: t("delete"),
      action: () => remove.mutateAsync(offer.id),
    });
  }

  async function submit() {
    if (!draft) return;
    if (!draft.title_ar && !draft.title_en) {
      toast.error(t("title"));
      return;
    }
    await save.mutateAsync(draft);
    setDraft(null);
  }

  return (
    <>
      <PageHeader
        title={t("offers")}
        action={
          <Button size="sm" onClick={() => setDraft(emptyDraft(offers.length))}>
            <Plus className="size-4" /> {t("addNew")}
          </Button>
        }
      />

      {offers.length === 0 ? (
        <EmptyRow label={t("noItems")} />
      ) : (
        <div className="space-y-2.5">
          {offers.map((o) => (
            <div
              key={o.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm"
            >
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                {o.image_url ? (
                  <img src={mediaUrl(o.image_url)} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-foreground">{pick(o, "title")}</div>
                <div className="truncate text-xs text-muted-foreground">{o.type}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${o.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
              >
                {o.is_active ? t("active") : t("hidden")}
              </span>
              <Button size="icon" variant="ghost" onClick={() => setDraft({ ...o } as Draft)}>
                <Pencil className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => requestDelete(o)}
                aria-label={t("delete")}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? t("edit") : t("addNew")}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <Field label={t("image")}>
                <ImageUploader
                  value={draft.image_url}
                  onChange={(v) => setDraft({ ...draft, image_url: v })}
                  folder="offers"
                  aspect="wide"
                />
              </Field>
              <Field label={t("type")}>
                <Select
                  value={draft.type}
                  onValueChange={(v) => setDraft({ ...draft, type: v as Draft["type"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="banner">Banner</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={`${t("title")} (ع)`}>
                  <Input
                    dir="rtl"
                    value={draft.title_ar}
                    onChange={(e) => setDraft({ ...draft, title_ar: e.target.value })}
                  />
                </Field>
                <Field label={`${t("title")} (EN)`}>
                  <Input
                    dir="ltr"
                    value={draft.title_en}
                    onChange={(e) => setDraft({ ...draft, title_en: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={`${t("subtitle")} (ع)`}>
                  <Input
                    dir="rtl"
                    value={draft.subtitle_ar}
                    onChange={(e) => setDraft({ ...draft, subtitle_ar: e.target.value })}
                  />
                </Field>
                <Field label={`${t("subtitle")} (EN)`}>
                  <Input
                    dir="ltr"
                    value={draft.subtitle_en}
                    onChange={(e) => setDraft({ ...draft, subtitle_en: e.target.value })}
                  />
                </Field>
              </div>
              <Field label="Link">
                <Input
                  dir="ltr"
                  value={draft.link}
                  onChange={(e) => setDraft({ ...draft, link: e.target.value })}
                  placeholder="https://"
                />
              </Field>
              <label className="flex items-center justify-between rounded-xl border border-border p-3">
                <span className="text-sm font-semibold">{t("active")}</span>
                <Switch
                  checked={draft.is_active}
                  onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
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
