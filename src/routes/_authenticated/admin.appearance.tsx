import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { themeQuery } from "@/lib/queries";
import { useQuery } from "@tanstack/react-query";
import { useCrud } from "@/lib/admin-crud";
import {
  DEFAULT_THEME,
  mergeTheme,
  applyTheme,
  type ThemeConfig,
  type ThemePalette,
  type FontOption,
  type LayoutMode,
  type HeaderStyle,
  type HeaderSize,
  type CardStyle,
  type CardShadow,
  type Spacing,
  type ButtonShape,
  type ButtonFill,
  type CategoryStyle,
  type AnimationLevel,
} from "@/lib/theme-config";
import { useAdminT, type AdminTKey } from "@/lib/admin-i18n";
import { useConfirm } from "@/components/admin/ConfirmDialog";
import { PageHeader, Section, Field } from "@/components/admin/primitives";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/appearance")({
  component: AppearancePage,
});

const paletteKeys: { key: keyof ThemePalette; label: AdminTKey }[] = [
  { key: "primary", label: "primaryColor" },
  { key: "primaryForeground", label: "onPrimary" },
  { key: "secondary", label: "secondaryColor" },
  { key: "accent", label: "accentColor" },
  { key: "background", label: "backgroundColor" },
  { key: "surface", label: "surfaceColor" },
  { key: "card", label: "cardColor" },
  { key: "header", label: "headerColor" },
  { key: "footer", label: "footerColor" },
  { key: "foreground", label: "textColor" },
  { key: "muted", label: "surfaceColor" },
  { key: "border", label: "borderColor" },
];

function AppearancePage() {
  const t = useAdminT();
  const confirm = useConfirm();
  const themeRow = useQuery(themeQuery);
  const { save } = useCrud("theme_settings", "theme_settings");

  function requestReset() {
    void confirm({
      title: t("resetThemeTitle"),
      description: t("resetThemeDesc"),
      confirmLabel: t("resetTheme"),
      destructive: false,
      action: () => setCfg(DEFAULT_THEME),
    });
  }

  const [cfg, setCfg] = useState<ThemeConfig>(DEFAULT_THEME);

  useEffect(() => {
    if (themeRow.data) setCfg(mergeTheme(themeRow.data.config as Partial<ThemeConfig>));
  }, [themeRow.data]);

  // Live preview.
  useEffect(() => {
    applyTheme(cfg);
  }, [cfg]);

  async function persist() {
    const payload = themeRow.data?.id ? { id: themeRow.data.id, config: cfg } : { config: cfg };
    await save.mutateAsync(payload);
    toast.success(t("saved"));
  }

  function set<K extends keyof ThemeConfig>(key: K, value: ThemeConfig[K]) {
    setCfg((c) => ({ ...c, [key]: value }));
  }

  function setPalette(mode: "light" | "dark", key: keyof ThemePalette, value: string) {
    setCfg((c) => ({ ...c, [mode]: { ...c[mode], [key]: value } }));
  }

  const saveBtn = (
    <Button size="sm" onClick={persist} disabled={save.isPending}>
      {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
      {t("save")}
    </Button>
  );

  return (
    <>
      <PageHeader
        title={t("appearance")}
        action={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={requestReset}>
              <RotateCcw className="size-4" /> {t("resetTheme")}
            </Button>
            {saveBtn}
          </div>
        }
      />

      <p className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2 text-xs font-semibold text-primary">
        <span className="inline-block size-2 animate-pulse rounded-full bg-primary" />
        {t("livePreview")}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={`${t("colors")} — ${t("lightMode")}`}>
          <PaletteEditor palette={cfg.light} onChange={(k, v) => setPalette("light", k, v)} />
        </Section>
        <Section title={`${t("colors")} — ${t("darkMode")}`}>
          <PaletteEditor palette={cfg.dark} onChange={(k, v) => setPalette("dark", k, v)} />
        </Section>
      </div>

      <Section title={t("fonts")}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("headingFont")}>
            <FontSelect value={cfg.headingFont} onChange={(v) => set("headingFont", v)} />
          </Field>
          <Field label={t("bodyFont")}>
            <FontSelect value={cfg.bodyFont} onChange={(v) => set("bodyFont", v)} />
          </Field>
        </div>
        <div className="mt-4 space-y-5">
          <SliderField
            label={`${t("fontSize")} (${cfg.fontScale.toFixed(2)}×)`}
            value={cfg.fontScale}
            min={0.85}
            max={1.25}
            step={0.05}
            onChange={(v) => set("fontScale", v)}
          />
          <SliderField
            label={`${t("fontWeight")} (${cfg.fontWeight})`}
            value={cfg.fontWeight}
            min={300}
            max={700}
            step={100}
            onChange={(v) => set("fontWeight", v)}
          />
          <SliderField
            label={`${t("lineHeight")} (${cfg.lineHeight.toFixed(2)})`}
            value={cfg.lineHeight}
            min={1.2}
            max={2}
            step={0.05}
            onChange={(v) => set("lineHeight", v)}
          />
        </div>
      </Section>

      <Section title={t("cardsSection")}>
        <div className="mb-4 space-y-5">
          <SliderField
            label={`${t("borderRadius")} (${cfg.radius.toFixed(2)}rem)`}
            value={cfg.radius}
            min={0}
            max={2}
            step={0.05}
            onChange={(v) => set("radius", v)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label={t("cardStyle")}>
            <EnumSelect
              value={cfg.cardStyle}
              onChange={(v) => set("cardStyle", v as CardStyle)}
              options={[
                ["elevated", t("elevated")],
                ["flat", t("flat")],
                ["bordered", t("bordered")],
                ["glass", t("glass")],
              ]}
            />
          </Field>
          <Field label={t("shadow")}>
            <EnumSelect
              value={cfg.cardShadow}
              onChange={(v) => set("cardShadow", v as CardShadow)}
              options={[
                ["none", t("none")],
                ["sm", t("small")],
                ["md", t("medium")],
                ["lg", t("strong")],
              ]}
            />
          </Field>
          <Field label={t("spacing")}>
            <EnumSelect
              value={cfg.spacing}
              onChange={(v) => set("spacing", v as Spacing)}
              options={[
                ["compact", t("compact")],
                ["cozy", t("cozy")],
                ["comfortable", t("comfortable")],
              ]}
            />
          </Field>
          <Field label={t("layout")}>
            <EnumSelect
              value={cfg.layout}
              onChange={(v) => set("layout", v as LayoutMode)}
              options={[
                ["grid", t("gridStyle")],
                ["list", t("listStyle")],
              ]}
            />
          </Field>
        </div>
      </Section>

      <Section title={t("buttons")}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={t("buttonShape")}>
            <EnumSelect
              value={cfg.buttonShape}
              onChange={(v) => set("buttonShape", v as ButtonShape)}
              options={[
                ["rounded", t("rounded")],
                ["pill", t("pill")],
                ["square", t("square")],
              ]}
            />
          </Field>
          <Field label={t("buttonFill")}>
            <EnumSelect
              value={cfg.buttonFill}
              onChange={(v) => set("buttonFill", v as ButtonFill)}
              options={[
                ["solid", t("solid")],
                ["outline", t("outline")],
                ["soft", t("soft")],
              ]}
            />
          </Field>
          <ToggleRow
            label={t("buttonShadow")}
            checked={cfg.buttonShadow}
            onChange={(v) => set("buttonShadow", v)}
          />
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t("headerSection")}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("headerStyle")}>
              <EnumSelect
                value={cfg.headerStyle}
                onChange={(v) => set("headerStyle", v as HeaderStyle)}
                options={[
                  ["glass", t("glass")],
                  ["solid", t("solid")],
                  ["gradient", t("gradient")],
                  ["transparent", t("transparent")],
                ]}
              />
            </Field>
            <Field label={t("headerSize")}>
              <EnumSelect
                value={cfg.headerSize}
                onChange={(v) => set("headerSize", v as HeaderSize)}
                options={[
                  ["compact", t("compact")],
                  ["large", t("large")],
                ]}
              />
            </Field>
          </div>
          <div className="mt-3">
            <ToggleRow
              label={t("sticky")}
              checked={cfg.headerSticky}
              onChange={(v) => set("headerSticky", v)}
            />
          </div>
        </Section>

        <Section title={t("categoriesSection")}>
          <Field label={t("categoryStyle")}>
            <EnumSelect
              value={cfg.categoryStyle}
              onChange={(v) => set("categoryStyle", v as CategoryStyle)}
              options={[
                ["pills", t("pills")],
                ["rounded", t("rounded")],
                ["underline", t("underline")],
                ["cards", t("cards")],
              ]}
            />
          </Field>
        </Section>
      </div>

      <Section title={t("motion")}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t("animations")}>
            <EnumSelect
              value={cfg.animationLevel}
              onChange={(v) => set("animationLevel", v as AnimationLevel)}
              options={[
                ["none", t("animNone")],
                ["minimal", t("animMinimal")],
                ["smooth", t("animSmooth")],
                ["premium", t("animPremium")],
              ]}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <ToggleRow
            label={t("whatsapp")}
            checked={cfg.showFloatingWhatsapp}
            onChange={(v) => set("showFloatingWhatsapp", v)}
          />
          <ToggleRow
            label={t("phone")}
            checked={cfg.showFloatingCall}
            onChange={(v) => set("showFloatingCall", v)}
          />
        </div>
      </Section>

      <div className="flex justify-end pb-4">
        <Button size="lg" onClick={persist} disabled={save.isPending}>
          {save.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Save className="size-4" />
          )}
          {t("save")}
        </Button>
      </div>
    </>
  );
}

function PaletteEditor({
  palette,
  onChange,
}: {
  palette: ThemePalette;
  onChange: (k: keyof ThemePalette, v: string) => void;
}) {
  const t = useAdminT();
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {paletteKeys.map(({ key, label }) => (
        <label key={key} className="flex items-center gap-2 rounded-xl border border-border p-2">
          <input
            type="color"
            value={palette[key]}
            onChange={(e) => onChange(key, e.target.value)}
            className="size-8 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
          />
          <span className="truncate text-xs font-medium text-foreground">{t(label)}</span>
        </label>
      ))}
    </div>
  );
}

function FontSelect({ value, onChange }: { value: FontOption; onChange: (v: FontOption) => void }) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as FontOption)}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="jakarta">Plus Jakarta Sans</SelectItem>
        <SelectItem value="cairo">Cairo</SelectItem>
        <SelectItem value="tajawal">Tajawal</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  );
}

function EnumSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map(([v, label]) => (
          <SelectItem key={v} value={v}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0])}
      />
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-border px-3 py-2.5">
      <span className="text-sm font-semibold">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
