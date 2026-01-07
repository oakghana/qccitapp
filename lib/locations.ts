export const LOCATIONS = {
  head_office: "Head Office",
  tema_port: "Tema Port",
  tema_research: "Tema Research",
  tema_training_school: "Tema Training School",
  kumasi: "Kumasi",
  kaase: "Kaase",
  ws: "WS",
  wn: "WN",
  vr: "VR",
  bar: "BAR",
  nsawam: "Nsawam",
  cr: "CR",
} as const

export type LocationKey = keyof typeof LOCATIONS
export type LocationValue = (typeof LOCATIONS)[LocationKey]

export function getLocationLabel(key: string): string {
  return LOCATIONS[key as LocationKey] || key
}

export function getLocationOptions() {
  return Object.entries(LOCATIONS).map(([value, label]) => ({
    value,
    label,
  }))
}
