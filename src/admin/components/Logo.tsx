import { BRAND_NAME } from "../brand";

export function LogoIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="16" className="fill-admin-blue" />
      <rect x="7.5" y="11" width="12" height="10" rx="2.5" className="fill-admin-white" />
      <path d="M20.5 14.5l4-2.5v8l-4-2.5z" className="fill-admin-white" />
      <circle cx="25" cy="7" r="4" className="fill-admin-green stroke-admin-white" strokeWidth="1.5" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoIcon />
      <span className="text-[17px] font-semibold tracking-tight">{BRAND_NAME}</span>
    </span>
  );
}
