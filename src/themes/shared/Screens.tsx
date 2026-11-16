import type { ReactNode } from "react";
import { Phone, Volume2 } from "lucide-react";
import { Avatar } from "@/components/call/CallBackdrop";
import type { CallTheme } from "../index";

/** Blurred photo backdrop tinted with the theme overlay. */
export function ThemeBackdrop({ theme, src, animated = false }: { theme: CallTheme; src?: string | null | undefined; animated?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-call-dark">
      {src && <img src={src} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-3xl" />}
      <div className={`absolute inset-0 ${theme.colors.overlay} ${animated ? "animate-ms-shift" : ""}`} />
    </div>
  );
}

export function RoundAction({ label, className, onClick, children, size = 68 }: { label: string; className: string; onClick?: () => void; children: ReactNode; size?: number }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick?.(); }} className="flex flex-col items-center gap-2 transition-transform active:scale-90" aria-label={label}>
      <span className={`flex items-center justify-center rounded-full ${className}`} style={{ width: size, height: size }}>{children}</span>
      {label && <span className="text-[13px] text-call-ink/90">{label}</span>}
    </button>
  );
}

interface CommonProps { theme: CallTheme; name: string; photo?: string | null | undefined; background?: string | null | undefined }

export function ThemeConnecting({ theme, name, photo, background }: CommonProps) {
  return (
    <div className="absolute inset-0 animate-call-fade">
      <ThemeBackdrop theme={theme} src={background ?? photo} animated={theme.id === "messenger"} />
      <div className="relative flex h-full flex-col items-center justify-center">
        <Avatar src={photo} name={name} size={120} />
        <h1 className="mt-7 text-[26px] font-semibold">{name}</h1>
        <p className={`mt-1.5 text-[16px] ${theme.colors.muted}`}>{theme.texts.connecting}</p>
      </div>
    </div>
  );
}

export function ThemeEnded({ theme, name, photo, background, title, detail, actionLabel, onAction, variant = "close" }: CommonProps & {
  title: string; detail?: string | undefined; actionLabel: string; onAction: () => void; variant?: "callback" | "close";
}) {
  return (
    <div className="absolute inset-0 animate-call-fade">
      <ThemeBackdrop theme={theme} src={background ?? photo} />
      <div className="relative flex h-full flex-col items-center px-6 pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-1 flex-col items-center justify-center">
          <Avatar src={photo} name={name} size={120} />
          <h1 className="mt-7 max-w-full truncate text-[26px] font-semibold">{name}</h1>
          <p className={`mt-1.5 text-[16px] ${theme.colors.muted}`}>{title}</p>
          {detail && <p className={`mt-1 text-[15px] tabular-nums ${theme.colors.muted}`}>{detail}</p>}
        </div>
        <div className="mb-14">
          {variant === "callback" ? (
            <RoundAction label={actionLabel} className={theme.colors.accept} onClick={onAction}><Phone className="h-7 w-7" fill="currentColor" /></RoundAction>
          ) : (
            <button type="button" onClick={onAction} className="rounded-full bg-call-glass-strong px-10 py-3 text-[16px] font-medium backdrop-blur-md transition-transform active:scale-95">{actionLabel}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function UnmuteButton({ theme, onClick }: { theme: CallTheme; onClick: () => void }) {
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); onClick(); }}
      className={`absolute left-1/2 top-1/2 z-40 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full ${theme.colors.panel} px-5 py-3 text-[15px] font-medium backdrop-blur-xl active:scale-95`}>
      <Volume2 className="h-5 w-5" /> {theme.texts.unmute}
    </button>
  );
}
