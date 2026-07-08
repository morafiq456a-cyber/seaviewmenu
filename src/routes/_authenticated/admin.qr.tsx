import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Download, Copy, Check, FileImage, FileCode, FileText } from "lucide-react";
import { toast } from "sonner";

import { useSettings } from "@/lib/queries";
import { useAdminT } from "@/lib/admin-i18n";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import { PageHeader, Section, Field } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/admin/qr")({
  component: QrPage,
});

const EXPORT_SIZE = 1024;

function QrPage() {
  const t = useAdminT();
  const { pick } = useI18n();
  const settings = useSettings().data;
  const previewRef = useRef<HTMLDivElement>(null);
  const hiResRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<HTMLDivElement>(null);

  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [fg, setFg] = useState("#1a1409");
  const [bg, setBg] = useState("#ffffff");
  const [withLogo, setWithLogo] = useState(false);

  const logo = mediaUrl(settings?.logo_url);
  const slug =
    (settings ? pick(settings, "name") : "menu")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "menu";

  useEffect(() => {
    setUrl(window.location.origin);
  }, []);

  const imageSettings =
    withLogo && logo
      ? { src: logo, height: EXPORT_SIZE * 0.2, width: EXPORT_SIZE * 0.2, excavate: true }
      : undefined;
  const previewImageSettings =
    withLogo && logo ? { src: logo, height: 52, width: 52, excavate: true } : undefined;

  function downloadPng() {
    const canvas = hiResRef.current?.querySelector("canvas");
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `${slug}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function downloadSvg() {
    const svg = svgRef.current?.querySelector("svg");
    if (!svg) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([`<?xml version="1.0" encoding="UTF-8"?>\n${source}`], {
      type: "image/svg+xml",
    });
    const objUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = `${slug}-qr.svg`;
    link.href = objUrl;
    link.click();
    URL.revokeObjectURL(objUrl);
  }

  async function downloadPdf() {
    const canvas = hiResRef.current?.querySelector("canvas");
    if (!canvas) return;
    const { default: jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const qrSize = 120;
    const x = (pageW - qrSize) / 2;
    const name = settings ? pick(settings, "name") : "Menu";
    pdf.setFontSize(22);
    pdf.text(name, pageW / 2, 40, { align: "center" });
    pdf.addImage(canvas.toDataURL("image/png"), "PNG", x, 55, qrSize, qrSize);
    pdf.setFontSize(13);
    pdf.text(t("menuUrl"), pageW / 2, 190, { align: "center" });
    pdf.setFontSize(11);
    pdf.text(url, pageW / 2, 198, { align: "center" });
    pdf.save(`${slug}-qr.pdf`);
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(t("saved"));
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <>
      <PageHeader title={t("qrcode")} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t("menuUrl")}>
          <div className="space-y-4">
            <Field label={t("menuUrl")}>
              <div className="flex gap-2">
                <Input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} />
                <Button variant="outline" size="icon" onClick={copy}>
                  {copied ? <Check className="size-4 text-primary" /> : <Copy className="size-4" />}
                </Button>
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("qrColor")}>
                <ColorInput value={fg} onChange={setFg} />
              </Field>
              <Field label={t("qrBgColor")}>
                <ColorInput value={bg} onChange={setBg} />
              </Field>
            </div>
            {logo ? (
              <label className="flex items-center justify-between rounded-xl border border-border p-3">
                <span className="text-sm font-semibold">{t("addLogo")}</span>
                <Switch checked={withLogo} onCheckedChange={setWithLogo} />
              </label>
            ) : null}
          </div>
        </Section>

        <Section title={t("downloadQr")}>
          <div className="flex flex-col items-center gap-5">
            <div
              ref={previewRef}
              className="rounded-3xl border border-border p-6 shadow-soft"
              style={{ background: bg }}
            >
              {url ? (
                <QRCodeCanvas
                  value={url}
                  size={220}
                  fgColor={fg}
                  bgColor={bg}
                  level="H"
                  marginSize={2}
                  imageSettings={previewImageSettings}
                />
              ) : null}
            </div>
            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
              <Button onClick={downloadPng} disabled={!url}>
                <FileImage className="size-4" /> {t("downloadPng")}
              </Button>
              <Button variant="outline" onClick={downloadSvg} disabled={!url}>
                <FileCode className="size-4" /> {t("downloadSvg")}
              </Button>
              <Button variant="outline" onClick={downloadPdf} disabled={!url}>
                <FileText className="size-4" /> {t("downloadPdf")}
              </Button>
            </div>
          </div>
        </Section>
      </div>

      {/* Hidden high-resolution renderers for exports */}
      <div className="pointer-events-none fixed -left-[9999px] top-0" aria-hidden>
        <div ref={hiResRef}>
          {url ? (
            <QRCodeCanvas
              value={url}
              size={EXPORT_SIZE}
              fgColor={fg}
              bgColor={bg}
              level="H"
              marginSize={2}
              imageSettings={imageSettings}
            />
          ) : null}
        </div>
        <div ref={svgRef}>
          {url ? (
            <QRCodeSVG
              value={url}
              size={EXPORT_SIZE}
              fgColor={fg}
              bgColor={bg}
              level="H"
              marginSize={2}
              imageSettings={imageSettings}
            />
          ) : null}
        </div>
      </div>
    </>
  );
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="size-10 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-1"
      />
      <Input
        dir="ltr"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono text-xs"
      />
    </div>
  );
}
