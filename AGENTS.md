<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Storage buckets are private (workspace blocks public buckets); uploads store a 10-year signed URL in the row so the public call page can load media without auth.
- Public call page (/c/$slug) is client-rendered (ssr: false) and must stay free of admin branding; `?preview=1` disables event tracking.
- Preset ringtones are synthesized with WebAudio in src/lib/ringtone.ts (no audio files).
- Admin panel code lives in src/admin (separate from src/components/call); its light theme and Inter font are applied only while the /admin layout is mounted (class on <html>, injected <link>) so the public call page never changes.
- Link-preview fields and fallback logic belong to src/admin; persist empty overrides as null so defaults can follow changes to the caller without modifying the public call experience.
