export function dateCountdown(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input)

  if (isNaN(date.getTime())) return "sin fecha"

  const diffMs = Date.now() - date.getTime()
  const absMinutes = Math.floor(Math.abs(diffMs) / 60000)
  const isFuture = diffMs < 0

  if (absMinutes < 1) return isFuture ? "Dentro de un momento" : "Hace un momento"

  const units = [
    { singular: "año",    plural: "años",    minutes: 525600 },
    { singular: "mes",    plural: "meses",   minutes: 43800 },
    { singular: "semana", plural: "semanas", minutes: 10080 },
    { singular: "día",    plural: "días",    minutes: 1440 },
    { singular: "hora",   plural: "horas",   minutes: 60 },
    { singular: "minuto", plural: "minutos", minutes: 1 },
  ]

  for (const unit of units) {
    if (absMinutes >= unit.minutes) {
      const value = Math.floor(absMinutes / unit.minutes)
      const label = value === 1 ? unit.singular : unit.plural
      return isFuture ? `Dentro de ${value} ${label}` : `Hace ${value} ${label}`
    }
  }

  return isFuture ? "Dentro de un momento" : "Hace un momento"
}
