import { Search, Moon, Sun, Languages, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme-provider";
import { mediaUrl } from "@/lib/media";
import type { RestaurantSettings } from "@/lib/queries";

interface Props {
  settings: RestaurantSettings | null;
  search: string;
  onSearch: (v: string) => void;
}

export function MenuHeader({ settings, search, onSearch }: Props) {
  const { t, lang, toggleLang, pick } = useI18n();
  const { mode, toggleMode, config } = useTheme();
  const name = settings ? pick(settings, "name") : "";
  const logo = mediaUrl(settings?.logo_url);

  const headerStyle =
    config.headerStyle === "glass"
      ? "glass"
      : config.headerStyle === "gradient"
        ? "gradient-primary text-primary-foreground"
        : config.headerStyle === "transparent"
          ? "bg-transparent border-transparent"
          : "bg-header";
  const large = config.headerSize === "large";

  return (
    <header
      className={cn(
        "z-40 border-b border-border/70",
        headerStyle,
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-3xl items-center justify-between gap-3 px-4",
          large ? "py-5" : "py-3",
        )}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          {logo ? (
            <img
              src={logo}
              alt={name}
              className={cn(
                "shrink-0 rounded-xl object-cover shadow-soft",
                large ? "size-14" : "size-10",
              )}
            />
          ) : (
            <div
              className={cn(
                "flex shrink-0 items-center justify-center rounded-xl gradient-primary font-heading font-black text-primary-foreground",
                large ? "size-14 text-2xl" : "size-10 text-lg",
              )}
            >
              {name ? name.charAt(0) : "M"}
            </div>
          )}
          <div className="min-w-0">
            <h1
              className={cn(
                "truncate font-heading font-extrabold leading-tight text-foreground",
                large ? "text-xl" : "text-base",
                config.headerStyle === "gradient" && "text-primary-foreground",
              )}
            >
              {name || t("menu")}
            </h1>
            <p
              className={cn(
                "truncate text-[11px]",
                config.headerStyle === "gradient"
                  ? "text-primary-foreground/80"
                  : "text-muted-foreground",
              )}
            >
              {settings ? pick(settings, "description") : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <IconBtn onClick={toggleLang} label="Language">
            <Languages className="size-[18px]" />
            <span className="ms-0.5 text-xs font-bold">{lang === "ar" ? "EN" : "ع"}</span>
          </IconBtn>
          <IconBtn onClick={toggleMode} label="Theme">
            {mode === "dark" ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </IconBtn>
        </div>
      </div>

      {/* Search */}
      <div className="mx-auto max-w-3xl px-4 pb-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={t("search")}
            className="h-11 w-full rounded-xl border border-border bg-card ps-10 pe-10 text-sm text-foreground shadow-soft outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25"
          />
          {search ? (
            <button
              onClick={() => onSearch("")}
              className="absolute end-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "press inline-flex h-10 items-center justify-center rounded-xl px-2.5 text-foreground/80 transition hover:bg-muted",
        className,
      )}
    >
      {children}
    </button>
  );
}
