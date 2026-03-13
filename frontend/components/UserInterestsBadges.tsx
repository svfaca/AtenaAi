/**
 * UserInterestsBadges - Componente para exibir interesses do usuário com badges
 * 
 * Exemplo de uso correto da arquitetura:
 *   - Banco armazena IDs: ["math", "physics", "programming"]
 *   - Componente renderiza labels: "Matemática", "Física", "Programação"
 * 
 * Benefícios:
 *   ✅ IDs estáveis (nunca mudam)
 *   ✅ Labels traduzíveis
 *   ✅ Fácil adicionar novos interesses
 *   ✅ Queries eficientes no banco
 */

import { getInterestLabel } from "@/lib/constants/interests"

type UserInterestsBadgesProps = {
  interests: string[]
  variant?: "default" | "secondary" | "outline"
  size?: "sm" | "md" | "lg"
  maxDisplay?: number
}

export function UserInterestsBadges({
  interests,
  variant = "default",
  size = "md",
  maxDisplay,
}: UserInterestsBadgesProps) {
  if (!interests || interests.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        Nenhum interesse selecionado
      </div>
    )
  }

  // Limitar número de badges exibidos
  const displayInterests = maxDisplay
    ? interests.slice(0, maxDisplay)
    : interests
  const remainingCount = maxDisplay ? interests.length - maxDisplay : 0

  // Estilos por variant
  const variantStyles = {
    default: "bg-blue-100 text-blue-800 border-blue-200",
    secondary: "bg-gray-100 text-gray-800 border-gray-200",
    outline: "bg-transparent text-gray-700 border-gray-300",
  }

  // Estilos por size
  const sizeStyles = {
    sm: "text-xs px-2 py-0.5 rounded",
    md: "text-sm px-3 py-1 rounded-md",
    lg: "text-base px-4 py-1.5 rounded-lg",
  }

  const badgeClass = `inline-flex items-center border ${variantStyles[variant]} ${sizeStyles[size]}`

  return (
    <div className="flex flex-wrap gap-2">
      {displayInterests.map((interestId) => (
        <span key={interestId} className={badgeClass}>
          {getInterestLabel(interestId)}
        </span>
      ))}

      {remainingCount > 0 && (
        <span className={`${badgeClass} font-semibold`}>
          +{remainingCount}
        </span>
      )}
    </div>
  )
}

/**
 * Exemplo de uso em um perfil de usuário:
 * 
 * ```tsx
 * import { UserInterestsBadges } from "@/components/UserInterestsBadges"
 * 
 * export function UserProfile({ user }: { user: AuthUser }) {
 *   return (
 *     <div className="space-y-4">
 *       <h2 className="text-xl font-bold">{user.full_name}</h2>
 *       
 *       <div>
 *         <h3 className="text-sm font-medium text-gray-700 mb-2">
 *           Áreas de Interesse
 *         </h3>
 *         <UserInterestsBadges 
 *           interests={user.interests}
 *           variant="default"
 *           size="md"
 *         />
 *       </div>
 *     </div>
 *   )
 * }
 * ```
 * 
 * Exemplo com UI library (shadcn/ui):
 * 
 * ```tsx
 * import { Badge } from "@/components/ui/badge"
 * import { getInterestLabel } from "@/lib/constants/interests"
 * 
 * export function UserProfileBadges({ interests }: { interests: string[] }) {
 *   return (
 *     <div className="flex flex-wrap gap-2">
 *       {interests.map((id) => (
 *         <Badge key={id} variant="secondary">
 *           {getInterestLabel(id)}
 *         </Badge>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
