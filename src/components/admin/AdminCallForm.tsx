import { loadDefaults } from "@/admin/settings";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  AudioLines,
  Check,
  FileText,
  ImageIcon,
  LoaderCircle,
  Pause,
  Play,
  Save,
  Settings2,
  Upload,
  UserRound,
  Video,
} from "lucide-react";
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
import { LinkPreviewFields } from "@/admin/components/LinkPreviewFields";
import { ThemePicker } from "@/admin/components/ThemePicker";
import { ThemeIcon } from "@/themes/ThemeIcon";
import { resolveTheme, type CallThemeId } from "@/themes";
import { useBlocker } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { LivePhonePreview } from "@/admin/components/LivePhonePreview";
import { formCompletion, hasUnsavedChanges } from "@/admin/form-state";
import { MediaPicker } from "@/admin/components/MediaPicker";
import { ContactPicker } from "@/admin/components/ContactPicker";
import { contactFields } from "@/admin/contacts";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  initial?: Call | null;
  onSaved: (call: Call) => void;
}

const TYPE_LABEL = {
  mp4: "Vídeo direto",
  youtube: "YouTube",
  vimeo: "Vimeo",
  iframe: "Iframe",
} as const;

export function AdminCallForm({ initial, onSaved }: Props) {
  const qc = useQueryClient();
  const [defaults] = useState(loadDefaults);
  const [contactId, setContactId] = useState<string | null>(initial?.contact_id ?? null);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [videoInput, setVideoInput] = useState(initial?.video_url ?? "");
  const [name, setName] = useState(initial?.person_name ?? "");
  const [photo, setPhoto] = useState<string | null>(initial?.person_photo_url ?? null);
  const [bg, setBg] = useState<string | null>(initial?.background_url ?? null);
  const [previewImage, setPreviewImage] = useState<string | null>(
    initial?.preview_image_url ?? null,
  );
  const [previewTitle, setPreviewTitle] = useState(initial?.preview_title ?? "");
  const [previewDescription, setPreviewDescription] = useState(initial?.preview_description ?? "");
  const [ringType, setRingType] = useState<"preset" | "custom">(
    (initial?.ringtone_type as "preset") ?? "preset",
  );
  const [ringValue, setRingValue] = useState(initial?.ringtone_value ?? "classic");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "Chamada de vídeo");
  const [vibrate, setVibrate] = useState(initial?.vibrate ?? defaults.vibrate);
  const [fullscreen, setFullscreen] = useState(initial?.fullscreen_video ?? defaults.fullscreen);
  const [unmute, setUnmute] = useState(initial?.unmute_button ?? defaults.unmute);
  const [theme, setTheme] = useState<CallThemeId>(initial ? resolveTheme(initial.theme) : defaults.theme);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const ringer = useRef<Ringer | null>(null);

  const [section, setSection] = useState("information");
  const snapshot = JSON.stringify({
    contactId,
    title,
    videoInput,
    name,
    photo,
    bg,
    previewImage,
    previewTitle,
    previewDescription,
    ringType,
    ringValue,
    subtitle,
    vibrate,
    fullscreen,
    unmute,
    theme,
  });
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot);
  const dirty = hasUnsavedChanges(snapshot, savedSnapshot);
  const blocker = useBlocker({
    shouldBlockFn: () => dirty || !!busy || !!cropFile,
    enableBeforeUnload: dirty || !!busy || !!cropFile,
    withResolver: true,
  });
  const video = useMemo(() => parseVideoInput(videoInput), [videoInput]);
  useEffect(() => () => ringer.current?.stop(), []);
  const progress = formCompletion(name, !!video, ringType, ringValue);

  const upload = async (
    bucket: "photos" | "backgrounds" | "ringtones" | "videos",
    file: Blob,
    ext: string,
    label: string,
  ) => {
    setBusy(label);
    try {
      const url = await uploadMedia(bucket, file, ext);
      void qc.invalidateQueries({ queryKey: ["library"] });
      return url;
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
    if (!video) {
      setSection("video");
      return toast.error("Informe um vídeo válido");
    }
    if (!name.trim()) {
      setSection("person");
      return toast.error("Informe o nome da pessoa");
    }
    if (ringType === "custom" && !ringValue.startsWith("http")) {
      setSection("ringtone");
      return toast.error("Envie o arquivo de toque");
    }
    setBusy("Salvando...");
    const payload = {
      contact_id: contactId,
      title: title.trim() || name.trim(),
      video_url: video.url,
      video_type: video.type,
      person_name: name.trim(),
      person_photo_url: photo,
      background_url: bg,
      preview_image_url: previewImage,
      preview_title: previewTitle.trim() || null,
      preview_description: previewDescription.trim() || null,
      ringtone_type: ringType,
      ringtone_value: ringValue,
      subtitle: subtitle.trim() || "Chamada de vídeo",
      vibrate,
      fullscreen_video: fullscreen,
      unmute_button: unmute,
      theme,
    };
    try {
      if (initial) {
        const { data, error } = await supabase
          .from("calls")
          .update(payload)
          .eq("id", initial.id)
          .select()
          .single();
        if (error) throw error;
        void qc.invalidateQueries({ queryKey: ["contact-usage"] });
        setSavedSnapshot(snapshot);
        onSaved(data);
      } else {
        for (let i = 0; i < 5; i++) {
          const { data, error } = await supabase
            .from("calls")
            .insert({ ...payload, slug: randomSlug() })
            .select()
            .single();
          if (!error) {
            void qc.invalidateQueries({ queryKey: ["contact-usage"] });
            setSavedSnapshot(snapshot);
            return onSaved(data);
          }
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
    <div className="relative pb-4">
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b pb-5">
        <span className="text-sm font-medium">Preenchimento</span>
        <Progress
          value={progress}
          aria-label="Progresso do preenchimento"
          className="h-1.5 w-32 sm:w-48"
        />
        <span className="text-xs font-semibold text-primary">{progress}%</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {dirty ? "Alterações não salvas" : initial ? "Tudo salvo" : "Nova chamada"}
        </span>
      </div>
      <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_280px] xl:gap-12">
        <Tabs value={section} onValueChange={setSection} className="min-w-0">
          <div className="mb-5 overflow-x-auto pb-1">
            <TabsList className="h-auto w-max min-w-full justify-start gap-1 bg-transparent p-0">
              {[
                ["information", "Informações", FileText],
                ["video", "Vídeo", Video],
                ["person", "Pessoa", UserRound],
                ["appearance", "Aparência", ImageIcon],
                ["ringtone", "Toque e opções", AudioLines],
                ["preview", "Prévia WhatsApp", Settings2],
              ].map(([id, label, Icon]) => {
                const SectionIcon = Icon as typeof FileText;
                return (
                  <TabsTrigger
                    key={id as string}
                    value={id as string}
                    className="gap-1.5 rounded-md border border-transparent px-3 py-2.5 text-xs data-[state=active]:border-border data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-none"
                  >
                    {id === "preview" ? (
                      <ThemeIcon theme="whatsapp" className="h-4 w-4" />
                    ) : (
                      <SectionIcon className="h-3.5 w-3.5" />
                    )}
                    {label as string}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
          <TabsContent
            value="information"
            className="space-y-6 rounded-lg border bg-card p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold">Informações da chamada</h2>
            <Field label="Título da chamada" hint="Uso interno">
              <Input
                aria-label="Título da chamada"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Chamada da Ana"
              />
            </Field>

            <Field label="Texto do subtítulo">
              <Input
                aria-label="Texto do subtítulo"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
              />
            </Field>
          </TabsContent>
          <TabsContent value="video" className="space-y-6 rounded-lg border bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Vídeo da chamada</h2>
            <Field
              label="Vídeo da chamada"
              hint="Link .mp4/.webm/.m3u8, YouTube, Vimeo ou código iframe"
            >
              <Textarea
                aria-label="Vídeo da chamada"
                rows={2}
                value={videoInput}
                onChange={(e) => setVideoInput(e.target.value)}
                placeholder="https://..."
              />
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
                      const url = await upload(
                        "videos",
                        f,
                        f.name.split(".").pop() || "mp4",
                        "Enviando vídeo...",
                      );
                      if (url) setVideoInput(url);
                    }}
                  />
                </label>
                <MediaPicker bucket="videos" onPick={setVideoInput} />
              </div>
              {videoInput && !video && <p className="text-sm text-destructive">Link inválido</p>}
              {video && (
                <div className="space-y-2">
                  <span className="inline-block rounded-full bg-accent px-2.5 py-0.5 text-xs">
                    {TYPE_LABEL[video.type]}
                  </span>
                  <div className="aspect-video overflow-hidden rounded-lg bg-call-black">
                    {video.type === "mp4" ? (
                      <video src={video.url} controls muted playsInline className="h-full w-full" />
                    ) : (
                      <iframe
                        src={embedUrl(video, { muted: true, controls: true }).replace(
                          "autoplay=1",
                          "autoplay=0",
                        )}
                        className="h-full w-full border-0"
                        allow="encrypted-media"
                        title="prévia"
                      />
                    )}
                  </div>
                </div>
              )}
            </Field>
          </TabsContent>
          <TabsContent value="person" className="space-y-6 rounded-lg border bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Pessoa</h2>
            <Field label="Contato salvo">
              <ContactPicker
                value={contactId}
                onDetach={() => setContactId(null)}
                onSelect={(contact) => {
                  const fields = contactFields(contact);
                  setContactId(fields.contact_id);
                  setName(fields.person_name);
                  setPhoto(fields.person_photo_url);
                  setSubtitle(fields.subtitle);
                }}
              />
            </Field>
            <Field label="Nome da pessoa">
              <Input
                aria-label="Nome da pessoa"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ana Souza"
              />
            </Field>

            <div className="space-y-6">
              <Field label="Foto da pessoa">
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 overflow-hidden rounded-full bg-muted">
                    {photo && <img src={photo} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <label className="cursor-pointer text-sm text-primary hover:underline">
                    {photo ? "Trocar" : "Enviar imagem"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        setCropFile(e.target.files?.[0] ?? null);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <MediaPicker bucket="photos" onPick={setPhoto} />
                </div>
              </Field>
            </div>
          </TabsContent>
          <TabsContent
            value="appearance"
            className="space-y-6 rounded-lg border bg-card p-5 sm:p-6"
          >
            <h2 className="text-base font-semibold">Aparência</h2>
            <Field label="Tema visual da chamada">
              <ThemePicker value={theme} onChange={setTheme} />
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
                      const url = await upload(
                        "backgrounds",
                        f,
                        f.name.split(".").pop() || "jpg",
                        "Enviando capa...",
                      );
                      if (url) setBg(url);
                    }}
                  />
                </label>
                <MediaPicker bucket="backgrounds" onPick={setBg} />
              </div>
            </Field>
          </TabsContent>
          <TabsContent value="preview" className="rounded-lg border bg-card p-5 sm:p-6">
            <LinkPreviewFields
              name={name}
              photo={photo}
              image={previewImage}
              title={previewTitle}
              description={previewDescription}
              busy={!!busy}
              onImage={setPreviewImage}
              onTitle={setPreviewTitle}
              onDescription={setPreviewDescription}
              onUpload={(file) =>
                upload("photos", file, file.name.split(".").pop() || "jpg", "Enviando prévia...")
              }
            />
          </TabsContent>
          <TabsContent value="ringtone" className="space-y-6 rounded-lg border bg-card p-5 sm:p-6">
            <h2 className="text-base font-semibold">Toque e opções</h2>
            <Field label="Toque de chamada">
              <div className="grid grid-cols-2 gap-2">
                {PRESET_RINGTONES.map((r) => (
                  <Button
                    variant="outline"
                    key={r.value}
                    type="button"
                    onClick={() => {
                      setRingType("preset");
                      setRingValue(r.value);
                    }}
                    className={`h-auto justify-start whitespace-normal rounded-md border px-3 py-2.5 text-left text-sm transition-colors ${ringType === "preset" && ringValue === r.value ? "border-primary bg-accent" : "hover:bg-muted"}`}
                  >
                    {r.label}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <label
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${ringType === "custom" ? "border-primary bg-accent" : "hover:bg-muted"}`}
                >
                  {ringType === "custom" ? "Áudio próprio ✓ (trocar)" : "Enviar .mp3 próprio"}
                  <input
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const url = await upload(
                        "ringtones",
                        f,
                        f.name.split(".").pop() || "mp3",
                        "Enviando toque...",
                      );
                      if (url) {
                        setRingType("custom");
                        setRingValue(url);
                      }
                    }}
                  />
                </label>
                <MediaPicker
                  bucket="ringtones"
                  onPick={(url) => {
                    setRingType("custom");
                    setRingValue(url);
                  }}
                />
                <Button type="button" variant="secondary" size="sm" onClick={togglePlay}>
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} Ouvir
                </Button>
              </div>
            </Field>

            <div className="space-y-4 border-t pt-5">
              <Toggle label="Vibrar o celular ao tocar" checked={vibrate} onChange={setVibrate} />
              <Toggle
                label="Tocar vídeo em tela cheia ao atender"
                checked={fullscreen}
                onChange={setFullscreen}
              />
              <Toggle
                label="Mostrar botão de reativar o som se o vídeo iniciar mudo"
                checked={unmute}
                onChange={setUnmute}
              />
            </div>
          </TabsContent>
        </Tabs>
        <LivePhonePreview
          name={name}
          photo={photo}
          background={bg}
          subtitle={subtitle}
          theme={theme}
          video={video}
          image={previewImage}
          title={previewTitle}
          description={previewDescription}
        />
      </div>
      <div className="sticky bottom-[calc(60px+env(safe-area-inset-bottom))] z-20 mt-8 flex items-center justify-between gap-3 rounded-lg border bg-card/95 px-4 py-3 shadow-card backdrop-blur-md md:bottom-4">
        <span className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          {dirty ? (
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
          ) : (
            <Check className="h-4 w-4 shrink-0" />
          )}
          <span>
            {busy ??
              (dirty ? "Alterações não salvas" : initial ? "Tudo salvo" : "Pronto para criar")}
          </span>
        </span>
        <Button
          size="lg"
          disabled={!!busy || !!cropFile}
          onClick={save}
          className="shrink-0 px-4 sm:px-6"
        >
          {busy ? <LoaderCircle className="animate-spin" /> : <Save />}
          {initial ? "Salvar alterações" : "Criar chamada"}
        </Button>
      </div>
      <AlertDialog
        open={blocker.status === "blocked"}
        onOpenChange={(open) => {
          if (!open) blocker.reset?.();
        }}
      >
        <AlertDialogContent className="admin-root rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              As alterações desta chamada ainda não foram salvas. Se sair agora, elas serão
              perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => blocker.reset?.()}>
              Continuar editando
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => blocker.proceed?.()} disabled={!!busy}>
              Sair sem salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-4 text-sm">
      <span>{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
