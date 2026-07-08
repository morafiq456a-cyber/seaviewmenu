import { useCallback, useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { RotateCw, ZoomIn, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAdminT } from "@/lib/admin-i18n";
import { getCroppedImageFile } from "@/lib/crop-image";

interface ImageCropperProps {
  /** Source file to edit; when null the dialog is closed. */
  file: File | null;
  aspect?: number;
  fileName?: string;
  onCancel: () => void;
  onCropped: (file: File) => void;
}

/** Modal cropper: crop, rotate and zoom before an image is uploaded. */
export function ImageCropper({
  file,
  aspect = 16 / 9,
  fileName = "image.png",
  onCancel,
  onCropped,
}: ImageCropperProps) {
  const t = useAdminT();
  const [src, setSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pixels, setPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!file) {
      setSrc(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onCropComplete = useCallback((_a: Area, areaPixels: Area) => {
    setPixels(areaPixels);
  }, []);

  async function apply() {
    if (!src || !pixels) return;
    setBusy(true);
    try {
      const out = await getCroppedImageFile(src, pixels, rotation, fileName);
      onCropped(out);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={!!file} onOpenChange={(o) => !o && !busy && onCancel()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("cropTitle")}</DialogTitle>
          <DialogDescription>{t("cropDesc")}</DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
              showGrid
            />
          )}
        </div>

        <div className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ZoomIn className="size-3.5" /> {t("zoom")}
            </label>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.01}
              onValueChange={([v]) => setZoom(v)}
              aria-label={t("zoom")}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => (r + 90) % 360)}
            >
              <RotateCw className="size-4" /> {t("rotate")}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setZoom(1);
                setRotation(0);
                setCrop({ x: 0, y: 0 });
              }}
            >
              {t("reset")}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
            {t("cancel")}
          </Button>
          <Button type="button" onClick={apply} disabled={busy || !pixels}>
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" /> {t("processing")}
              </>
            ) : (
              t("applyCrop")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
