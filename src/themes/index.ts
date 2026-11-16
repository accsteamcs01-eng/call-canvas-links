/**
 * Visual call themes. Only the presentation layer changes per theme;
 * every handler (ring, accept, decline, end, camera, mic) is shared.
 * All labels shown on screen live here so they can be edited in one place.
 */
export const THEME_IDS = ["telegram", "whatsapp", "messenger"] as const;
export type CallThemeId = (typeof THEME_IDS)[number];

export interface CallTheme {
  id: CallThemeId;
  label: string;
  /** Tailwind classes using semantic tokens from styles.css */
  colors: { accept: string; decline: string; overlay: string; panel: string; muted: string };
  font: string;
  radius: { selfView: string; panel: string };
  selfView: { corner: "tl" | "tr" | "bl" | "br"; topInset: number };
  buttons: "round-labeled" | "round-floating";
  icons: "lucide";
  texts: {
    header: string;
    ringing: string;
    accept: string;
    decline: string;
    remind: string;
    message: string;
    connecting: string;
    encrypted: string;
    connected: string;
    declined: string;
    ended: string;
    callBack: string;
    close: string;
    unstable: string;
    unmute: string;
  };
}

const baseTexts = {
  connecting: "Conectando...",
  declined: "Chamada recusada",
  ended: "Chamada encerrada",
  callBack: "Ligar de volta",
  close: "Fechar",
  unstable: "Conexão instável…",
  unmute: "Toque para ativar o som",
};

export const THEMES: Record<CallThemeId, CallTheme> = {
  telegram: {
    id: "telegram",
    label: "Telegram",
    colors: { accept: "bg-call-accept", decline: "bg-call-decline", overlay: "bg-call-overlay", panel: "bg-call-panel", muted: "text-call-ink/70" },
    font: "font-call",
    radius: { selfView: "rounded-2xl", panel: "rounded-none" },
    selfView: { corner: "tr", topInset: 76 },
    buttons: "round-labeled",
    icons: "lucide",
    texts: { ...baseTexts, header: "Chamada de vídeo", ringing: "chamando...", accept: "Atender", decline: "Recusar", remind: "Lembrar depois", message: "Mensagem", encrypted: "", connected: "" },
  },
  whatsapp: {
    id: "whatsapp",
    label: "WhatsApp",
    colors: { accept: "bg-wa-accept", decline: "bg-wa-decline", overlay: "bg-wa-overlay", panel: "bg-wa-panel", muted: "text-wa-muted" },
    font: "font-call",
    radius: { selfView: "rounded-xl", panel: "rounded-t-[28px]" },
    selfView: { corner: "br", topInset: 96 },
    buttons: "round-labeled",
    icons: "lucide",
    texts: { ...baseTexts, header: "Chamada de vídeo do WhatsApp", ringing: "tocando...", accept: "Aceitar", decline: "Recusar", remind: "Lembrar", message: "Mensagem", encrypted: "Criptografada de ponta a ponta", connected: "" },
  },
  messenger: {
    id: "messenger",
    label: "Messenger",
    colors: { accept: "bg-ms-blue", decline: "bg-ms-decline", overlay: "bg-ms-gradient", panel: "bg-call-glass", muted: "text-call-ink/75" },
    font: "font-call",
    radius: { selfView: "rounded-2xl", panel: "rounded-full" },
    selfView: { corner: "tr", topInset: 88 },
    buttons: "round-floating",
    icons: "lucide",
    texts: { ...baseTexts, header: "Chamada de vídeo do Messenger", ringing: "", accept: "Atender", decline: "Recusar", remind: "", message: "", encrypted: "", connected: "Conectado" },
  },
};

/** Null, empty or unknown values always fall back to Telegram. */
export function resolveTheme(value: unknown): CallThemeId {
  return typeof value === "string" && (THEME_IDS as readonly string[]).includes(value) ? (value as CallThemeId) : "telegram";
}
