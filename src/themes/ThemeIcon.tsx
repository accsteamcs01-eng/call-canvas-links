import telegram from "@/assets/telegram.webp.asset.json";
import whatsapp from "@/assets/whatsapp.png.asset.json";
import messenger from "@/assets/messenger.png.asset.json";
import type { CallThemeId } from "./index";

const icons = { telegram, whatsapp, messenger };

/** Service marks are decorative companions to visible labels, not the app's branding. */
export function ThemeIcon({ theme, className = "h-5 w-5" }: { theme: CallThemeId; className?: string }) {
  return <img src={icons[theme].url} alt="" aria-hidden="true" width={32} height={32} className={`shrink-0 object-contain ${className}`} />;
}