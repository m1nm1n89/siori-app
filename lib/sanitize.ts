import type { ShioriData } from "./types";

const strip = (s: string, max: number): string =>
  s.replace(/<[^>]*>/g, "").slice(0, max);

export function sanitizeData(d: ShioriData): ShioriData {
  return {
    ...d,
    title:   strip(d.title,  100),
    dest:    strip(d.dest,   100),
    notes:   strip(d.notes, 3000),
    members: d.members.slice(0, 30).map(m => ({
      ...m,
      name: strip(m.name, 50),
    })),
    days: d.days.slice(0, 15).map(day => ({
      ...day,
      label: strip(day.label, 20),
      events: day.events.slice(0, 20).map(e => ({
        ...e,
        time:     strip(e.time,     10),
        place:    strip(e.place,   100),
        activity: strip(e.activity, 200),
      })),
    })),
    packing: d.packing.slice(0, 100).map(p => ({
      ...p,
      item: strip(p.item, 100),
    })),
  };
}
