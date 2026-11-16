import type { IosChromePlayback } from "@/lib/iosChromeFix";
import type { ParsedVideo } from "@/lib/video";
import { ActiveCall } from "@/components/call/ActiveCall";
import { Avatar, CallBackdrop } from "@/components/call/CallBackdrop";
import { EndedScreen } from "@/components/call/EndedScreen";
import { IncomingCall } from "@/components/call/IncomingCall";
import { THEMES, resolveTheme } from "./index";
import { LoadingDots } from "./shared/CallStatus";
import { MessengerActive } from "./messenger/MessengerActive";
import { MessengerIncoming } from "./messenger/MessengerIncoming";
import { ThemeConnecting, ThemeEnded } from "./shared/Screens";
import { WhatsAppActive, type ThemedActiveProps } from "./whatsapp/WhatsAppActive";
import { WhatsAppIncoming } from "./whatsapp/WhatsAppIncoming";

/**
 * Picks the screens for a call's theme. Telegram keeps the original components and markup
 * untouched; the other themes reuse the same handlers through their own visuals.
 */

interface ScreensProps {
  theme: unknown;
  name: string;
  photo?: string | null | undefined;
  background?: string | null | undefined;
}

const telegramConnecting = (name: string, photo?: string | null, background?: string | null) => (
  <div className="absolute inset-0 animate-call-fade">
    <CallBackdrop src={background ?? photo} />
    <div className="relative flex h-full flex-col items-center justify-center">
      <Avatar src={photo} name={name} size={120} />
      <h1 className="mt-7 text-[26px] font-semibold">{name}</h1>
      <p className="mt-1.5 text-[16px] text-call-ink/70">Conectando...</p>
      <div className="mt-5"><LoadingDots className="bg-call-ink/60" /></div>
    </div>
  </div>
);

export function ThemedIncoming({ theme, name, photo, background, subtitle, onAccept, onDecline }: ScreensProps & {
  subtitle?: string; onAccept: () => void; onDecline: () => void;
}) {
  const id = resolveTheme(theme);
  if (id === "whatsapp") return <WhatsAppIncoming name={name} photo={photo} background={background} onAccept={onAccept} onDecline={onDecline} />;
  if (id === "messenger") return <MessengerIncoming name={name} photo={photo} background={background} onAccept={onAccept} onDecline={onDecline} />;
  return <IncomingCall name={name} photo={photo} background={background} subtitle={subtitle || "Chamada de vídeo"} onAccept={onAccept} onDecline={onDecline} />;
}

export function ThemedConnecting({ theme, name, photo, background }: ScreensProps) {
  const id = resolveTheme(theme);
  if (id === "telegram") return telegramConnecting(name, photo, background);
  return <ThemeConnecting theme={THEMES[id]} name={name} photo={photo} background={background} />;
}

export function ThemedActive({ theme, ...props }: { theme: unknown } & ThemedActiveProps) {
  const id = resolveTheme(theme);
  if (id === "whatsapp") return <WhatsAppActive {...props} />;
  if (id === "messenger") return <MessengerActive {...props} />;
  return <ActiveCall {...props} />;
}

export function ThemedEnded({ theme, name, photo, background, title, detail, actionLabel, onAction, variant = "close" }: ScreensProps & {
  title: string; detail?: string | undefined; actionLabel: string; onAction: () => void; variant?: "callback" | "close";
}) {
  const id = resolveTheme(theme);
  if (id === "telegram") {
    return <EndedScreen name={name} photo={photo} background={background} title={title} detail={detail} actionLabel={actionLabel} variant={variant} onAction={onAction} />;
  }
  return <ThemeEnded theme={THEMES[id]} name={name} photo={photo} background={background} title={title} detail={detail} actionLabel={actionLabel} variant={variant} onAction={onAction} />;
}

export type { IosChromePlayback, ParsedVideo };
