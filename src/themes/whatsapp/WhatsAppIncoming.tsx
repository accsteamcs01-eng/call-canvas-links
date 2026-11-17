import { Bell, Lock, MessageCircle, PhoneOff, Video } from "lucide-react";
import { Avatar } from "@/components/call/CallBackdrop";
import { THEMES } from "../index";
import { ThemeIcon } from "../ThemeIcon";
import { RoundAction, ThemeBackdrop } from "../shared/Screens";

const t = THEMES.whatsapp;

export function WhatsAppIncoming({ name, photo, background, onAccept, onDecline }: {
  name: string; photo?: string | null | undefined; background?: string | null | undefined; onAccept: () => void; onDecline: () => void;
}) {
  return (
    <div className="absolute inset-0 animate-call-fade">
      <ThemeBackdrop theme={t} src={background ?? photo} />
      <div className="relative flex h-full flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+28px)] pb-[calc(env(safe-area-inset-bottom)+36px)]">
        <div className={`flex items-center gap-1.5 text-[13px] ${t.colors.muted}`}>
          <ThemeIcon theme="whatsapp" className="h-5 w-5" />
          <Lock className="h-3 w-3" /> <span>{t.texts.header}</span>
        </div>
        <h1 className="mt-3 max-w-full truncate text-center text-[30px] font-normal leading-tight">{name}</h1>
        <p className={`mt-1 text-[16px] ${t.colors.muted}`}>{t.texts.ringing}</p>

        <div className="flex flex-1 items-center justify-center">
          <div className="animate-theme-pulse"><Avatar src={photo} name={name} size={150} /></div>
        </div>

        <div className="mb-10 flex w-full max-w-[300px] justify-between px-4">
          <RoundAction label={t.texts.remind} className="bg-call-glass backdrop-blur-md" size={44}><Bell className="h-5 w-5" /></RoundAction>
          <RoundAction label={t.texts.message} className="bg-call-glass backdrop-blur-md" size={44}><MessageCircle className="h-5 w-5" /></RoundAction>
        </div>
        <div className="flex w-full max-w-[300px] items-start justify-between">
          <RoundAction label={t.texts.decline} className={t.colors.decline} onClick={onDecline} size={72}><PhoneOff className="h-8 w-8" /></RoundAction>
          <RoundAction label={t.texts.accept} className={t.colors.accept} onClick={onAccept} size={72}><Video className="h-8 w-8" fill="currentColor" /></RoundAction>
        </div>
      </div>
    </div>
  );
}
