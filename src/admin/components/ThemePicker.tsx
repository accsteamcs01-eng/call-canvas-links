import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { THEMES, THEME_IDS, type CallThemeId } from "@/themes";

const DOT: Record<CallThemeId, string> = {
  telegram: "bg-call-accept",
  whatsapp: "bg-wa-accept",
  messenger: "bg-ms-blue",
};

/** Three tappable cards, each a miniature of the incoming-call screen in that theme. */
export function ThemePicker({
  value,
  onChange,
}: {
  value: CallThemeId;
  onChange: (t: CallThemeId) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {THEME_IDS.map((id) => {
        const t = THEMES[id];
        const active = value === id;
        return (
          <Button
            variant="ghost"
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            className={`h-auto flex-col items-stretch whitespace-normal rounded-lg border p-2 text-left transition-colors ${active ? "border-primary bg-accent" : "hover:bg-muted"}`}
          >
            <div className="relative h-24 overflow-hidden rounded-lg bg-call-dark">
              <div className={`absolute inset-0 ${t.colors.overlay}`} />
              <span className="absolute left-1/2 top-3 h-9 w-9 -translate-x-1/2 rounded-full bg-call-ink/20 ring-2 ring-call-ink/35" />
              <span className="absolute left-1/2 top-[52px] h-1 w-10 -translate-x-1/2 rounded-full bg-call-ink/25" />
              <div className="absolute inset-x-3 bottom-2 flex items-center justify-between">
                <span className={`h-5 w-5 rounded-full ${t.colors.decline}`} />
                <span className={`h-6 w-6 rounded-full ${t.colors.accept}`} />
              </div>
            </div>
            <div className="mt-1.5 flex items-center gap-1">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[id]}`} />
              <span className="truncate text-xs font-medium">{t.label}</span>
              {active && <Check className="ml-auto h-3.5 w-3.5 shrink-0 text-primary" />}
            </div>
          </Button>
        );
      })}
    </div>
  );
}
