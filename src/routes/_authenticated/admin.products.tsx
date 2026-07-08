import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  Star,
  Loader2,
  Search,
  GripVertical,
  Copy,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  useProducts,
  useCategories,
  productImages,
  orderedImages,
  productTags,
  type Product,
} from "@/lib/queries";
import { useCrud, useReorder } from "@/lib/admin-crud";
import { useTrashActions } from "@/lib/soft-delete";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { useAdminT } from "@/lib/admin-i18n";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";
import { PageHeader, Field } from "@/components/admin/primitives";
import { GalleryEditor } from "@/components/admin/GalleryEditor";
import { TagInput } from "@/components/admin/TagInput";
import { EmptyRow } from "./admin.categories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: ProductsPage,
});

const UNCAT = "__uncat__";

type Draft = {
  id?: string;
  category_id: string | null;
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  ingredients_ar: string;
  ingredients_en: string;
  allergens_ar: string;
  allergens_en: string;
  notes_ar: string;
  notes_en: string;
  tags: string[];
  price: number;
  old_price: number | null;
  discount: number;
  currency: string;
  calories: number | null;
  prep_time: number | null;
  images: string[];
  cover_index: number;
  is_featured: boolean;
  is_best_seller: boolean;
  is_new: boolean;
  is_spicy: boolean;
  is_vegetarian: boolean;
  is_available: boolean;
  is_hidden: boolean;
  sort_order: number;
};

const emptyDraft = (order: number, currency: string): Draft => ({
  category_id: null,
  name_ar: "",
  name_en: "",
  description_ar: "",
  description_en: "",
  ingredients_ar: "",
  ingredients_en: "",
  allergens_ar: "",
  allergens_en: "",
  notes_ar: "",
  notes_en: "",
  tags: [],
  price: 0,
  old_price: null,
  discount: 0,
  currency,
  calories: null,
  prep_time: null,
  images: [],
  cover_index: 0,
  is_featured: false,
  is_best_seller: false,
  is_new: false,
  is_vegetarian: false,
  is_spicy: false,
  is_available: true,
  is_hidden: false,
  sort_order: order,
});

const NONE = "__none__";

type Groups = Record<string, Product[]>;

function buildGroups(products: Product[], categoryIds: string[]): Groups {
  const groups: Groups = {};
  for (const id of [...categoryIds, UNCAT]) groups[id] = [];
  for (const p of products) {
    const key = p.category_id && groups[p.category_id] ? p.category_id : UNCAT;
    groups[key].push(p);
  }
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.sort_order - b.sort_order);
  }
  return groups;
}

function ProductsPage() {
  const t = useAdminT();
  const { pick } = useI18n();
  const qc = useQueryClient();
  const productsData = useProducts().data;
  const categoriesData = useCategories().data;
  const products = useMemo(() => productsData ?? [], [productsData]);
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);
  const { save } = useCrud("products", "products");
  const trash = useTrashActions("products");
  const reorder = useReorder("products", "products");
  const confirm = useConfirm();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [discountValue, setDiscountValue] = useState("");

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function duplicateProduct(p: Product) {
    const { id: _id, created_at: _c, updated_at: _u, ...rest } = p;
    void _id;
    void _c;
    void _u;
    await save.mutateAsync({
      ...rest,
      name_ar: p.name_ar ? `${p.name_ar} (نسخة)` : p.name_ar,
      name_en: p.name_en ? `${p.name_en} (copy)` : p.name_en,
      sort_order: (p.sort_order ?? 0) + 1,
    });
    toast.success(t("duplicated"));
  }

  async function bulkPatch(patch: Record<string, unknown>) {
    const ids = [...selected];
    if (!ids.length) return;
    setBulkBusy(true);
    try {
      const { error } = await supabase
        .from("products")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .update(patch as any)
        .in("id", ids);
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(t("saved"));
      setSelected(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBulkBusy(false);
    }
  }

  async function bulkRemove() {
    const ids = [...selected];
    if (!ids.length) return;
    const ok = await confirm({
      title: t("bulkDeleteTitle"),
      description: t("deleteItemDesc"),
      confirmLabel: t("delete"),
      action: async () => {
        setBulkBusy(true);
        try {
          await trash.softDelete(ids);
          setSelected(new Set());
        } finally {
          setBulkBusy(false);
        }
      },
    });
    void ok;
  }

  const [draft, setDraft] = useState<Draft | null>(null);
  const [search, setSearch] = useState("");
  const [groups, setGroups] = useState<Groups>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  const categoryIds = useMemo(() => categories.map((c) => c.id), [categories]);

  useEffect(() => {
    if (!reorder.isPending) setGroups(buildGroups(products, categoryIds));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, categoryIds]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const searching = search.trim().length > 0;
  const filteredIds = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return new Set(
      products
        .filter((p) => [p.name_ar, p.name_en].join(" ").toLowerCase().includes(q))
        .map((p) => p.id),
    );
  }, [products, search]);

  const activeProduct = activeId ? products.find((p) => p.id === activeId) : null;

  function findContainer(id: string): string | null {
    if (groups[id]) return id;
    return Object.keys(groups).find((key) => groups[key].some((p) => p.id === id)) ?? null;
  }

  function handleDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e;
    if (!over) return;
    const activeContainer = findContainer(String(active.id));
    const overContainer =
      findContainer(String(over.id)) ?? (groups[String(over.id)] ? String(over.id) : null);
    if (!activeContainer || !overContainer || activeContainer === overContainer) return;

    setGroups((prev) => {
      const activeItems = prev[activeContainer];
      const overItems = prev[overContainer];
      const moving = activeItems.find((p) => p.id === active.id);
      if (!moving) return prev;
      const overIndex = overItems.findIndex((p) => p.id === over.id);
      const insertAt = overIndex >= 0 ? overIndex : overItems.length;
      return {
        ...prev,
        [activeContainer]: activeItems.filter((p) => p.id !== active.id),
        [overContainer]: [
          ...overItems.slice(0, insertAt),
          { ...moving, category_id: overContainer === UNCAT ? null : overContainer },
          ...overItems.slice(insertAt),
        ],
      };
    });
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveId(null);
    if (!over) return;
    const container = findContainer(String(active.id));
    if (!container) return;
    const items = groups[container];
    const oldIndex = items.findIndex((p) => p.id === active.id);
    const newIndex = items.findIndex((p) => p.id === over.id);

    let next = groups;
    if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
      const reordered = [...items];
      reordered.splice(newIndex, 0, reordered.splice(oldIndex, 1)[0]);
      next = { ...groups, [container]: reordered };
      setGroups(next);
    }

    // Persist every product in the affected container(s).
    const patches = Object.entries(next).flatMap(([key, list]) =>
      list.map((p, i) => ({
        id: p.id,
        sort_order: i,
        category_id: key === UNCAT ? null : key,
      })),
    );
    reorder.mutate(patches);
  }

  async function submit() {
    if (!draft) return;
    if (!draft.name_ar && !draft.name_en) {
      toast.error(t("nameEn"));
      return;
    }
    await save.mutateAsync({
      ...draft,
      price: Number(draft.price) || 0,
      old_price: draft.old_price ? Number(draft.old_price) : null,
      discount: Number(draft.discount) || 0,
      calories: draft.calories ? Number(draft.calories) : null,
      prep_time: draft.prep_time ? Number(draft.prep_time) : null,
      tags: draft.tags,
      cover_index: draft.cover_index,
    });
    setDraft(null);
  }

  function editProduct(p: Product) {
    setDraft({
      ...p,
      images: productImages(p),
      tags: productTags(p),
      cover_index: typeof p.cover_index === "number" ? p.cover_index : 0,
    });
  }

  const toggles: { key: keyof Draft; label: string }[] = [
    { key: "is_available", label: t("available") },
    { key: "is_featured", label: t("featured") },
    { key: "is_best_seller", label: t("bestSeller") },
    { key: "is_new", label: t("isNew") },
    { key: "is_spicy", label: t("spicy") },
    { key: "is_vegetarian", label: t("vegetarian") },
  ];

  const orderedGroups = [
    ...categories.map((c) => ({ id: c.id, name: pick(c, "name") })),
    { id: UNCAT, name: t("uncategorized") },
  ];

  return (
    <>
      <PageHeader
        title={t("products")}
        action={
          <Button
            size="sm"
            onClick={() => setDraft(emptyDraft(products.length, products[0]?.currency || "SAR"))}
          >
            <Plus className="size-4" /> {t("addNew")}
          </Button>
        }
      />

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("products")}
          className="ps-9"
        />
      </div>

      {selected.size > 0 ? (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-primary/40 bg-card/95 p-2.5 shadow-elevated backdrop-blur">
          <span className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
            {selected.size} {t("selectedCount")}
          </span>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            <X className="size-3.5" /> {t("clearSelection")}
          </Button>
          <div className="mx-1 h-5 w-px bg-border" />
          <Button
            size="sm"
            variant="outline"
            disabled={bulkBusy}
            onClick={() => bulkPatch({ is_hidden: false })}
          >
            <Eye className="size-3.5" /> {t("bulkShow")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkBusy}
            onClick={() => bulkPatch({ is_hidden: true })}
          >
            <EyeOff className="size-3.5" /> {t("bulkHide")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkBusy}
            onClick={() => bulkPatch({ is_featured: true })}
          >
            <Star className="size-3.5" /> {t("bulkFeatured")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={bulkBusy}
            onClick={() => bulkPatch({ is_best_seller: true })}
          >
            <Sparkles className="size-3.5" /> {t("bulkBestSeller")}
          </Button>
          <Select onValueChange={(v) => bulkPatch({ category_id: v === UNCAT ? null : v })}>
            <SelectTrigger className="h-9 w-auto gap-1 text-xs">
              <SelectValue placeholder={t("moveCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {pick(c, "name")}
                </SelectItem>
              ))}
              <SelectItem value={UNCAT}>{t("uncategorized")}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Input
              type="number"
              inputMode="numeric"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder="%"
              className="h-9 w-16"
            />
            <Button
              size="sm"
              variant="outline"
              disabled={bulkBusy || !discountValue}
              onClick={() => {
                bulkPatch({ discount: Number(discountValue) || 0 });
                setDiscountValue("");
              }}
            >
              {t("applyDiscount")}
            </Button>
          </div>
          <Button
            size="sm"
            variant="destructive"
            disabled={bulkBusy}
            onClick={() => void bulkRemove()}
          >
            <Trash2 className="size-3.5" /> {t("bulkDelete")}
          </Button>
        </div>
      ) : null}

      {products.length === 0 ? (
        <EmptyRow label={t("noItems")} />
      ) : (
        <>
          {!searching ? <p className="text-xs text-muted-foreground">{t("moveHint")}</p> : null}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-5">
              {orderedGroups.map((g) => {
                const items = (groups[g.id] ?? []).filter(
                  (p) => !filteredIds || filteredIds.has(p.id),
                );
                if (searching && items.length === 0) return null;
                if (!searching && g.id === UNCAT && items.length === 0) return null;
                return (
                  <section key={g.id}>
                    <h3 className="mb-2 flex items-center gap-2 font-heading text-sm font-bold text-foreground">
                      {g.name}
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] text-secondary-foreground">
                        {items.length}
                      </span>
                    </h3>
                    <ProductDroppable id={g.id}>
                      <SortableContext
                        items={items.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-2.5">
                          {items.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-border py-6 text-center text-xs text-muted-foreground">
                              {t("noItems")}
                            </div>
                          ) : (
                            items.map((p) => (
                              <ProductRow
                                key={p.id}
                                product={p}
                                draggable={!searching}
                                catName={(id) =>
                                  id
                                    ? pick(categories.find((c) => c.id === id) ?? {}, "name") ||
                                      t("uncategorized")
                                    : t("uncategorized")
                                }
                                onEdit={() => editProduct(p)}
                                onDelete={() => void trash.softDelete([p.id])}
                                onDuplicate={() => duplicateProduct(p)}
                                selected={selected.has(p.id)}
                                onToggleSelect={() => toggleSelect(p.id)}
                              />
                            ))
                          )}
                        </div>
                      </SortableContext>
                    </ProductDroppable>
                  </section>
                );
              })}
            </div>
            <DragOverlay>
              {activeProduct ? (
                <ProductRow product={activeProduct} draggable={false} catName={() => ""} overlay />
              ) : null}
            </DragOverlay>
          </DndContext>
        </>
      )}

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? t("edit") : t("addNew")}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <Field label={t("images")}>
                <GalleryEditor
                  images={draft.images}
                  coverIndex={draft.cover_index}
                  onChange={(images, cover) => setDraft({ ...draft, images, cover_index: cover })}
                />
              </Field>
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
              <Field label={t("category")}>
                <Select
                  value={draft.category_id ?? NONE}
                  onValueChange={(v) => setDraft({ ...draft, category_id: v === NONE ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("uncategorized")}</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {pick(c, "name")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("descriptionAr")}>
                  <Textarea
                    dir="rtl"
                    rows={2}
                    value={draft.description_ar}
                    onChange={(e) => setDraft({ ...draft, description_ar: e.target.value })}
                  />
                </Field>
                <Field label={t("descriptionEn")}>
                  <Textarea
                    dir="ltr"
                    rows={2}
                    value={draft.description_en}
                    onChange={(e) => setDraft({ ...draft, description_en: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("ingredientsAr")}>
                  <Textarea
                    dir="rtl"
                    rows={2}
                    value={draft.ingredients_ar}
                    onChange={(e) => setDraft({ ...draft, ingredients_ar: e.target.value })}
                  />
                </Field>
                <Field label={t("ingredientsEn")}>
                  <Textarea
                    dir="ltr"
                    rows={2}
                    value={draft.ingredients_en}
                    onChange={(e) => setDraft({ ...draft, ingredients_en: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("allergensAr")}>
                  <Textarea
                    dir="rtl"
                    rows={2}
                    value={draft.allergens_ar}
                    onChange={(e) => setDraft({ ...draft, allergens_ar: e.target.value })}
                  />
                </Field>
                <Field label={t("allergensEn")}>
                  <Textarea
                    dir="ltr"
                    rows={2}
                    value={draft.allergens_en}
                    onChange={(e) => setDraft({ ...draft, allergens_en: e.target.value })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("notesAr")}>
                  <Textarea
                    dir="rtl"
                    rows={2}
                    value={draft.notes_ar}
                    onChange={(e) => setDraft({ ...draft, notes_ar: e.target.value })}
                  />
                </Field>
                <Field label={t("notesEn")}>
                  <Textarea
                    dir="ltr"
                    rows={2}
                    value={draft.notes_en}
                    onChange={(e) => setDraft({ ...draft, notes_en: e.target.value })}
                  />
                </Field>
              </div>
              <Field label={t("tags")}>
                <TagInput value={draft.tags} onChange={(tags) => setDraft({ ...draft, tags })} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label={t("price")}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                  />
                </Field>
                <Field label={t("oldPrice")}>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={draft.old_price ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        old_price: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Field>
                <Field label={t("discount")}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={draft.discount}
                    onChange={(e) => setDraft({ ...draft, discount: Number(e.target.value) })}
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label={t("currency")}>
                  <Input
                    value={draft.currency}
                    onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                  />
                </Field>
                <Field label={t("calories")}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={draft.calories ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        calories: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Field>
                <Field label={t("prepTime")}>
                  <Input
                    type="number"
                    inputMode="numeric"
                    value={draft.prep_time ?? ""}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        prep_time: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {toggles.map((tg) => (
                  <label
                    key={tg.key}
                    className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5"
                  >
                    <span className="text-sm font-semibold">{tg.label}</span>
                    <Switch
                      checked={Boolean(draft[tg.key])}
                      onCheckedChange={(v) => setDraft({ ...draft, [tg.key]: v })}
                    />
                  </label>
                ))}
                <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
                  <span className="text-sm font-semibold">{t("visible")}</span>
                  <Switch
                    checked={!draft.is_hidden}
                    onCheckedChange={(v) => setDraft({ ...draft, is_hidden: !v })}
                  />
                </label>
              </div>
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

function ProductDroppable({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { container: true } });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[3rem] rounded-2xl transition-colors",
        isOver && "bg-primary/5 ring-1 ring-primary/30",
      )}
    >
      {children}
    </div>
  );
}

function ProductRow({
  product: p,
  draggable,
  catName,
  onEdit,
  onDelete,
  onDuplicate,
  selected,
  onToggleSelect,
  overlay = false,
}: {
  product: Product;
  draggable: boolean;
  catName: (id: string | null) => string;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  overlay?: boolean;
}) {
  const { pick } = useI18n();
  const sortable = useSortable({ id: p.id, disabled: !draggable });
  const img = orderedImages(p)[0];

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.4 : 1,
      };

  return (
    <div
      ref={overlay ? undefined : sortable.setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 rounded-2xl border bg-card p-3 shadow-sm transition-colors",
        selected ? "border-primary ring-1 ring-primary/40" : "border-border",
      )}
    >
      {onToggleSelect ? (
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelect}
          className="shrink-0"
          aria-label="Select"
        />
      ) : null}
      {draggable ? (
        <button
          type="button"
          className="shrink-0 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
          {...sortable.attributes}
          {...sortable.listeners}
          aria-label="Drag"
        >
          <GripVertical className="size-4" />
        </button>
      ) : null}
      <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
        {img ? <img src={mediaUrl(img)} alt="" className="size-full object-cover" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate font-bold text-foreground">{pick(p, "name")}</span>
          {p.is_hidden ? <EyeOff className="size-3.5 shrink-0 text-muted-foreground" /> : null}
        </div>
        <div className="truncate text-xs text-muted-foreground">{catName(p.category_id)}</div>
      </div>
      <div className="shrink-0 text-end">
        <div className="font-heading font-black text-primary">
          {p.price} {p.currency}
        </div>
        {p.old_price ? (
          <div className="text-xs text-muted-foreground line-through">{p.old_price}</div>
        ) : null}
      </div>
      {onDuplicate ? (
        <Button size="icon" variant="ghost" onClick={onDuplicate} aria-label="Duplicate">
          <Copy className="size-4" />
        </Button>
      ) : null}
      {onEdit ? (
        <Button size="icon" variant="ghost" onClick={onEdit}>
          <Pencil className="size-4" />
        </Button>
      ) : null}
      {onDelete ? (
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      ) : null}
    </div>
  );
}
