import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, mediaUrl } from "@/lib/media";
import { useAdminT } from "@/lib/admin-i18n";
import { cn } from "@/lib/utils";
import { SortableList, SortableItem } from "./Sortable";
import { ImageCropper } from "./ImageCropper";
import { useConfirm } from "./ConfirmDialog";

interface GalleryEditorProps {
  images: string[];
  coverIndex: number;
  onChange: (images: string[], coverIndex: number) => void;
  folder?: string;
}

/**
 * Full product gallery manager: upload multiple images, drag to reorder,
 * choose a cover, replace and delete individual images.
 */
export function GalleryEditor({
  images,
  coverIndex,
  onChange,
  folder = "products",
}: GalleryEditorProps) {
  const t = useAdminT();
  const confirm = useConfirm();
  const addRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const replaceTarget = useRef<number>(-1);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);
  const [replacing, setReplacing] = useState<File | null>(null);

  const coverPath = images[coverIndex] ?? images[0];

  async function uploadCropped(file: File) {
    setQueue((q) => q.slice(1));
    setBusy(true);
    try {
      const path = await uploadImage(file, folder);
      onChange([...images, path], images.length ? coverIndex : 0);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function replaceCropped(file: File) {
    const idx = replaceTarget.current;
    setReplacing(null);
    if (idx < 0) return;
    setBusy(true);
    try {
      const path = await uploadImage(file, folder);
      const next = images.map((img, i) => (i === idx ? path : img));
      onChange(next, coverIndex);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
      replaceTarget.current = -1;
    }
  }

  function reorder(nextPaths: string[]) {
    // keep the same image as cover after reordering
    const newCover = coverPath ? nextPaths.indexOf(coverPath) : 0;
    onChange(nextPaths, newCover < 0 ? 0 : newCover);
  }

  function removeAt(idx: number) {
    const next = images.filter((_, i) => i !== idx);
    let newCover = coverIndex;
    if (idx === coverIndex) newCover = 0;
    else if (idx < coverIndex) newCover = coverIndex - 1;
    onChange(next, Math.max(0, Math.min(newCover, next.length - 1)));
  }

  function requestRemove(idx: number) {
    void confirm({
      title: t("removeImageTitle"),
      description: t("removeImageDesc"),
      confirmLabel: t("remove"),
      action: () => removeAt(idx),
    });
  }

  return (
    <div className="space-y-2.5">
      <SortableList
        ids={images}
        onReorder={reorder}
        strategy="grid"
        className="grid grid-cols-3 gap-2.5 sm:grid-cols-4"
      >
        {images.map((img, i) => {
          const isCover = i === coverIndex || (coverIndex >= images.length && i === 0);
          return (
            <SortableItem key={img} id={img} handle={false} className="aspect-square">
              <div
                className={cn(
                  "group relative size-full overflow-hidden rounded-xl border-2",
                  isCover ? "border-primary" : "border-border",
                )}
              >
                <img
                  src={mediaUrl(img)}
                  alt=""
                  className="size-full object-cover"
                  draggable={false}
                />
                {isCover ? (
                  <span className="absolute start-1 top-1 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                    {t("coverImage")}
                  </span>
                ) : null}
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {!isCover ? (
                    <button
                      type="button"
                      title={t("setCover")}
                      onClick={() => onChange(images, i)}
                      className="flex size-7 items-center justify-center rounded-full bg-white/90 text-foreground hover:bg-primary hover:text-primary-foreground"
                    >
                      <Star className="size-3.5" />
                    </button>
                  ) : null}
                  <button
                    type="button"
                    title={t("upload")}
                    onClick={() => {
                      replaceTarget.current = i;
                      replaceRef.current?.click();
                    }}
                    className="flex size-7 items-center justify-center rounded-full bg-white/90 text-foreground hover:bg-secondary"
                  >
                    <RefreshCw className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title={t("delete")}
                    onClick={() => requestRemove(i)}
                    className="flex size-7 items-center justify-center rounded-full bg-white/90 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            </SortableItem>
          );
        })}
      </SortableList>

      <button
        type="button"
        onClick={() => addRef.current?.click()}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {busy ? t("uploading") : t("upload")}
      </button>

      <input
        ref={addRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) setQueue((q) => [...q, ...Array.from(e.target.files!)]);
          e.target.value = "";
        }}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setReplacing(f);
          e.target.value = "";
        }}
      />

      <ImageCropper
        file={queue[0] ?? null}
        aspect={1}
        fileName={queue[0]?.name}
        onCancel={() => setQueue((q) => q.slice(1))}
        onCropped={uploadCropped}
      />
      <ImageCropper
        file={replacing}
        aspect={1}
        fileName={replacing?.name}
        onCancel={() => {
          setReplacing(null);
          replaceTarget.current = -1;
        }}
        onCropped={replaceCropped}
      />
    </div>
  );
}
