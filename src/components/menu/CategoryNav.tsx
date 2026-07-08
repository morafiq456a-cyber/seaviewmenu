import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import { mediaUrl } from "@/lib/media";
import type { Category } from "@/lib/queries";

interface Props {
  categories: Category[];
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function CategoryNav({ categories, activeId, onSelect }: Props) {
  const { pick } = useI18n();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Keep the active pill centered — scroll ONLY the horizontal pill strip,
  // never the window. Using element.scrollIntoView() here would scroll the
  // whole page vertically now that the nav is not sticky, causing upward jumps.
  useEffect(() => {
    const scroller = scrollerRef.current;
    const pill = activeRef.current;
    if (!scroller || !pill) return;
    const target = pill.offsetLeft - scroller.clientWidth / 2 + pill.clientWidth / 2;
    scroller.scrollTo({ left: target, behavior: "smooth" });
  }, [activeId]);

  if (!categories.length) return null;

  return (
    <div className="border-b border-border/60">
      <div
        ref={scrollerRef}
        className="mx-auto flex max-w-3xl gap-2 overflow-x-auto px-4 py-3 no-scrollbar"
      >
        {categories.map((cat) => {
          const active = cat.id === activeId;
          const img = mediaUrl(cat.image_url);
          return (
            <button
              key={cat.id}
              ref={active ? activeRef : undefined}
              onClick={() => onSelect(cat.id)}
              data-active={active}
              className={cn(
                "menu-chip press inline-flex shrink-0 items-center gap-2 px-3.5 py-2 text-sm font-bold",
                active ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {img ? (
                <img src={img} alt="" className="size-5 rounded-full object-cover" />
              ) : cat.icon ? (
                <span className="text-base leading-none">{cat.icon}</span>
              ) : null}
              {pick(cat, "name")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
