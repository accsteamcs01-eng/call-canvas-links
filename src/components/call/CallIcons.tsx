import type { SVGProps } from "react";

// Telegram-like rounded icons
export function PhoneDownIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 8.5c-3.1 0-6 .9-8.4 2.6-.7.5-1.1 1.3-1.1 2.2v1.9c0 .9.8 1.6 1.7 1.5l3.1-.4c.8-.1 1.4-.8 1.4-1.6v-1.6c1-.4 2.1-.6 3.3-.6s2.3.2 3.3.6v1.6c0 .8.6 1.5 1.4 1.6l3.1.4c.9.1 1.7-.6 1.7-1.5v-1.9c0-.9-.4-1.7-1.1-2.2C18 9.4 15.1 8.5 12 8.5Z" />
    </svg>
  );
}
export function PhoneIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z" />
    </svg>
  );
}
export function VideoIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M4.5 6h9A2.5 2.5 0 0 1 16 8.5v7a2.5 2.5 0 0 1-2.5 2.5h-9A2.5 2.5 0 0 1 2 15.5v-7A2.5 2.5 0 0 1 4.5 6Zm12.5 4.2 3.4-2.3c.7-.5 1.6 0 1.6.8v6.6c0 .8-.9 1.3-1.6.8L17 13.8v-3.6Z" />
    </svg>
  );
}
export function VideoOffIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}>
      <path d="M16 10.5 21 7v10l-5-3.5M14 18H5a2.5 2.5 0 0 1-2.5-2.5v-7A2.5 2.5 0 0 1 5 6h1m4 0h3.5A2.5 2.5 0 0 1 16 8.5V12" />
      <path d="m3 3 18 18" />
    </svg>
  );
}
export function FlipIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M20 8V6a2 2 0 0 0-2-2h-2.5l-1.5-2h-4L8.5 4H6a2 2 0 0 0-2 2v2" />
      <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      <path d="M8 12a4 4 0 0 1 7-2.6M16 12a4 4 0 0 1-7 2.6" />
      <path d="M15 7v2.5h-2.5M9 17v-2.5h2.5" />
    </svg>
  );
}
export function MicIcon({ off, ...p }: SVGProps<SVGSVGElement> & { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}>
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" stroke="none" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21" />
      {off && <path d="m4 4 16 16" strokeWidth={2.4} />}
    </svg>
  );
}
export function SpeakerIcon({ off, ...p }: SVGProps<SVGSVGElement> & { off?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}>
      <path d="M4 9.5h3l4.5-4v13L7 14.5H4z" fill="currentColor" stroke="none" />
      {off ? (
        <path d="m16 9.5 5 5m0-5-5 5" />
      ) : (
        <>
          <path d="M15.5 9a4 4 0 0 1 0 6" />
          <path d="M18 6.5a7.5 7.5 0 0 1 0 11" />
        </>
      )}
    </svg>
  );
}
export function MessageIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M12 3c5 0 9 3.4 9 7.6 0 4.2-4 7.6-9 7.6-.8 0-1.6-.1-2.3-.3L5 20.5c-.5.3-1.1-.2-.9-.7l1-3.1C3.8 15.3 3 13.5 3 10.6 3 6.4 7 3 12 3Z" />
    </svg>
  );
}
export function ClockIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" {...p}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}
export function LockIcon(p: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
      <path d="M7 10V8a5 5 0 0 1 10 0v2h.5A1.5 1.5 0 0 1 19 11.5v8A1.5 1.5 0 0 1 17.5 21h-11A1.5 1.5 0 0 1 5 19.5v-8A1.5 1.5 0 0 1 6.5 10H7Zm2 0h6V8a3 3 0 0 0-6 0v2Z" />
    </svg>
  );
}
