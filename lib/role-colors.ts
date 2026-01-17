export type UserRole =
  | "admin"
  | "regional_it_head"
  | "it_head"
  | "it_staff"
  | "it_store_head"
  | "staff"
  | "user"
  | "service_provider"
  | "service_desk_accra"
  | "service_desk_kumasi"
  | "service_desk_takoradi"
  | "service_desk_tema"
  | "service_desk_sunyani"
  | "service_desk_cape_coast"

interface RoleColorScheme {
  primary: string
  secondary: string
  accent: string
  light: string
  dark: string
  gradient: string
  hoverGradient: string
  textPrimary: string
  textSecondary: string
  border: string
  background: string
}

const roleColorSchemes: Record<UserRole, RoleColorScheme> = {
  admin: {
    primary: "rgb(185 28 28)", // red-700 - darker for better contrast
    secondary: "rgb(220 38 38)", // red-600
    accent: "rgb(153 27 27)", // red-800
    light: "rgb(252 165 165)", // red-300
    dark: "rgb(127 29 29)", // red-900
    gradient: "from-red-600 to-red-800",
    hoverGradient: "hover:from-red-700 hover:to-red-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-red-300 dark:border-red-700",
    background: "bg-red-100/50 dark:bg-red-950/50",
  },
  regional_it_head: {
    primary: "rgb(29 78 216)", // blue-700 - darker for better contrast
    secondary: "rgb(37 99 235)", // blue-600
    accent: "rgb(30 58 138)", // blue-800
    light: "rgb(147 197 253)", // blue-300
    dark: "rgb(30 58 138)", // blue-900
    gradient: "from-blue-600 to-blue-800",
    hoverGradient: "hover:from-blue-700 hover:to-blue-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-blue-300 dark:border-blue-700",
    background: "bg-blue-100/50 dark:bg-blue-950/50",
  },
  it_head: {
    primary: "rgb(126 34 206)", // purple-700 - darker for better contrast
    secondary: "rgb(147 51 234)", // purple-600
    accent: "rgb(107 33 168)", // purple-800
    light: "rgb(196 181 253)", // purple-300
    dark: "rgb(88 28 135)", // purple-900
    gradient: "from-purple-600 to-purple-800",
    hoverGradient: "hover:from-purple-700 hover:to-purple-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-purple-300 dark:border-purple-700",
    background: "bg-purple-100/50 dark:bg-purple-950/50",
  },
  it_staff: {
    primary: "rgb(15 118 110)", // teal-700 - darker for better contrast
    secondary: "rgb(14 116 144)", // teal-600
    accent: "rgb(17 94 89)", // teal-800
    light: "rgb(94 234 212)", // teal-300
    dark: "rgb(19 78 74)", // teal-900
    gradient: "from-teal-600 to-teal-800",
    hoverGradient: "hover:from-teal-700 hover:to-teal-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-teal-300 dark:border-teal-700",
    background: "bg-teal-100/50 dark:bg-teal-950/50",
  },
  it_store_head: {
    primary: "rgb(180 83 9)", // amber-700
    secondary: "rgb(217 119 6)", // amber-600
    accent: "rgb(146 64 14)", // amber-800
    light: "rgb(252 211 77)", // amber-300
    dark: "rgb(120 53 15)", // amber-900
    gradient: "from-amber-600 to-amber-800",
    hoverGradient: "hover:from-amber-700 hover:to-amber-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-amber-300 dark:border-amber-700",
    background: "bg-amber-100/50 dark:bg-amber-950/50",
  },
  staff: {
    primary: "rgb(194 65 12)", // orange-700 - darker for better contrast
    secondary: "rgb(234 88 12)", // orange-600
    accent: "rgb(154 52 18)", // orange-800
    light: "rgb(253 186 116)", // orange-300
    dark: "rgb(154 52 18)", // orange-900
    gradient: "from-orange-600 to-orange-800",
    hoverGradient: "hover:from-orange-700 hover:to-orange-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-orange-300 dark:border-orange-700",
    background: "bg-orange-100/50 dark:bg-orange-950/50",
  },
  user: {
    primary: "rgb(107 114 128)", // gray-500
    secondary: "rgb(156 163 175)", // gray-400
    accent: "rgb(75 85 99)", // gray-600
    light: "rgb(209 213 219)", // gray-300
    dark: "rgb(55 65 81)", // gray-700
    gradient: "from-gray-500 to-gray-700",
    hoverGradient: "hover:from-gray-600 hover:to-gray-800",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-gray-300 dark:border-gray-700",
    background: "bg-gray-100/50 dark:bg-gray-950/50",
  },
  service_provider: {
    primary: "rgb(101 163 13)",
    secondary: "rgb(132 204 22)",
    accent: "rgb(77 124 15)",
    light: "rgb(190 242 100)",
    dark: "rgb(54 83 20)",
    gradient: "from-lime-600 to-green-700",
    hoverGradient: "hover:from-lime-700 hover:to-green-800",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-lime-300 dark:border-lime-700",
    background: "bg-lime-100/50 dark:bg-lime-950/50",
  },
  service_desk_accra: {
    primary: "rgb(14 116 144)",
    secondary: "rgb(6 182 212)",
    accent: "rgb(21 94 117)",
    light: "rgb(103 232 249)",
    dark: "rgb(22 78 99)",
    gradient: "from-cyan-600 to-cyan-800",
    hoverGradient: "hover:from-cyan-700 hover:to-cyan-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-cyan-300 dark:border-cyan-700",
    background: "bg-cyan-100/50 dark:bg-cyan-950/50",
  },
  service_desk_kumasi: {
    primary: "rgb(14 116 144)",
    secondary: "rgb(6 182 212)",
    accent: "rgb(21 94 117)",
    light: "rgb(103 232 249)",
    dark: "rgb(22 78 99)",
    gradient: "from-cyan-600 to-cyan-800",
    hoverGradient: "hover:from-cyan-700 hover:to-cyan-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-cyan-300 dark:border-cyan-700",
    background: "bg-cyan-100/50 dark:bg-cyan-950/50",
  },
  service_desk_takoradi: {
    primary: "rgb(14 116 144)",
    secondary: "rgb(6 182 212)",
    accent: "rgb(21 94 117)",
    light: "rgb(103 232 249)",
    dark: "rgb(22 78 99)",
    gradient: "from-cyan-600 to-cyan-800",
    hoverGradient: "hover:from-cyan-700 hover:to-cyan-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-cyan-300 dark:border-cyan-700",
    background: "bg-cyan-100/50 dark:bg-cyan-950/50",
  },
  service_desk_tema: {
    primary: "rgb(14 116 144)",
    secondary: "rgb(6 182 212)",
    accent: "rgb(21 94 117)",
    light: "rgb(103 232 249)",
    dark: "rgb(22 78 99)",
    gradient: "from-cyan-600 to-cyan-800",
    hoverGradient: "hover:from-cyan-700 hover:to-cyan-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-cyan-300 dark:border-cyan-700",
    background: "bg-cyan-100/50 dark:bg-cyan-950/50",
  },
  service_desk_sunyani: {
    primary: "rgb(14 116 144)",
    secondary: "rgb(6 182 212)",
    accent: "rgb(21 94 117)",
    light: "rgb(103 232 249)",
    dark: "rgb(22 78 99)",
    gradient: "from-cyan-600 to-cyan-800",
    hoverGradient: "hover:from-cyan-700 hover:to-cyan-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-cyan-300 dark:border-cyan-700",
    background: "bg-cyan-100/50 dark:bg-cyan-950/50",
  },
  service_desk_cape_coast: {
    primary: "rgb(14 116 144)",
    secondary: "rgb(6 182 212)",
    accent: "rgb(21 94 117)",
    light: "rgb(103 232 249)",
    dark: "rgb(22 78 99)",
    gradient: "from-cyan-600 to-cyan-800",
    hoverGradient: "hover:from-cyan-700 hover:to-cyan-900",
    textPrimary: "text-gray-900 dark:text-gray-100",
    textSecondary: "text-gray-700 dark:text-gray-300",
    border: "border-cyan-300 dark:border-cyan-700",
    background: "bg-cyan-100/50 dark:bg-cyan-950/50",
  },
}

export function getRoleColorScheme(role: string): RoleColorScheme {
  return roleColorSchemes[role as UserRole] || roleColorSchemes.staff
}

export function getRoleGradientClass(role: string): string {
  const scheme = getRoleColorScheme(role)
  return `bg-gradient-to-r ${scheme.gradient} ${scheme.hoverGradient}`
}

export function getRoleTextClass(role: string, variant: "primary" | "secondary" = "primary"): string {
  const scheme = getRoleColorScheme(role)
  return variant === "primary" ? scheme.textPrimary : scheme.textSecondary
}

export function getRoleBorderClass(role: string): string {
  const scheme = getRoleColorScheme(role)
  return scheme.border
}

export function getRoleBackgroundClass(role: string): string {
  const scheme = getRoleColorScheme(role)
  return scheme.background
}

export function getRoleHoverClass(role: string): string {
  const scheme = getRoleColorScheme(role)
  return `hover:${scheme.background} hover:${scheme.border}`
}
