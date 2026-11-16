import { ChevronLeft, Lock, Mic, MicOff, MoreHorizontal, PhoneOff, Video, VideoOff, Volume2, VolumeX } from "lucide-react";
import type { ReactNode } from "react";
import { formatDuration } from "@/lib/calls";
import type { ParsedVideo } from "@/lib/video";
import type { IosChromePlayback } from "@/lib/iosChromeFix";
import { Avatar } from "@/components/call/CallBackdrop";
import { RemoteVideo } from "@/components/call/RemoteVideo";
import { SelfView } from "@/components/call/SelfView";
import { THEMES } from "../index";
import { ThemeBackdrop, UnmuteButton } from "../shared/Screens";
import { useActiveCall } from "../shared/useActiveCall";

const t = THEMES.whatsapp;

export interface ThemedActiveProps {
  name: string; photo?: string | null | undefined; background?: string | null | undefined;
  video: ParsedVideo; stream: MediaStream | null; showUnmuteButton: boolean;
  onFlipCamera: (facing: "user" | "environment") => Promise<MediaStream | null>;
  onEnd: (seconds: number) => void; iosPlayback?: IosChromePlayback | null; iosMutedFallback?: boolean;
}

function Btn({ label, onClick, active = false, className = "", children }: { label: string; onClick?: () => void; active?: boolean; className?: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} aria-pressed={active} onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`flex h-[52px] w-[52px] items-center justify-center rounded-full transition-transform active:scale-90 ${active ? "bg-call-ink text-call-black" : "bg-call-glass-strong"} ${className}`}>
      {children}
    </button>
  );
}

export function WhatsAppActive(p: ThemedActiveProps) {
  const s = useActiveCall(p);
  const show = s.controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none";
  return (
    <div className="absolute inset-0 bg-call-black animate-call-fade" onPointerDown={s.bumpControls}>
      {s.videoError ? (
        <>
          <ThemeBackdrop theme={t} src={p.background ?? p.photo} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Avatar src={p.photo} name={p.name} size={120} />
            <p className={`mt-5 text-[15px] ${t.colors.muted}`}>{t.texts.unstable}</p>
          </div>
        </>
      ) : (
        <RemoteVideo video={p.video} iosPlayback={p.iosPlayback ?? null} muted={!s.speakerOn} onEnded={s.finish} onAutoplayMuted={s.onAutoplayMuted} onError={s.onVideoError} />
      )}

      <div className={`absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-call-black/60 to-transparent px-3 pb-8 pt-[calc(env(safe-area-inset-top)+10px)] transition-opacity duration-300 ${show}`}>
        <div className="relative flex items-center justify-center">
          <ChevronLeft className="absolute left-0 h-7 w-7" />
          <div className="text-center">
            <h2 className="max-w-[220px] truncate text-[17px] font-semibold">{p.name}</h2>
            <p className="text-[13px] tabular-nums text-call-ink/85">{formatDuration(s.seconds)}</p>
          </div>
        </div>
        <p className={`mt-1 flex items-center justify-center gap-1 text-[11px] ${t.colors.muted}`}><Lock className="h-2.5 w-2.5" /> {t.texts.encrypted}</p>
      </div>

      <SelfView stream={s.stream} cameraOn={s.cameraOn} mirrored={s.facing === "user"} bottomInset={s.controlsVisible ? 128 : 24}
        iosPlayback={p.iosPlayback ?? null} defaultCorner={t.selfView.corner} topInset={t.selfView.topInset} frameClassName={t.radius.selfView} />

      {s.needsUnmute && <UnmuteButton theme={t} onClick={s.unmute} />}

      <div className={`absolute inset-x-0 bottom-0 z-30 ${t.radius.panel} ${t.colors.panel} px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+22px)] backdrop-blur-xl transition-all duration-300 ${s.controlsVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 pointer-events-none"}`}>
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-call-ink/30" />
        <div className="flex items-center justify-between">
          <Btn label="Mais opções"><MoreHorizontal className="h-6 w-6" /></Btn>
          <Btn label="Câmera" onClick={s.toggleCamera} active={!s.cameraOn}>{s.cameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}</Btn>
          <Btn label="Alto-falante" onClick={s.toggleSpeaker} active={!s.speakerOn}>{s.speakerOn ? <Volume2 className="h-6 w-6" /> : <VolumeX className="h-6 w-6" />}</Btn>
          <Btn label="Microfone" onClick={s.toggleMic} active={!s.micOn}>{s.micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}</Btn>
          <Btn label="Encerrar" onClick={s.finish} className={`!h-[60px] !w-[60px] ${t.colors.decline}`}><PhoneOff className="h-7 w-7" /></Btn>
        </div>
      </div>
    </div>
  );
}
