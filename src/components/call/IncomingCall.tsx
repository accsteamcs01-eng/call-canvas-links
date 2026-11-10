import { Avatar, CallBackdrop } from "./CallBackdrop";
import { ClockIcon, MessageIcon, PhoneDownIcon, VideoIcon } from "./CallIcons";

interface Props {
  name: string;
  photo?: string | null;
  background?: string | null;
  subtitle: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function IncomingCall({ name, photo, background, subtitle, onAccept, onDecline }: Props) {
  return (
    <div className="absolute inset-0 animate-call-fade">
      <CallBackdrop src={background ?? photo} />
      <div className="relative flex h-full flex-col items-center px-6 pt-[calc(env(safe-area-inset-top)+20px)] pb-[calc(env(safe-area-inset-bottom)+32px)]">
        <div className="flex items-center gap-1.5 text-[15px] text-call-ink/80">
          <VideoIcon className="h-4 w-4" />
          <span>{subtitle}</span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <span className="absolute h-[140px] w-[140px] rounded-full bg-call-glass animate-call-ring" />
            <span className="absolute h-[140px] w-[140px] rounded-full bg-call-glass animate-call-ring [animation-delay:0.8s]" />
            <span className="absolute h-[140px] w-[140px] rounded-full bg-call-glass animate-call-ring [animation-delay:1.6s]" />
            <Avatar src={photo} name={name} size={140} />
          </div>
          <h1 className="mt-9 max-w-full truncate text-center text-[30px] font-semibold leading-tight tracking-tight">
            {name}
          </h1>
          <p className="mt-1.5 text-[16px] text-call-ink/70">chamando...</p>
        </div>

        <div className="mb-8 flex w-full max-w-[320px] justify-between px-2 text-call-ink/85">
          <button type="button" className="flex flex-col items-center gap-1.5 transition-transform active:scale-90">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-call-glass backdrop-blur-md">
              <MessageIcon className="h-5 w-5" />
            </span>
            <span className="text-[12px]">Mensagem</span>
          </button>
          <button type="button" className="flex flex-col items-center gap-1.5 transition-transform active:scale-90">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-call-glass backdrop-blur-md">
              <ClockIcon className="h-5 w-5" />
            </span>
            <span className="text-[12px]">Lembrar depois</span>
          </button>
        </div>

        <div className="flex w-full max-w-[320px] items-start justify-between">
          <button
            type="button"
            onClick={onDecline}
            className="flex flex-col items-center gap-2.5 transition-transform duration-200 active:scale-90"
          >
            <span className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-call-decline">
              <PhoneDownIcon className="h-9 w-9" />
            </span>
            <span className="text-[14px] text-call-ink/90">Recusar</span>
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="flex flex-col items-center gap-2.5 transition-transform duration-200 active:scale-90"
          >
            <span className="relative flex h-[72px] w-[72px] items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-call-accept/50 animate-call-ring" />
              <span className="relative flex h-[72px] w-[72px] items-center justify-center rounded-full bg-call-accept">
                <VideoIcon className="h-8 w-8 animate-call-wiggle" />
              </span>
            </span>
            <span className="text-[14px] text-call-ink/90">Atender</span>
          </button>
        </div>
      </div>
    </div>
  );
}
