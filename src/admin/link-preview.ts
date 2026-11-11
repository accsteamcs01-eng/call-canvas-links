export const PREVIEW_IMAGE_MAX_BYTES = 300 * 1024;
export const DEFAULT_PREVIEW_DESCRIPTION = "Chamada de vídeo • Toque para atender";

export function previewImageError(file: { size: number; type: string }): string | null {
  if (!file.type.startsWith("image/")) return "Selecione um arquivo de imagem";
  if (file.size > PREVIEW_IMAGE_MAX_BYTES) return "A imagem de prévia deve ter até 300 KB";
  return null;
}

export function resolveLinkPreview(input: {
  name: string;
  photo: string | null;
  image: string | null;
  title: string;
  description: string;
}) {
  return {
    image: input.image || input.photo,
    title: input.title.trim() || `${input.name.trim() || "Alguém"} está te ligando`,
    description: input.description.trim() || DEFAULT_PREVIEW_DESCRIPTION,
  };
}