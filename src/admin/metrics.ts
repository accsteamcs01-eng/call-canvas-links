export type Period = "today" | "7d" | "30d" | "all";
export interface EventRow { call_id: string; event: string; duration_seconds: number | null; created_at: string }

export function periodStart(p: Period, now = new Date()): Date | null {
  if (p === "all") return null;
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  if (p === "7d") d.setDate(d.getDate() - 6);
  if (p === "30d") d.setDate(d.getDate() - 29);
  return d;
}

export function inPeriod(iso: string, start: Date | null) {
  return !start || new Date(iso) >= start;
}

export function answerRate(opened: number, answered: number) {
  return opened ? Math.round((answered / opened) * 100) : 0;
}

export function summarize(events: EventRow[]) {
  let opened = 0, answered = 0, declined = 0, sum = 0, n = 0;
  for (const e of events) {
    if (e.event === "opened") opened++;
    else if (e.event === "answered") answered++;
    else if (e.event === "declined") declined++;
    else if (e.event === "ended" && e.duration_seconds != null) { sum += e.duration_seconds; n++; }
  }
  return { opened, answered, declined, avgDuration: n ? sum / n : 0, rate: answerRate(opened, answered) };
}

const dayKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function dailySeries(events: EventRow[], start: Date | null, now = new Date()) {
  let from = start;
  if (!from) {
    const min = events.reduce((m, e) => Math.min(m, +new Date(e.created_at)), +now);
    from = new Date(Math.max(min, +now - 89 * 864e5));
    from.setHours(0, 0, 0, 0);
  }
  const map = new Map<string, { day: string; label: string; opened: number; answered: number }>();
  for (const d = new Date(from); d <= now; d.setDate(d.getDate() + 1)) {
    map.set(dayKey(d), { day: dayKey(d), label: d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }), opened: 0, answered: 0 });
  }
  for (const e of events) {
    const row = map.get(dayKey(new Date(e.created_at)));
    if (!row) continue;
    if (e.event === "opened") row.opened++;
    if (e.event === "answered") row.answered++;
  }
  return [...map.values()];
}

export function timeAgo(iso: string, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - +new Date(iso)) / 1000));
  if (s < 60) return "agora mesmo";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min atrás`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h atrás`;
  const d = Math.floor(h / 24);
  return `${d} ${d === 1 ? "dia" : "dias"} atrás`;
}
