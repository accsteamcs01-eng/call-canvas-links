import type { ReactNode } from "react";
import { FlipIcon, MicIcon, PhoneDownIcon, SpeakerIcon, VideoIcon, VideoOffIcon } from "./CallIcons";

interface Props {
  visible: boolean;
  cameraOn: boolean;
  micOn: boolean;
  speakerOn: boolean;
  onToggleCamera: () => void;
  onFlip: () => void;
  onToggleMic: () => void;
  onToggleSpeaker: () => void;
  onEnd: () => void;
}

function CtrlButton({ active, label, onClick, children }: { active: boolean; label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="flex flex-col items-center gap-1.5"
    >
      <span
        className={`flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all duration-200 active:scale-90 ${
          active ? "bg-call-ink text-call-black" : "bg-call-glass-strong text-call-ink"
        }`}
      >
        {children}
      </span>
      <span className="text-[11px] text-call-ink/85">{label}</span>
    </button>
  );
}

export function CallControls(p: Props) {
  return (
    <div
      className={`absolute inset-x-0 bottom-0 z-30 px-3 pb-[calc(env(safe-area-inset-bottom)+14px)] transition-all duration-300 ${
        p.visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      }`}
    >
      <div className="mx-auto flex max-w-[400px] items-end justify-between rounded-[28px] bg-call-panel px-4 pb-3 pt-4 backdrop-blur-xl">
        <CtrlButton active={!p.cameraOn} label="Câmera" onClick={p.onToggleCamera}>
          {p.cameraOn ? <VideoIcon className="h-6 w-6" /> : <VideoOffIcon className="h-6 w-6" />}
        </CtrlButton>
        <CtrlButton active={false} label="Virar" onClick={p.onFlip}>
          <FlipIcon className="h-6 w-6" />
        </CtrlButton>
        <CtrlButton active={!p.micOn} label={p.micOn ? "Mudo" : "Desmutar"} onClick={p.onToggleMic}>
          <MicIcon off={!p.micOn} className="h-6 w-6" />
        </CtrlButton>
        <CtrlButton active={!p.speakerOn} label="Alto-falante" onClick={p.onToggleSpeaker}>
          <SpeakerIcon off={!p.speakerOn} className="h-6 w-6" />
        </CtrlButton>
        <button
          type="button"
          aria-label="Encerrar"
          onClick={(e) => {
            e.stopPropagation();
            p.onEnd();
          }}
          className="flex flex-col items-center gap-1.5"
        >
          <span className="flex h-[60px] w-[60px] items-center justify-center rounded-full bg-call-decline transition-transform duration-200 active:scale-90">
            <PhoneDownIcon className="h-8 w-8" />
          </span>
          <span className="text-[11px] text-call-ink/85">Encerrar</span>
        </button>
      </div>
    </div>
  );
}
