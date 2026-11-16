import { Avatar, CallBackdrop } from "./CallBackdrop";
import { PhoneIcon } from "./CallIcons";

interface Props {
  name: string;
  photo?: string | null | undefined;
  background?: string | null | undefined;
  title: string;
  detail?: string | undefined;
  actionLabel: string;
  onAction: () => void;
  variant?: "callback" | "close" | undefined;
}

/** Used for both "Chamada recusada" and "Chamada encerrada". */
export function EndedScreen({ name, photo, background, title, detail, actionLabel, onAction, variant = "close" }: Props) {
  return (
    <div className="absolute inset-0 animate-call-fade">
      <CallBackdrop src={background ?? photo} dark />
      <div className="relative flex h-full flex-col items-center justify-center px-6 pb-[env(safe-area-inset-bottom)]">
        <div className="flex flex-1 flex-col items-center justify-center">
          <Avatar src={photo} name={name} size={120} />
          <h1 className="mt-7 max-w-full truncate text-[26px] font-semibold">{name}</h1>
          <p className="mt-1.5 text-[16px] text-call-ink/70">{title}</p>
          {detail && <p className="mt-1 font-mono text-[15px] tabular-nums text-call-ink/60">{detail}</p>}
        </div>
        <div className="mb-14 flex flex-col items-center gap-2.5">
          {variant === "callback" ? (
            <button type="button" onClick={onAction} className="flex flex-col items-center gap-2.5 transition-transform active:scale-90">
              <span className="flex h-[68px] w-[68px] items-center justify-center rounded-full bg-call-accept">
                <PhoneIcon className="h-8 w-8" />
              </span>
              <span className="text-[14px] text-call-ink/90">{actionLabel}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="rounded-full bg-call-glass-strong px-10 py-3 text-[16px] font-medium backdrop-blur-md transition-transform active:scale-95"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
