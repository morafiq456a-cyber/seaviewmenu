/**
 * Theme configuration — powers the live Visual Theme Builder.
 * The Admin edits a ThemeConfig object which is persisted to the
 * `theme_settings` table and applied at runtime by injecting a
 * <style id="theme-vars"> tag that overrides the CSS tokens in styles.css,
 * plus a set of data-attributes on <html> that drive discrete style switches.
 */

export interface ThemePalette {
  background: string;
  foreground: string;
  surface: string;
  card: string;
  cardForeground: string;
  header: string;
  footer: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  border: string;
}

export type FontOption = "jakarta" | "cairo" | "tajawal" | "system";
export type LayoutMode = "grid" | "list";
export type HeaderStyle = "solid" | "glass" | "gradient" | "transparent";
export type HeaderSize = "compact" | "large";
export type CardStyle = "elevated" | "flat" | "bordered" | "glass";
export type CardShadow = "none" | "sm" | "md" | "lg";
export type Spacing = "compact" | "cozy" | "comfortable";
export type ButtonShape = "rounded" | "pill" | "square";
export type ButtonFill = "solid" | "outline" | "soft";
export type CategoryStyle = "pills" | "rounded" | "underline" | "cards";
export type AnimationLevel = "none" | "minimal" | "smooth" | "premium";

export interface ThemeConfig {
  light: ThemePalette;
  dark: ThemePalette;

  // Shape & type
  radius: number; // rem
  fontScale: number; // multiplier
  fontWeight: number; // body weight
  lineHeight: number; // body line-height
  headingFont: FontOption;
  bodyFont: FontOption;

  // Cards & layout
  layout: LayoutMode;
  cardStyle: CardStyle;
  cardShadow: CardShadow;
  spacing: Spacing;

  // Buttons
  buttonShape: ButtonShape;
  buttonFill: ButtonFill;
  buttonShadow: boolean;

  // Header
  headerStyle: HeaderStyle;
  headerSize: HeaderSize;
  headerSticky: boolean;

  // Categories
  categoryStyle: CategoryStyle;

  // Motion
  animationLevel: AnimationLevel;

  // Floating actions
  showFloatingWhatsapp: boolean;
  showFloatingCall: boolean;
}

export const FONT_STACKS: Record<FontOption, string> = {
  jakarta: '"Plus Jakarta Sans Variable", "Cairo", system-ui, sans-serif',
  cairo: '"Cairo", "Plus Jakarta Sans Variable", system-ui, sans-serif',
  tajawal: '"Tajawal", "Cairo", system-ui, sans-serif',
  system: 'system-ui, -apple-system, "Segoe UI", sans-serif',
};

const SHADOW_PRESETS: Record<CardShadow, string> = {
  none: "none",
  sm: "0 2px 10px -6px color-mix(in oklab, var(--foreground) 22%, transparent)",
  md: "0 10px 30px -14px color-mix(in oklab, var(--foreground) 30%, transparent)",
  lg: "0 26px 60px -26px color-mix(in oklab, var(--foreground) 38%, transparent)",
};

export const DEFAULT_THEME: ThemeConfig = {
  light: {
    background: "#fbf7f0",
    foreground: "#23180f",
    surface: "#f6efe3",
    card: "#ffffff",
    cardForeground: "#23180f",
    header: "#fffdf8",
    footer: "#23180f",
    primary: "#b8863b",
    primaryForeground: "#fff9ee",
    secondary: "#f0e7d6",
    secondaryForeground: "#4a3a25",
    accent: "#c0472b",
    accentForeground: "#fff5f2",
    muted: "#f2ece1",
    mutedForeground: "#7a6a55",
    border: "#e7dcc9",
  },
  dark: {
    background: "#14100c",
    foreground: "#f5eee2",
    surface: "#1a140d",
    card: "#1e1811",
    cardForeground: "#f5eee2",
    header: "#181209",
    footer: "#0f0b07",
    primary: "#d2a24c",
    primaryForeground: "#1a1409",
    secondary: "#2a2119",
    secondaryForeground: "#f0e7d6",
    accent: "#e0603f",
    accentForeground: "#1a0d09",
    muted: "#241d15",
    mutedForeground: "#b3a58e",
    border: "#33291d",
  },
  radius: 1,
  fontScale: 1,
  fontWeight: 400,
  lineHeight: 1.5,
  headingFont: "jakarta",
  bodyFont: "jakarta",
  layout: "grid",
  cardStyle: "elevated",
  cardShadow: "sm",
  spacing: "cozy",
  buttonShape: "rounded",
  buttonFill: "solid",
  buttonShadow: true,
  headerStyle: "glass",
  headerSize: "compact",
  headerSticky: true,
  categoryStyle: "pills",
  animationLevel: "premium",
  showFloatingWhatsapp: true,
  showFloatingCall: true,
};

/** Deep-merge a partial config (from DB) onto the defaults. */
export function mergeTheme(partial: Partial<ThemeConfig> | null | undefined): ThemeConfig {
  if (!partial) return DEFAULT_THEME;
  return {
    ...DEFAULT_THEME,
    ...partial,
    light: { ...DEFAULT_THEME.light, ...(partial.light ?? {}) },
    dark: { ...DEFAULT_THEME.dark, ...(partial.dark ?? {}) },
  };
}

/** Whether motion should run at all. */
export function motionEnabled(config: ThemeConfig): boolean {
  return config.animationLevel !== "none";
}

function paletteToVars(p: ThemePalette): string {
  return [
    `--background:${p.background}`,
    `--foreground:${p.foreground}`,
    `--surface:${p.surface}`,
    `--card:${p.card}`,
    `--card-foreground:${p.cardForeground}`,
    `--popover:${p.card}`,
    `--popover-foreground:${p.cardForeground}`,
    `--header:${p.header}`,
    `--footer:${p.footer}`,
    `--primary:${p.primary}`,
    `--primary-foreground:${p.primaryForeground}`,
    `--secondary:${p.secondary}`,
    `--secondary-foreground:${p.secondaryForeground}`,
    `--accent:${p.accent}`,
    `--accent-foreground:${p.accentForeground}`,
    `--muted:${p.muted}`,
    `--muted-foreground:${p.mutedForeground}`,
    `--border:${p.border}`,
    `--input:${p.border}`,
    `--ring:${p.primary}`,
  ].join(";");
}

const GAP: Record<Spacing, string> = { compact: "1.6rem", cozy: "2.5rem", comfortable: "3.5rem" };
const CARD_PAD: Record<Spacing, string> = {
  compact: "0.65rem",
  cozy: "0.85rem",
  comfortable: "1.15rem",
};
const BTN_RADIUS: Record<ButtonShape, string> = {
  rounded: "var(--radius)",
  pill: "999px",
  square: "0.15rem",
};

/** Build the CSS string that overrides the design tokens. */
export function themeToCss(config: ThemeConfig): string {
  const common = [
    `--radius:${config.radius}rem`,
    `--font-heading:${FONT_STACKS[config.headingFont]}`,
    `--font-body:${FONT_STACKS[config.bodyFont]}`,
    `--body-weight:${config.fontWeight}`,
    `--body-leading:${config.lineHeight}`,
    `--card-shadow:${SHADOW_PRESETS[config.cardShadow]}`,
    `--menu-gap:${GAP[config.spacing]}`,
    `--card-pad:${CARD_PAD[config.spacing]}`,
    `--btn-radius:${BTN_RADIUS[config.buttonShape]}`,
  ].join(";");

  return `:root{${paletteToVars(config.light)};${common}}
.dark{${paletteToVars(config.dark)}}
html{font-size:${16 * config.fontScale}px}
body{font-weight:var(--body-weight);line-height:var(--body-leading)}`;
}

/** Inject / update the runtime theme style tag + data attributes (client only). */
export function applyTheme(config: ThemeConfig): void {
  if (typeof document === "undefined") return;
  let tag = document.getElementById("theme-vars") as HTMLStyleElement | null;
  if (!tag) {
    tag = document.createElement("style");
    tag.id = "theme-vars";
    document.head.appendChild(tag);
  }
  tag.textContent = themeToCss(config);

  const root = document.documentElement;
  root.dataset.anim = config.animationLevel;
  root.dataset.card = config.cardStyle;
  root.dataset.btnFill = config.buttonFill;
  root.dataset.btnShape = config.buttonShape;
  root.dataset.btnShadow = config.buttonShadow ? "1" : "0";
  root.dataset.cat = config.categoryStyle;
  root.dataset.header = config.headerStyle;
}
