export const dateFmt = (
  v: string | number | Date | undefined | null,
  options?: Intl.DateTimeFormatOptions,
  locale?: string,
) => {
  if (!v) return ""
  try {
    const d = typeof v === "string" || typeof v === "number" ? new Date(v) : v
    if (d instanceof Date && !isNaN(d.getTime())) {
      return d.toLocaleString(locale ?? undefined, options)
    }
    return String(v)
  } catch (e) {
    return String(v)
  }
}

export const numFmt = (
  v: number | string | undefined | null,
  locale: string | undefined = "en-GH",
  options?: Intl.NumberFormatOptions,
) => {
  const n = typeof v === "number" && !isNaN(v) ? v : typeof v === "string" && !isNaN(Number(v)) ? Number(v) : 0
  try {
    return n.toLocaleString(locale, options)
  } catch (e) {
    return String(n)
  }
}

export default { dateFmt, numFmt }
