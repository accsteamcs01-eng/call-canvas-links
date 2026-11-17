import { useState } from "react";
import { BatteryFull, Phone, PhoneOff, Signal, UserRound, Video, Wifi } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { THEMES, type CallThemeId } from "@/themes";
import { ThemeIcon } from "@/themes/ThemeIcon";
import { embedUrl, type ParsedVideo } from "@/lib/video";
import { resolveLinkPreview } from "../link-preview";

interface Props {
  name: string;
  photo: string | null;
  background: string | null;
  subtitle: string;
  theme: CallThemeId;
  video: ParsedVideo | null;
  image: string | null;
  title: string;
  description: string;
}

/** Admin-only simulation: no camera requests, ringing, playback flow or statistics. */
export function LivePhonePreview(props: Props) {
  const [mode, setMode] = useState("incoming");
  const t = THEMES[props.theme];
  const link = resolveLinkPreview(props);
  return (
    <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start" aria-label="Prévia ao vivo">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Prévia ao vivo</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ThemeIcon theme={props.theme} className="h-5 w-5" />
          {t.label}
        </span>
      </div>
      <Tabs value={mode} onValueChange={setMode} className="mb-5">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="incoming">Chamada</TabsTrigger>
          <TabsTrigger value="video">Vídeo</TabsTrigger>
          <TabsTrigger value="link">Link</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="relative mx-auto aspect-[9/18] w-full max-w-[280px] overflow-hidden rounded-[36px] border-[6px] border-call-dark bg-call-dark text-call-ink shadow-card">
        {mode === "incoming" && (
          <>
            {(props.background || props.photo) && (
              <img
                src={props.background || props.photo || ""}
                alt=""
                className="absolute inset-0 h-full w-full object-cover blur-xl"
              />
            )}
            <div className={`absolute inset-0 ${t.colors.overlay}`} />
            <div className="relative flex h-full flex-col items-center px-6 pb-8 pt-14 font-call">
              <ThemeIcon theme={props.theme} className="mb-3 h-8 w-8" />
              <p className="text-center text-xs text-call-ink/80">
                {props.subtitle || t.texts.header}
              </p>
              <div className="mt-9 flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-call-glass ring-2 ring-call-ink/20">
                {props.photo ? (
                  <img
                    src={props.photo}
                    alt="Foto da pessoa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserRound className="h-10 w-10" />
                )}
              </div>
              <p className="mt-5 w-full break-words text-center text-xl font-semibold">
                {props.name.trim() || "Nome da pessoa"}
              </p>
              <p className={`mt-2 text-xs ${t.colors.muted}`}>
                {t.texts.ringing || t.texts.header}
              </p>
              <div className="mt-auto flex w-full justify-between pt-6">
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${t.colors.decline}`}
                  >
                    <PhoneOff className="h-5 w-5" />
                  </span>
                  <span className="text-xs">{t.texts.decline}</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${t.colors.accept}`}
                  >
                    <Phone className="h-5 w-5" />
                  </span>
                  <span className="text-xs">{t.texts.accept}</span>
                </div>
              </div>
            </div>
          </>
        )}
        {mode === "video" && (
          <div className="flex h-full items-center justify-center">
            {props.video ? (
              props.video.type === "mp4" ? (
                <video
                  key={props.video.url}
                  src={props.video.url}
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              ) : (
                <iframe
                  key={props.video.url}
                  src={embedUrl(props.video, { muted: true, controls: true }).replace(
                    "autoplay=1",
                    "autoplay=0",
                  )}
                  title="Vídeo na prévia ao vivo"
                  className="h-full w-full border-0"
                  allow="encrypted-media"
                />
              )
            ) : (
              <Video className="h-10 w-10 text-call-ink/40" />
            )}
          </div>
        )}
        {mode === "link" && (
          <div className="flex h-full items-center bg-background px-4 text-foreground">
            <ThemeIcon theme="whatsapp" className="absolute left-5 top-12 h-7 w-7" />
            <figure className="w-full overflow-hidden rounded-lg border bg-card">
              {link.image && (
                <img
                  src={link.image}
                  alt="Prévia WhatsApp"
                  className="aspect-[1200/630] w-full object-cover"
                />
              )}
              <figcaption className="space-y-2 p-3">
                <p className="break-words text-sm font-semibold">{link.title}</p>
                <p className="break-words text-xs text-muted-foreground">{link.description}</p>
              </figcaption>
            </figure>
          </div>
        )}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-call-dark/70 px-5 py-2 text-[10px] text-call-ink">
          <span>9:41</span>
          <span className="flex gap-1">
            <Signal className="h-3 w-3" />
            <Wifi className="h-3 w-3" />
            <BatteryFull className="h-3 w-3" />
          </span>
        </div>
        <div className="pointer-events-none absolute bottom-2 left-1/2 h-1 w-20 -translate-x-1/2 rounded-full bg-call-ink/60" />
      </div>
    </aside>
  );
}
