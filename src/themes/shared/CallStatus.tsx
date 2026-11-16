import type { CallTheme } from "../index";

/** Three soft dots; the shared loading visual for every call theme. */
export function LoadingDots({ className = "bg-call-ink/80" }: { className?: string }) {
  return (
    <span className="flex items-center gap-1.5" role="status" aria-label="Carregando">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full animate-call-dots ${className}`}
          style={{ animationDelay: `${i * 0.18}s` }}
        />
      ))}
    </span>
  );
}

/**
 * Discrete centered indicator shown while the video buffers. It is pointer-events-none
 * and sits below the self view and the controls, so the call stays fully usable.
 */
export function CallBuffering({ theme }: { theme?: CallTheme }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
      role="status"
      aria-label="Carregando vídeo"
    >
      <div className={`absolute left-1/2 top-[32%] flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full ${theme ? theme.colors.panel : "bg-call-panel"} px-4 py-2.5 backdrop-blur-md`}>
        <LoadingDots />
      </div>
    </div>
  );
}

/** Shown instead of a black screen when the video cannot be loaded. */
export function RetryButton({ onClick, label = "Tentar novamente" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="mt-6 rounded-full bg-call-glass-strong px-8 py-3 text-[15px] font-medium backdrop-blur-md transition-transform active:scale-95"
    >
      {label}
    </button>
  );
}
