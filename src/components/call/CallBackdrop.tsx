export function CallBackdrop({ src, dark = false }: { src?: string | null | undefined; dark?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-call-dark">
      {src && (
        <img
          src={src}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover blur-2xl animate-call-drift"
        />
      )}
      <div className={dark ? "absolute inset-0 bg-call-black/70" : "absolute inset-0 bg-call-overlay"} />
    </div>
  );
}

export function Avatar({ src, name, size = 140 }: { src?: string | null | undefined; name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div
      className="relative overflow-hidden rounded-full bg-call-glass-strong"
      style={{ width: size, height: size }}
    >
      {src ? (
        <img src={src} alt={name} className="h-full w-full object-cover" draggable={false} />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-semibold" style={{ fontSize: size * 0.36 }}>
          {initials || "?"}
        </div>
      )}
    </div>
  );
}
