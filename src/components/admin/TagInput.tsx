import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminT } from "@/lib/admin-i18n";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  className?: string;
}

/** Chip-style tag editor: type + Enter to add, click × to remove. */
export function TagInput({ value, onChange, className }: TagInputProps) {
  const t = useAdminT();
  const [draft, setDraft] = useState("");

  function add() {
    const clean = draft.trim();
    if (clean && !value.includes(clean)) onChange([...value, clean]);
    setDraft("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add();
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div
      className={cn(
        "flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-input bg-background px-2.5 py-2 text-sm",
        className,
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-secondary-foreground"
        >
          {tag}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== tag))}>
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={add}
        placeholder={t("tagsHint")}
        className="min-w-[8ch] flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
      />
    </div>
  );
}
