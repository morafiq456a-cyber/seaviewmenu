import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  useSettings,
  useSocial,
  parseWorkingHours,
  type RestaurantSettings,
  type SocialLinks,
  type WorkingHour,
} from "@/lib/queries";
import { useCrud } from "@/lib/admin-crud";
import { useAdminT } from "@/lib/admin-i18n";
import { useI18n } from "@/lib/i18n";
import { PageHeader, Section, Field } from "@/components/admin/primitives";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: SettingsPage,
});

const dayLabels = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function defaultHours(): WorkingHour[] {
  return Array.from({ length: 7 }, (_, day) => ({
    day,
    open: "10:00",
    close: "23:00",
    closed: false,
  }));
}

function SettingsPage() {
  const t = useAdminT();
  const { t: ct } = useI18n();
  const settingsQ = useSettings();
  const socialQ = useSocial();
  const settingsCrud = useCrud("restaurant_settings", "restaurant_settings");
  const socialCrud = useCrud("social_links", "social_links");

  const [s, setS] = useState<RestaurantSettings | null>(null);
  const [social, setSocial] = useState<SocialLinks | null>(null);
  const [hours, setHours] = useState<WorkingHour[]>(defaultHours());

  useEffect(() => {
    if (settingsQ.data) {
      setS(settingsQ.data);
      const wh = parseWorkingHours(settingsQ.data);
      setHours(wh.length ? wh : defaultHours());
    }
  }, [settingsQ.data]);
  useEffect(() => {
    if (socialQ.data) setSocial(socialQ.data);
  }, [socialQ.data]);

  async function saveAll() {
    if (!s) return;
    await settingsCrud.save.mutateAsync({ ...s, working_hours: hours });
    if (social) await socialCrud.save.mutateAsync(social);
    toast.success(t("saved"));
  }

  if (!s) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const socialFields: (keyof SocialLinks)[] = [
    "instagram",
    "facebook",
    "tiktok",
    "snapchat",
    "x",
    "threads",
    "youtube",
    "website",
  ];

  return (
    <>
      <PageHeader
        title={t("settings")}
        action={
          <Button size="sm" onClick={saveAll} disabled={settingsCrud.save.isPending}>
            {settingsCrud.save.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("save")}
          </Button>
        }
      />

      <Section title={t("restaurantName")}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("nameAr")}>
              <Input
                dir="rtl"
                value={s.name_ar}
                onChange={(e) => setS({ ...s, name_ar: e.target.value })}
              />
            </Field>
            <Field label={t("nameEn")}>
              <Input
                dir="ltr"
                value={s.name_en}
                onChange={(e) => setS({ ...s, name_en: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("descriptionAr")}>
              <Textarea
                dir="rtl"
                rows={2}
                value={s.description_ar}
                onChange={(e) => setS({ ...s, description_ar: e.target.value })}
              />
            </Field>
            <Field label={t("descriptionEn")}>
              <Textarea
                dir="ltr"
                rows={2}
                value={s.description_en}
                onChange={(e) => setS({ ...s, description_en: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label={t("logo")}>
              <ImageUploader
                value={s.logo_url}
                onChange={(v) => setS({ ...s, logo_url: v })}
                folder="brand"
                aspect="square"
              />
            </Field>
            <Field label={t("cover")}>
              <ImageUploader
                value={s.cover_url}
                onChange={(v) => setS({ ...s, cover_url: v })}
                folder="brand"
                aspect="video"
              />
            </Field>
          </div>
        </div>
      </Section>

      <Section title={t("phone")}>
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("phone")}>
            <Input
              dir="ltr"
              value={s.phone}
              onChange={(e) => setS({ ...s, phone: e.target.value })}
            />
          </Field>
          <Field label={t("whatsapp")}>
            <Input
              dir="ltr"
              value={s.whatsapp}
              onChange={(e) => setS({ ...s, whatsapp: e.target.value })}
            />
          </Field>
          <Field label={t("email")}>
            <Input
              dir="ltr"
              value={s.email}
              onChange={(e) => setS({ ...s, email: e.target.value })}
            />
          </Field>
          <Field label={t("currency")}>
            <Input value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })} />
          </Field>
          <Field label={`${t("address")} (ع)`}>
            <Input
              dir="rtl"
              value={s.address_ar}
              onChange={(e) => setS({ ...s, address_ar: e.target.value })}
            />
          </Field>
          <Field label={`${t("address")} (EN)`}>
            <Input
              dir="ltr"
              value={s.address_en}
              onChange={(e) => setS({ ...s, address_en: e.target.value })}
            />
          </Field>
          <Field label={t("mapsUrl")} className="col-span-2">
            <Input
              dir="ltr"
              value={s.google_maps_url}
              onChange={(e) => setS({ ...s, google_maps_url: e.target.value })}
            />
          </Field>
        </div>
      </Section>

      <Section title={t("workingHours")}>
        <div className="space-y-2">
          {hours.map((h, i) => (
            <div
              key={h.day}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border p-2.5"
            >
              <span className="w-20 shrink-0 text-sm font-semibold">{ct(dayLabels[h.day])}</span>
              <Input
                type="time"
                dir="ltr"
                value={h.open}
                disabled={h.closed}
                onChange={(e) =>
                  setHours(hours.map((x, xi) => (xi === i ? { ...x, open: e.target.value } : x)))
                }
                className="w-28"
              />
              <span className="text-muted-foreground">–</span>
              <Input
                type="time"
                dir="ltr"
                value={h.close}
                disabled={h.closed}
                onChange={(e) =>
                  setHours(hours.map((x, xi) => (xi === i ? { ...x, close: e.target.value } : x)))
                }
                className="w-28"
              />
              <label className="ms-auto flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">{t("closed")}</span>
                <Switch
                  checked={h.closed}
                  onCheckedChange={(v) =>
                    setHours(hours.map((x, xi) => (xi === i ? { ...x, closed: v } : x)))
                  }
                />
              </label>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t("social")}>
        <div className="grid grid-cols-2 gap-3">
          {socialFields.map((f) => (
            <Field key={f} label={f.charAt(0).toUpperCase() + f.slice(1)}>
              <Input
                dir="ltr"
                value={(social?.[f] as string) ?? ""}
                onChange={(e) =>
                  setSocial({ ...(social ?? ({} as SocialLinks)), [f]: e.target.value })
                }
                placeholder="https://"
              />
            </Field>
          ))}
        </div>
      </Section>

      <Section title={t("branding")}>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t("favicon")}>
            <ImageUploader
              value={s.favicon_url ?? ""}
              onChange={(v) => setS({ ...s, favicon_url: v })}
              folder="brand"
              aspect="square"
            />
          </Field>
          <Field label={t("ogImage")}>
            <ImageUploader
              value={s.og_image_url ?? ""}
              onChange={(v) => setS({ ...s, og_image_url: v })}
              folder="brand"
              aspect="video"
            />
          </Field>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label={t("defaultLanguage")}>
            <Select
              value={s.default_language ?? "ar"}
              onValueChange={(v) => setS({ ...s, default_language: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">{t("arabic")}</SelectItem>
                <SelectItem value="en">{t("english")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("currencyPosition")}>
            <Select
              value={s.currency_position ?? "before"}
              onValueChange={(v) => setS({ ...s, currency_position: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="before">{t("before")}</SelectItem>
                <SelectItem value="after">{t("after")}</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("decimals")}>
            <Select
              value={String(s.decimal_places ?? 2)}
              onValueChange={(v) => setS({ ...s, decimal_places: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0</SelectItem>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label={t("timezone")} className="col-span-2 sm:col-span-3">
            <Input
              dir="ltr"
              value={s.timezone ?? ""}
              onChange={(e) => setS({ ...s, timezone: e.target.value })}
              placeholder="Asia/Riyadh"
            />
          </Field>
        </div>
      </Section>

      <Section title={t("maintenance")}>
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-xl border border-border p-3">
            <span className="text-sm font-semibold">{t("maintenance")}</span>
            <Switch
              checked={s.maintenance_mode}
              onCheckedChange={(v) => setS({ ...s, maintenance_mode: v })}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <Field label={`${t("maintenanceMsg")} (ع)`}>
              <Input
                dir="rtl"
                value={s.maintenance_message_ar}
                onChange={(e) => setS({ ...s, maintenance_message_ar: e.target.value })}
              />
            </Field>
            <Field label={`${t("maintenanceMsg")} (EN)`}>
              <Input
                dir="ltr"
                value={s.maintenance_message_en}
                onChange={(e) => setS({ ...s, maintenance_message_en: e.target.value })}
              />
            </Field>
          </div>
        </div>
      </Section>

      <div className="flex justify-end pb-4">
        <Button onClick={saveAll} disabled={settingsCrud.save.isPending} size="lg">
          {settingsCrud.save.isPending ? (
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
