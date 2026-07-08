# Almaz — Premium Digital Restaurant Menu

A production‑grade, fully bilingual (Arabic / English) digital menu and admin
dashboard for a single restaurant. Every piece of content — branding, colors,
categories, products, offers, contact details and the entire theme — is editable
from the admin dashboard, with **no hardcoded content**. The project is designed
to be **duplicated and resold** per restaurant.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Installation](#installation)
5. [Environment Variables](#environment-variables)
6. [Backend / Supabase Setup](#backend--supabase-setup)
7. [Database Schema](#database-schema)
8. [Storage Buckets](#storage-buckets)
9. [Deployment](#deployment)
10. [Duplicating for a New Restaurant](#duplicating-for-a-new-restaurant)
11. [Backup & Restore](#backup--restore)
12. [Import & Export](#import--export)
13. [Folder Structure](#folder-structure)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

Almaz is a mobile‑first, RTL/LTR aware digital menu. Customers browse a polished,
animated menu with categories, product details, galleries, offers and one‑tap
contact actions (call / WhatsApp / directions). Restaurant owners manage
everything through a protected admin dashboard, including a live visual theme
builder, drag‑and‑drop ordering, image cropping, bulk actions, QR export and
full data import/export.

- **One restaurant per deployment** (not multi‑tenant SaaS).
- **Arabic is the default language**; every content field is stored as an
  `*_ar` / `*_en` pair.
- **First registered user automatically becomes the admin** via the
  `claim_admin()` database function; subsequent signups have no privileges.

---

## Features

**Customer menu**
- Bilingual AR/EN with full RTL/LTR switching and dark / light mode.
- Hero section, announcement bar, offers carousel, category navigation.
- Product cards with badges (best‑seller, new, spicy, vegetarian, discount).
- Product modal: image gallery + lightbox, nutrition, allergens, tags, related
  items, deep‑linking (`?item=<id>`), copy‑link and native share.
- Instant search, sticky category nav, back‑to‑top, floating contact actions.
- Skeleton loading states and premium motion (configurable).

**Admin dashboard** (`/admin`)
- Categories, products, offers CRUD with validation and toast notifications.
- Drag‑and‑drop sorting for categories and products; move products between
  categories.
- Product gallery editor (multi‑image, reorder, cover selection, replace).
- Image cropper (crop / zoom / rotate) for logos, covers and product images.
- Bulk actions: show/hide, feature, best‑seller, re‑categorize, bulk discount,
  delete, duplicate.
- **Visual Theme Builder**: colors, typography, card/button styles, layout and
  motion — applied live via CSS variables and `data-*` attributes.
- Restaurant settings: branding, contact, working hours, currency formatting,
  localization, timezone, maintenance mode.
- Social links manager.
- QR code generator (PNG / SVG / PDF, custom colors + logo).
- Import / Export of the full configuration as a single JSON file.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Framework | TanStack Start v1 (React 19, SSR + server functions) |
| Build tool | Vite 7 (Lightning CSS) |
| Styling | Tailwind CSS v4 (CSS‑first, tokens in `src/styles.css`) |
| UI primitives | shadcn/ui (Radix UI) |
| Data layer | TanStack Query |
| Backend | Supabase (Postgres, Auth, Storage, RLS) |
| Drag & drop | `@dnd-kit` |
| Animation | Framer Motion |
| Images | `browser-image-compression`, `react-easy-crop` |
| QR / export | `qrcode.react`, `jspdf`, `html2canvas` |
| Deploy target | Cloudflare Workers (via Nitro) — see [Deployment](#deployment) |

---

## Installation

Requirements: **Node 18+** (or Bun) and a Supabase project.

```bash
# install dependencies
bun install          # or: npm install

# copy env template and fill in values (see below)
cp .env.example .env

# start the dev server (http://localhost:8080)
bun run dev          # or: npm run dev
```

Scripts:

| Script | Purpose |
| --- | --- |
| `dev` | Start the Vite dev server |
| `build` | Production build |
| `build:dev` | Development‑mode build (prerender) |
| `preview` | Preview the production build locally |
| `lint` | Run ESLint |
| `format` | Run Prettier |

---

## Environment Variables

Client‑visible variables are prefixed with `VITE_` (injected at build time).
Server‑only variables are read via `process.env` inside server functions / routes
and **must never** be exposed to the browser.

Create a `.env` file:

```dotenv
# --- Client (safe to expose) ---
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-anon-key>
VITE_SUPABASE_PROJECT_ID=<project-ref>

# --- Server only (used by server functions / API routes) ---
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_PUBLISHABLE_KEY=<publishable-anon-key>   # image proxy + public SSR reads
# SUPABASE_SERVICE_ROLE_KEY=<service-role-key>    # optional; privileged ops only, bypasses RLS
```

> On Lovable Cloud these values are provisioned automatically. When self‑hosting
> or deploying elsewhere (e.g. **Vercel**), set the same variables in your hosting
> provider's environment settings. The media proxy route reads the storage bucket
> with the **publishable (anon) key only** — the `menu-media` bucket has a public
> `SELECT` policy — so images work on any host **without** the service‑role key.
> The `SUPABASE_SERVICE_ROLE_KEY` is optional and only needed for privileged
> admin/maintenance operations; on Lovable Cloud it is managed for you and is not
> retrievable for external hosts.

---

## Backend / Supabase Setup

1. Create a Supabase project.
2. Apply the migrations in `supabase/migrations/` (in filename order) using the
   Supabase CLI (`supabase db push`) or your migration workflow. They create all
   tables, enums, functions, RLS policies and grants.
3. Create the private storage bucket `menu-media` (see
   [Storage Buckets](#storage-buckets)).
4. Enable Email/Password auth. The **first** account that signs up becomes the
   admin automatically (`claim_admin()`); no manual role assignment is needed.

**Security model**
- Every content table has RLS enabled: public `SELECT`, and `INSERT/UPDATE/DELETE`
  restricted to admins via the `is_admin()` security‑definer function.
- Roles live in a dedicated `user_roles` table (never on a profile), checked with
  `has_role(user_id, role)` to avoid RLS recursion and privilege escalation.
- The `menu-media` bucket is private and served through a read‑only public proxy
  route, so only image bytes are exposed — never write access.

---

## Database Schema

Enums: `app_role` = `admin`; `offer_type` = `announcement | hero | discount | offer`.

| Table | Key columns |
| --- | --- |
| `categories` | `id, name_ar, name_en, icon, image_url, color, sort_order, is_hidden, timestamps` |
| `products` | `id, category_id → categories (ON DELETE SET NULL), name_*, description_*, ingredients_*, allergens_*, notes_*, price, old_price, discount, currency, calories, prep_time, images (jsonb), cover_index, tags (jsonb), is_featured, is_best_seller, is_new, is_spicy, is_vegetarian, is_available, is_hidden, sort_order, timestamps` |
| `offers` | `id, type (offer_type), title_*, subtitle_*, image_url, link, start_date, end_date, is_active, sort_order, timestamps` |
| `restaurant_settings` | singleton row: `name_*, description_*, phone, whatsapp, email, address_*, google_maps_url, working_hours (jsonb), currency, currency_position, decimal_places, timezone, logo_url, cover_url, favicon_url, og_image_url, default_language, maintenance_mode, maintenance_message_*, timestamps` |
| `social_links` | singleton row: `facebook, instagram, tiktok, snapchat, threads, x, youtube, website` |
| `theme_settings` | singleton row: `config (jsonb)` — the full theme builder state |
| `user_roles` | `id, user_id → auth.users (ON DELETE CASCADE), role (app_role), unique(user_id, role)` |

Indexes: primary keys on all tables, plus `idx_categories_sort`,
`idx_products_sort`, `idx_products_category`, and a unique
`(user_id, role)` on `user_roles`.

Functions: `is_admin()`, `has_role(uuid, app_role)`, `claim_admin()`,
`update_updated_at_column()`.

---

## Storage Buckets

| Bucket | Visibility | Purpose |
| --- | --- | --- |
| `menu-media` | **Private** | Logos, covers, product & offer images |

Uploads are compressed to WebP client‑side and stored under bare paths
(e.g. `products/<uuid>.webp`). The bucket is private but has a public `SELECT`
policy, so images are served through the read‑only proxy route
`GET /api/public/media/<path>`, which streams the object using the
**publishable (anon) key** (no service‑role key required — this is what makes
image serving portable to Vercel and other hosts). Never store sensitive files
here — any object in this bucket is readable through the proxy.

---

## Deployment

The project builds to a **Cloudflare Workers** bundle via Nitro (`bun run build`
produces `dist/`). It is normally published directly from Lovable (frontend
changes go live via **Publish → Update**; backend/migrations deploy immediately).

### GitHub
1. Connect the project to a GitHub repository (Lovable → Git sync, or push the
   exported code).
2. Ensure `.env` is **not** committed (it is git‑ignored); configure secrets in
   the hosting provider instead.

### Vercel
TanStack Start can target Vercel through its Nitro preset:
1. Import the GitHub repo into Vercel.
2. Set **Build Command** `bun run build` (or `npm run build`) and framework
   preset **Other**.
3. Add the environment variables from
   [Environment Variables](#environment-variables) in
   Vercel → Project → Settings → Environment Variables (both client `VITE_*` and
   server‑only keys).
4. Deploy. If you need the Vercel Nitro output specifically, set
   `server.preset` to `vercel` in the Nitro config before building.

> Whichever host you choose, set all four server variables and the three
> `VITE_*` client variables, then trigger a fresh build so Vite inlines the
> client values.

---

## Duplicating for a New Restaurant

To resell to a new restaurant:

1. **Clone the codebase** (new repo or Lovable Remix).
2. **Create a fresh Supabase project** and apply the migrations.
3. **Set the new environment variables** for that project.
4. **Deploy**, then open the app and **register the first account** — it becomes
   the admin automatically.
5. In the admin dashboard, fill in restaurant settings, upload branding, and add
   categories/products — or import a template (below).
6. Customize colors/typography in the **Theme Builder** and generate the table QR
   codes.

No code changes are required per restaurant — everything is data + theme driven.

---

## Backup & Restore

Use **Admin → Import / Export** to download a single JSON file containing
restaurant settings, social links, categories, products, offers and the active
theme. Store this file as a backup. To restore, import the same file into a
fresh (or existing) deployment.

For full database backups, use Supabase's native backup/export tooling
(point‑in‑time recovery or `pg_dump` on self‑hosted projects).

---

## Import & Export

The Import/Export page (`/admin/import-export`) lets you:
- **Export** the whole configuration as versioned JSON (great for creating a
  reusable "starter template" for new customers).
- **Import** a previously exported file to seed or overwrite content.

Media referenced by storage path is preserved as long as the target project uses
the same bucket contents; otherwise re‑upload images after import.

---

## Folder Structure

```
src/
├─ assets/seed/            # seed images (asset manifests)
├─ components/
│  ├─ admin/               # admin-only widgets (uploader, cropper, sortable, gallery…)
│  ├─ menu/                # customer menu components (hero, cards, modal, nav…)
│  └─ ui/                  # shadcn/ui primitives (only the ones in use)
├─ hooks/                  # shared React hooks (auth/session)
├─ integrations/supabase/  # generated Supabase clients, types, middleware
├─ lib/                    # queries, i18n, theme config, media, backup, utils
├─ routes/
│  ├─ __root.tsx           # root shell (html/head/body, providers, metadata)
│  ├─ index.tsx            # public customer menu (home)
│  ├─ auth.tsx             # sign in / register
│  ├─ _authenticated/      # protected admin subtree (route gate + admin pages)
│  └─ api/public/media/    # read-only image proxy for the private bucket
├─ router.tsx, server.ts, start.ts   # framework entry points
└─ styles.css              # Tailwind v4 + design tokens
supabase/migrations/       # database schema migrations
```

---

## Troubleshooting

| Symptom | Cause / Fix |
| --- | --- |
| "Missing Supabase environment variable(s)" | One of the `VITE_SUPABASE_*` / `SUPABASE_*` vars is not set. Add them and rebuild. |
| Can't reach admin / redirected to `/auth` | You're not signed in. The `_authenticated` subtree redirects unauthenticated users to `/auth`. |
| Signed in but no admin access | Only the **first** registered user becomes admin. Use that account, or grant `admin` in `user_roles` for another user. |
| Images don't load | Confirm the `menu-media` bucket exists and the media proxy route is deployed; check the stored path is correct. |
| 404 on refresh of a deep link | Ensure the route file exists under `src/routes/` and the build succeeded. Do not edit `src/routeTree.gen.ts` by hand. |
| Permission denied on a table query | RLS grant missing or you're writing without admin. Verify migrations ran fully (tables need `GRANT` + policies). |
| Theme changes don't apply | The theme is stored in `theme_settings.config` and applied at runtime; hard‑refresh to clear cached CSS variables. |

---

Built as a premium, resellable commercial product. Arabic‑first, fully themeable,
and production‑ready.
