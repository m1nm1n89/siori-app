export interface Member { id: string; name: string }
export interface TravelEvent { id: string; time: string; transport: string; place: string; activity: string }
export interface Day { id: string; label: string; events: TravelEvent[] }
export interface PackingItem { id: string; item: string; checked: boolean }

export interface ShioriData {
  id: string;
  title: string;
  dest: string;
  from: string;
  to: string;
  members: Member[];
  days: Day[];
  packing: PackingItem[];
  notes: string;
}
