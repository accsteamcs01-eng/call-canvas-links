import { resolveTheme, type CallThemeId } from "@/themes";

const KEY = "callsim-call-defaults";
export interface CallDefaults { theme: CallThemeId; vibrate: boolean; fullscreen: boolean; unmute: boolean }
export const FACTORY_DEFAULTS: CallDefaults = { theme: "telegram", vibrate: true, fullscreen: true, unmute: true };

export function parseDefaults(raw: string | null): CallDefaults {
  try {
    const v = raw ? JSON.parse(raw) : {};
    const b = (x: unknown, d: boolean) => (typeof x === "boolean" ? x : d);
    return {
      theme: resolveTheme(v.theme),
      vibrate: b(v.vibrate, true),
      fullscreen: b(v.fullscreen, true),
      unmute: b(v.unmute, true),
    };
  } catch {
    return { ...FACTORY_DEFAULTS };
  }
}
export function loadDefaults(): CallDefaults {
  if (typeof window === "undefined") return { ...FACTORY_DEFAULTS };
  return parseDefaults(localStorage.getItem(KEY));
}
export function saveDefaults(d: CallDefaults) {
  localStorage.setItem(KEY, JSON.stringify(d));
}

function cell(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",;\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
/** CSV with ; separator and BOM so Excel (pt-BR) opens accents and columns correctly. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return "\uFEFF" + [headers, ...rows].map((r) => r.map(cell).join(";")).join("\r\n");
}

export function downloadCsv(csv: string, filename: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
