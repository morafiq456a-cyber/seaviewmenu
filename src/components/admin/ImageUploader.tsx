import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadImage, mediaUrl } from "@/lib/media";
import { useAdminT } from "@/lib/admin-i18n";
import { cn } from "@/lib/utils";
import { ImageCropper } from "@/components/admin/ImageCropper";
import { useConfirm } from "@/components/admin/ConfirmDialog";

const ASPECT_RATIO: Record<string, number> = {
  square: 1,
  video: 16 / 9,
  wide: 21 / 9,
};

interface ImageUploaderProps {
  value: string;
  onChange: (path: string) => void;
  folder?: string;
  className?: string;
  aspect?: "square" | "video" | "wide";
}

/** Single-image uploader with crop/rotate/zoom before upload. */
export function ImageUploader({
  value,
  onChange,
  folder = "uploads",
  className,
  aspect = "video",
}: ImageUploaderProps) {
  const t = useAdminT();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<File | null>(null);

  function requestRemove() {
    void confirm({
      title: t("removeImageTitle"),
      description: t("removeImageDesc"),
      confirmLabel: t("remove"),
      action: () => onChange(""),
    });
  }

  async function handleCropped(file: File) {
    setPending(null);
    setBusy(true);
    try {
      const path = await uploadImage(file, folder);
      onChange(path);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  const aspectClass =
    aspect === "square" ? "aspect-square" : aspect === "wide" ? "aspect-[21/9]" : "aspect-video";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40",
        aspectClass,
        className,
      )}
    >
      {value ? (
        <>
          <img src={mediaUrl(value)} alt="" className="size-full object-cover" />
          <button
            type="button"
            aria-label={t("remove")}
            onClick={requestRemove}
            className="absolute end-2 top-2 flex size-8 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="flex size-full flex-col items-center justify-center gap-2 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
          <span className="text-xs font-medium">{busy ? t("uploading") : t("upload")}</span>
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setPending(f);
          e.target.value = "";
        }}
      />
      <ImageCropper
        file={pending}
        aspect={ASPECT_RATIO[aspect]}
        fileName={pending?.name}
        onCancel={() => setPending(null)}
        onCropped={handleCropped}
      />
    </div>
  );
}

interface MultiImageUploaderProps {
  values: string[];
  onChange: (paths: string[]) => void;
  folder?: string;
}

/** Multi-image uploader for product galleries (crops each file in turn). */
export function MultiImageUploader({
  values,
  onChange,
  folder = "products",
}: MultiImageUploaderProps) {
  const t = useAdminT();
  const confirm = useConfirm();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [queue, setQueue] = useState<File[]>([]);

  function requestRemove(idx: number) {
    void confirm({
      title: t("removeImageTitle"),
      description: t("removeImageDesc"),
      confirmLabel: t("remove"),
      action: () => onChange(values.filter((_, i) => i !== idx)),
    });
  }

  const current = queue[0] ?? null;

  async function handleCropped(file: File) {
    setQueue((q) => q.slice(1));
    setBusy(true);
    try {
      const path = await uploadImage(file, folder);
      onChange([...values, path]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
      {values.map((v, i) => (
        <div
          key={v + i}
          className="group relative aspect-square overflow-hidden rounded-xl border border-border"
        >
          <img src={mediaUrl(v)} alt="" className="size-full object-cover" />
          <button
            type="button"
            aria-label={t("remove")}
            onClick={() => requestRemove(i)}
            className="absolute end-1 top-1 flex size-6 items-center justify-center rounded-full bg-background/80 text-foreground shadow backdrop-blur transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex aspect-square flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {busy ? <Loader2 className="size-5 animate-spin" /> : <ImagePlus className="size-5" />}
        <span className="text-[10px] font-medium">{busy ? t("uploading") : t("upload")}</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) setQueue((q) => [...q, ...Array.from(e.target.files!)]);
          e.target.value = "";
        }}
      />
      <ImageCropper
        file={current}
        aspect={1}
        fileName={current?.name}
        onCancel={() => setQueue((q) => q.slice(1))}
        onCropped={handleCropped}
      />
    </div>
  );
}
