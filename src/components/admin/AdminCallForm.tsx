import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Pause, Play, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { randomSlug, uploadMedia, type Call } from "@/lib/calls";
import { PRESET_RINGTONES, Ringer } from "@/lib/ringtone";
import { embedUrl, parseVideoInput } from "@/lib/video";
import { ImageCropper } from "./ImageCropper";

interface Props {
  initial?: Call | null;
  onSaved: (call: Call) => void;
}

const TYPE_LABEL = { mp4: "Vídeo direto", youtube: "YouTube", vimeo: "Vimeo", iframe: "Iframe" } as const;

export function AdminCallForm({ initial, onSaved }: Props) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [videoInput, setVideoInput] = useState(initial?.video_url ?? "");
  const [name, setName] = useState(initial?.person_name ?? "");
  const [photo, setPhoto] = useState<string | null>(initial?.person_photo_url ?? null);
  const [bg, setBg] = useState<string | null>(initial?.background_url ?? null);
  const [ringType, setRingType] = useState<"preset" | "custom">((initial?.ringtone_type as "preset") ?? "preset");
  const [ringValue, setRingValue] = useState(initial?.ringtone_value ?? "classic");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "Chamada de vídeo");
  const [vibrate, setVibrate] = useState(initial?.vibrate ?? true);
  const [fullscreen, setFullscreen] = useState(initial?.fullscreen_video ?? true);
  const [unmute, setUnmute] = useState(initial?.unmute_button ?? true);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const ringer = useRef<Ringer | null>(null);

  const video = useMemo(() => parseVideoInput(videoInput), [videoInput]);
  useEffect(() => () => ringer.current?.stop(), []);

  const upload = async (bucket: "photos" | "backgrounds" | "ringtones" | "videos", file: Blob, ext: string, label: string) => {
    setBusy(label);
    try {
      return await uploadMedia(bucket, file, ext);
    } catch (e) {
      toast.error("Falha no envio: " + (e as Error).message);
      return null;
    } finally {
      setBusy(null);
    }
  };

  const togglePlay = async () => {
    if (playing) {
      ringer.current?.stop();
      setPlaying(false);
      return;
    }
    ringer.current?.stop();
    const r = new Ringer(ringType, ringValue);
    ringer.current = r;
    if (await r.start()) {
      setPlaying(true);
      setTimeout(() => {
        if (ringer.current === r) {
          r.stop();
          setPlaying(false);
        }
      }, 6000);
    } else toast.error("Não foi possível tocar o áudio");
  };

  const save = async () => {
    if (!video) return toast.error("Informe um vídeo válido");
    if (!name.trim()) return toast.error("Informe o nome da pessoa");
    if (ringType === "custom" && !ringValue.startsWith("http")) return toast.error("Envie o arquivo de toque");
    setBusy("Salvando...");
    const payload = {
      title: title.trim() || name.trim(),
      video_url: video.url,
      video_type: video.type,
      person_name: name.trim(),
      person_photo_url: photo,
      background_url: bg,
      ringtone_type: ringType,
      ringtone_value: ringValue,
      subtitle: subtitle.trim() || "Chamada de vídeo",
      vibrate,
      fullscreen_video: fullscreen,
      unmute_button: unmute,
    };
    try {
      if (initial) {
        const { data, error } = await supabase.from("calls").update(payload).eq("id", initial.id).select().single();
        if (error) throw error;
        onSaved(data);
      } else {
        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase.from("calls").insert({ ...payload, slug: randomSlug() }).select().single();
          if (!error) return onSaved(data);
          if (error.code !== "23505") throw error;
        }
        throw new Error("Não foi possível gerar o link");
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <Field label="Título da chamada" hint="Uso interno">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Chamada da Ana" />
      </Field>

      <Field label="Vídeo da chamada" hint="Link .mp4/.webm/.m3u8, YouTube, Vimeo ou código iframe">
        <Textarea rows={2} value={videoInput} onChange={(e) => setVideoInput(e.target.value)} placeholder="https://..." />
        <div className="flex items-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-primary hover:underline">
            <Upload className="h-4 w-4" /> Enviar arquivo de vídeo (até 50MB)
            <input
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await upload("videos", f, f.name.split(".").pop() || "mp4", "Enviando vídeo...");
                if (url) setVideoInput(url);
              }}
            />
          </label>
        </div>
        {videoInput && !video && <p className="text-sm text-destructive">Link inválido</p>}
        {video && (
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs">{TYPE_LABEL[video.type]}</span>
            <div className="aspect-video overflow-hidden rounded-lg bg-call-black">
              {video.type === "mp4" ? (
                <video src={video.url} controls muted playsInline className="h-full w-full" />
              ) : (
                <iframe src={embedUrl(video, { muted: true, controls: true }).replace("autoplay=1", "autoplay=0")} className="h-full w-full border-0" allow="encrypted-media" title="prévia" />
              )}
            </div>
          </div>
        )}
      </Field>

      <Field label="Nome da pessoa">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ana Souza" />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Foto da pessoa">
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
              {photo && <img src={photo} alt="" className="h-full w-full object-cover" />}
            </div>
            <label className="cursor-pointer text-sm text-primary hover:underline">
              {photo ? "Trocar" : "Enviar imagem"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { setCropFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
            </label>
          </div>
        </Field>
        <Field label="Capa de fundo">
          <div className="flex items-center gap-4">
            <div className="h-20 w-14 overflow-hidden rounded-lg bg-muted">
              {bg && <img src={bg} alt="" className="h-full w-full object-cover" />}
            </div>
            <label className="cursor-pointer text-sm text-primary hover:underline">
              {bg ? "Trocar" : "Enviar imagem"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const url = await upload("backgrounds", f, f.name.split(".").pop() || "jpg", "Enviando capa...");
                  if (url) setBg(url);
                }}
              />
            </label>
          </div>
        </Field>
      </div>

      <Field label="Toque de chamada">
        <div className="grid grid-cols-2 gap-2">
          {PRESET_RINGTONES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => { setRingType("preset"); setRingValue(r.value); }}
              className={`rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${ringType === "preset" && ringValue === r.value ? "border-primary bg-accent" : "hover:bg-muted"}`}
            >
              {r.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${ringType === "custom" ? "border-primary bg-accent" : "hover:bg-muted"}`}>
            {ringType === "custom" ? "Áudio próprio ✓ (trocar)" : "Enviar .mp3 próprio"}
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const url = await upload("ringtones", f, f.name.split(".").pop() || "mp3", "Enviando toque...");
                if (url) { setRingType("custom"); setRingValue(url); }
              }}
            />
          </label>
          <Button type="button" variant="secondary" size="sm" onClick={togglePlay}>
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} Ouvir
          </Button>
        </div>
      </Field>

      <Field label="Texto do subtítulo">
        <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
      </Field>

      <div className="space-y-3 rounded-xl border bg-card p-4">
        <Toggle label="Vibrar o celular ao tocar" checked={vibrate} onChange={setVibrate} />
        <Toggle label="Tocar vídeo em tela cheia ao atender" checked={fullscreen} onChange={setFullscreen} />
        <Toggle label="Mostrar botão de reativar o som se o vídeo iniciar mudo" checked={unmute} onChange={setUnmute} />
      </div>

      <Button size="lg" className="w-full" disabled={!!busy} onClick={save}>
        {busy ?? (initial ? "Salvar alterações" : "Criar chamada")}
      </Button>

      <ImageCropper
        file={cropFile}
        onCancel={() => setCropFile(null)}
        onDone={async (b) => {
          setCropFile(null);
          const url = await upload("photos", b, "jpg", "Enviando foto...");
          if (url) setPhoto(url);
        }}
      />
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-semibold">
        {label} {hint && <span className="font-normal text-muted-foreground">· {hint}</span>}
      </Label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
