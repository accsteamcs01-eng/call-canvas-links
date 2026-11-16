import { PhoneOff, Video } from "lucide-react";
import { Avatar } from "@/components/call/CallBackdrop";
import { THEMES } from "../index";
import { RoundAction, ThemeBackdrop } from "../shared/Screens";

const t = THEMES.messenger;

export function MessengerIncoming({ name, photo, background, onAccept, onDecline }: {
  name: string; photo?: string | null | undefined; background?: string | null | undefined; onAccept: () => void; onDecline: () => void;
}) {
  return (
    <div className="absolute inset-0 animate-call-fade">
      <ThemeBackdrop theme={t} src={background ?? photo} animated />
      <div className="relative flex h-full flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+44px)]">
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <span className="absolute h-[150px] w-[150px] rounded-full border-2 border-call-ink/60 animate-call-ring" />
            <span className="absolute h-[150px] w-[150px] rounded-full border-2 border-call-ink/40 animate-call-ring [animation-delay:0.8s]" />
            <span className="absolute h-[150px] w-[150px] rounded-full border-2 border-call-ink/30 animate-call-ring [animation-delay:1.6s]" />
            <Avatar src={photo} name={name} size={150} />
          </div>
          <h1 className="mt-10 max-w-full truncate text-center text-[30px] font-semibold leading-tight">{name}</h1>
          <p className="mt-1.5 text-[15px] text-call-ink/75">{t.texts.header}</p>
        </div>
        <div className="flex w-full max-w-[280px] items-start justify-between">
          <RoundAction label={t.texts.decline} className={t.colors.decline} onClick={onDecline} size={70}><PhoneOff className="h-8 w-8" /></RoundAction>
          <div className="animate-theme-pulse">
            <RoundAction label={t.texts.accept} className={t.colors.accept} onClick={onAccept} size={70}><Video className="h-8 w-8" fill="currentColor" /></RoundAction>
          </div>
        </div>
      </div>
    </div>
  );
}
