/**
 * True on iPhone/iPad/iPod in any browser (Safari, Chrome, Telegram, WhatsApp...),
 * including iPads that report themselves as Mac. Used to branch platform-specific
 * call-loading behavior without touching the Android/desktop path.
 */
export function isIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}
