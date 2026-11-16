import { Mic, MicOff, PhoneOff, Sparkles, SwitchCamera, Video, VideoOff } from "lucide-react";
import type { ReactNode } from "react";
import { formatDuration } from "@/lib/calls";
import { Avatar } from "@/components/call/CallBackdrop";
import { RemoteVideo } from "@/components/call/RemoteVideo";
import { SelfView } from "@/components/call/SelfView";
import { THEMES } from "../index";
import { CallBuffering, RetryButton } from "../shared/CallStatus";
import { ThemeBackdrop, UnmuteButton } from "../shared/Screens";
import { useActiveCall } from "../shared/useActiveCall";
import type { ThemedActiveProps } from "../whatsapp/WhatsAppActive";

const t = THEMES.messenger;

function Btn({ label, onClick, active = false, className = "", children }: { label: string; onClick?: () => void; active?: boolean; className?: string; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} aria-pressed={active} onClick={(e) => { e.stopPropagation(); onClick?.(); }}
      className={`flex h-[50px] w-[50px] items-center justify-center rounded-full backdrop-blur-md transition-transform active:scale-90 ${active ? "bg-call-ink text-call-black" : "bg-call-glass-strong"} ${className}`}>
      {children}
    </button>
  );
}

export function MessengerActive(p: ThemedActiveProps) {
  const s = useActiveCall(p);
  const show = s.controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none";
  return (
    <div className="absolute inset-0 bg-call-black font-medium animate-call-fade" onPointerDown={s.bumpControls}>
      {s.videoError ? (
        <>
          <ThemeBackdrop theme={t} src={p.background ?? p.photo} animated />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Avatar src={p.photo} name={p.name} size={120} />
            <p className={`mt-5 text-[15px] ${t.colors.muted}`}>{t.texts.unstable}</p>
            <RetryButton onClick={s.retryVideo} />
          </div>
        </>
      ) : (
        <>
          {/* The blurred cover stands in for the video's first frame, so the wait is never black. */}
          <ThemeBackdrop theme={t} src={p.background ?? p.photo} animated />
          <RemoteVideo key={s.reloadKey} video={p.video} iosPlayback={p.iosPlayback ?? null} muted={!s.speakerOn} onEnded={s.finish} onAutoplayMuted={s.onAutoplayMuted} onError={s.onVideoError} onBufferingChange={s.setBuffering} />
          {s.buffering && <CallBuffering theme={t} />}
        </>
      )}

      <div className={`absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-call-black/60 to-transparent px-4 pb-10 pt-[calc(env(safe-area-inset-top)+14px)] transition-opacity duration-300 ${show}`}>
        <h2 className="max-w-[60%] truncate text-[19px] font-semibold">{p.name}</h2>
        <div className="mt-0.5 flex items-center gap-2 text-[13px] text-call-ink/85">
          <span className="tabular-nums">{formatDuration(s.seconds)}</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-ms-green" />{t.texts.connected}</span>
        </div>
      </div>

      <SelfView stream={s.stream} cameraOn={s.cameraOn} mirrored={s.facing === "user"} bottomInset={s.controlsVisible ? 120 : 24}
        iosPlayback={p.iosPlayback ?? null} defaultCorner={t.selfView.corner} topInset={t.selfView.topInset} frameClassName={t.radius.selfView} />

      {s.needsUnmute && <UnmuteButton theme={t} onClick={s.unmute} />}

      <div className={`absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+24px)] z-30 flex justify-center transition-all duration-300 ${s.controlsVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0 pointer-events-none"}`}>
        <div className={`flex items-center gap-3 ${t.radius.panel} bg-call-black/35 px-3 py-2.5 backdrop-blur-xl`}>
          <Btn label="Câmera" onClick={s.toggleCamera} active={!s.cameraOn}>{s.cameraOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}</Btn>
          <Btn label="Virar câmera" onClick={s.flip}><SwitchCamera className="h-6 w-6" /></Btn>
          <Btn label="Microfone" onClick={s.toggleMic} active={!s.micOn}>{s.micOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}</Btn>
          <Btn label="Efeitos"><Sparkles className="h-6 w-6" /></Btn>
          <Btn label="Encerrar" onClick={s.finish} className={t.colors.decline}><PhoneOff className="h-6 w-6" /></Btn>
        </div>
      </div>
    </div>
  );
}
