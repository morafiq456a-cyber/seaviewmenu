import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Download,
  Upload,
  Loader2,
  Store,
  FolderTree,
  UtensilsCrossed,
  Tag,
  Palette,
  Database,
} from "lucide-react";
import { toast } from "sonner";

import { useSettings } from "@/lib/queries";
import { useI18n } from "@/lib/i18n";
import { useAdminT, type AdminTKey } from "@/lib/admin-i18n";
import {
  buildBackup,
  downloadBackup,
  restoreBackup,
  type BackupSection,
  type BackupFile,
} from "@/lib/backup";
import { PageHeader, Section } from "@/components/admin/primitives";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/import-export")({
  component: ImportExportPage,
});

const exportButtons: { label: AdminTKey; icon: LucideIcon; sections: BackupSection[] }[] = [
  { label: "exportRestaurant", icon: Store, sections: ["restaurant", "social"] },
  { label: "exportCategories", icon: FolderTree, sections: ["categories"] },
  { label: "exportProducts", icon: UtensilsCrossed, sections: ["products"] },
  { label: "exportOffers", icon: Tag, sections: ["offers"] },
  { label: "exportAppearance", icon: Palette, sections: ["appearance"] },
];

const ALL: BackupSection[] = [
  "restaurant",
  "social",
  "appearance",
  "categories",
  "products",
  "offers",
];

function ImportExportPage() {
  const t = useAdminT();
  const { pick } = useI18n();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const settings = useSettings().data;
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const slug =
    (settings ? pick(settings, "name") : "restaurant")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "restaurant";

  async function doExport(sections: BackupSection[], suffix: string) {
    setBusy(suffix);
    try {
      const backup = await buildBackup(sections);
      const date = new Date().toISOString().slice(0, 10);
      downloadBackup(backup, `${slug}-${suffix}-${date}.json`);
      toast.success(t("saved"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  }

  async function handleFile(file: File) {
    const text = await file.text();
    let parsed: BackupFile;
    try {
      parsed = JSON.parse(text) as BackupFile;
    } catch {
      toast.error(t("importError"));
      return;
    }
    void confirm({
      title: t("restoreBackupTitle"),
      description: t("restoreBackupDesc"),
      confirmLabel: t("import"),
      action: async () => {
        setImporting(true);
        try {
          await restoreBackup(parsed);
          await qc.invalidateQueries();
          toast.success(t("importSuccess"));
        } finally {
          setImporting(false);
        }
      },
    });
  }

  return (
    <>
      <PageHeader title={t("importExport")} />

      <Section title={t("dataTransfer")} description={t("exportDesc")}>
        <Button
          size="lg"
          className="w-full"
          onClick={() => doExport(ALL, "full-backup")}
          disabled={busy === "full-backup"}
        >
          {busy === "full-backup" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Database className="size-4" />
          )}
          {t("exportEverything")}
        </Button>

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {exportButtons.map((b) => (
            <Button
              key={b.label}
              variant="outline"
              onClick={() => doExport(b.sections, b.label.replace("export", "").toLowerCase())}
              disabled={busy === b.label.replace("export", "").toLowerCase()}
              className="justify-start"
            >
              {busy === b.label.replace("export", "").toLowerCase() ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <b.icon className="size-4" />
              )}
              {t(b.label)}
            </Button>
          ))}
        </div>
      </Section>

      <Section title={t("import")} description={t("importDesc")}>
        <p className="mb-3 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-xs font-semibold text-accent">
          {t("replaceWarning")}
        </p>
        <Button
          size="lg"
          variant="outline"
          className="w-full"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
        >
          {importing ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {t("chooseFile")}
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
            e.target.value = "";
          }}
        />
      </Section>
    </>
  );
}
