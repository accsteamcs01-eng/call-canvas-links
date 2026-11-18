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
- Public call page (/c/$slug) uses ssr: "data-only" (server loader reads share fields for og tags; UI renders client-side) and must stay free of admin branding; `?preview=1` disables event tracking.
- Public call reads use `get_public_call` with an exact slug; the fixed-search-path RPC exposes only active playback/share fields, while direct calls SELECT is owner-only. Recheck availability on visits and never let preview bypass the gate.
- Storage SELECT is bound to `owner_id = auth.uid()::text`; signed media URLs intentionally remain bearer links so public calls and social previews work without sign-in.
- Media INSERT requires matching authenticated owner_id and first folder; uploads fail before storage access without a verified user to prevent cross-account paths.
- Public statistics use `log_public_call_event` with exact active slug, allowlisted event and bounded duration; direct client INSERT is revoked so IDs and timestamps are server-controlled.
- Preset ringtones are synthesized with WebAudio in src/lib/ringtone.ts (no audio files).
- Admin panel code lives in src/admin (separate from src/components/call); its light theme and Inter font are applied only while the /admin layout is mounted (class on <html>, injected <link>) so the public call page never changes.
- Link-preview fields and fallback logic belong to src/admin; persist empty overrides as null so defaults can follow changes to the caller without modifying the public call experience.
- iOS Chrome playback recovery lives in an isolated browser-gated module and reuses gesture-unlocked video elements across permission prompts; other browsers retain the existing call flow.
- Call themes live in src/themes: ThemedScreens picks the screens for a call's stored theme and Telegram's own components and markup stay untouched, so adding a theme means new files, not edits to the existing call flow.
- Active-call loading rules (connecting gate timing, buffering detection, resume budget) live in src/lib/callLoading.ts and the shared indicator in src/themes/shared/CallStatus.tsx, so every theme reuses one loading behaviour and the answer gesture stays untouched.

- Create/edit call forms keep draft state in the form and use an admin-only phone simulation plus TanStack navigation blocking; previews never request camera access, ring or record events.
- Service logos use the shared ThemeIcon and CDN asset pointers; keep them separate from the app favicon and branding because they identify call themes, not the application.
- Saved contacts are owner-private presets in src/admin; calls keep copied playback fields plus an owner-bound contact_id for usage counts, so editing or deleting a contact never changes existing public call content.
