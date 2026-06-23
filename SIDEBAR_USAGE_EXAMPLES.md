/**
 * 📝 EXEMPLOS PRÁTICOS DE USO
 * 
 * Como usar os novos componentes da sidebar
 */

// ============================================================================
// 1️⃣ EXEMPLO SIMPLES - Sidebar básica (já está no StudentLayout)
// ============================================================================

import Sidebar from '@/components/sidebar'

function MyApp() {
  return (
    <Sidebar
      userName="João Silva"
      userInitial="J"
      userAvatar="/avatars/joao.jpg"
      userRole="Estudante"
      footer={
        <div className="space-y-2">
          <button>Configurações</button>
          <button>Logout</button>
        </div>
      }
    />
  )
}

// ============================================================================
// 2️⃣ EXEMPLO - Acessar estado da sidebar em outro componente
// ============================================================================

import { useSidebar } from '@/components/sidebar/hooks/useSidebar'

function MyComponent() {
  const { isCollapsed, isMobileOpen, closeMobile } = useSidebar()

  return (
    <div>
      {isCollapsed && <p>Sidebar colapsada</p>}
      {isMobileOpen && <p>Sidebar aberta no mobile</p>}
      <button onClick={closeMobile}>Fechar sidebar no mobile</button>
    </div>
  )
}

// ============================================================================
// 3️⃣ EXEMPLO - ConversationsList usa automaticamente useChatStore
// ============================================================================

import { ConversationsList } from '@/components/sidebar'

// Isso já funciona! ConversationsList automaticamente:
// - Chama hydrateConversations() na montagem
// - Renderiza conversas do useChatStore
// - Mostra activeConversationId como highlighted
// - Abre menu com options

// ============================================================================
// 4️⃣ EXEMPLO FUTURO - Adicionar nova seção
// ============================================================================

// Se quiser adicionar uma nova seção (ex: Favoritas), é simples:

import { SidebarSection } from '@/components/sidebar'

function FavoritesList() {
  const favorites = useFavoritesStore((s) => s.favorites)

  return (
    <SidebarSection title="Favoritas" icon="⭐" defaultOpen={true}>
      {favorites.map(fav => (
        <div key={fav.id}>{fav.name}</div>
      ))}
    </SidebarSection>
  )
}

// Depois adicionar em SidebarContent.tsx:
// <FavoritesList isCollapsed={isCollapsed} closeMobile={closeMobile} />

// ============================================================================
// 5️⃣ EXEMPLO - Menu customizado
// ============================================================================

import { useState, useRef, useEffect } from 'react'

function CustomMenu({ item, icon }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Padrão usado em ConversationMenu e RoomMenu:
  // - Click fora fecha
  // - Renderiza em dropdown
  // - Z-index alto (1500)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)}>⋯</button>
      {isOpen && (
        <div className="absolute right-0 z-[1500] mt-1 w-48 rounded-lg bg-white shadow-lg">
          {/* opções */}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// 6️⃣ EXEMPLO - Integração com StudentLayout
// ============================================================================

// ❌ Como era antes:
// const StudentLayout = ({ children }) => {
//   const { isMobileSidebarOpen, openMobileSidebar, closeMobileSidebar } = useUIStore()
//   const { isSidebarCollapsed, toggleSidebar } = useUIStore()
//   
//   return <StudentSidebar
//     isMobileSidebarOpen={isMobileSidebarOpen}
//     closeMobileSidebar={closeMobileSidebar}
//     isSidebarCollapsed={isSidebarCollapsed}
//     toggleSidebar={toggleSidebar}
//     // ... 10+ props mais
//   />
// }

// ✅ Como é agora:
const StudentLayout = ({ children }) => {
  return <StudentSidebar
    userName="João"
    userInitial="J"
    // Sidebar gerencia seu próprio estado via useSidebar()!
  />
}

// ============================================================================
// 7️⃣ EXEMPLO - Mobile vs Desktop
// ============================================================================

// Desktop: 🖥️
// Sidebar sempre visível (relative)
// Click no avatar → collapse/expand
// Width toggling entre w-16 e w-72

// Mobile: 📱
// Sidebar fixed na esquerda
// Hamburger no header →opens sidebar
// useSidebar().isMobileOpen controla translate-x
// Click no overlay fecha

// Tudo no MESMO componente (Sidebar.tsx) 🎉

// ============================================================================
// 8️⃣ EXEMPLO - Conversas com ações
// ============================================================================

// ConversationItem renderiza:
// <div className="flex items-center justify-between">
//   <button onClick={handleClick}>
//     {conversation.title}  ← Navega quando clicado
//   </button>
//   <ConversationMenu conversation={conversation} />  ← Menu ⋯
// </div>

// ConversationMenu renderiza:
// - Duplicar ✅ (implementado)
// -enomear (placeholder)
// - Excluir ✅ (com confirmação)

// ============================================================================
// 9️⃣ EXEMPLO - Estrutura de um novo hook (para RoomsList futura)
// ============================================================================

// O mesmo padrão usado por useChatStore
// e useSidebar pode ser usado para qualquer nova feature:

// const useTeachersStore = create<TeacherState>((set, get) => ({
//   teachers: [],
//   selectedTeacherId: null,
//   hydrateTeachers: async () => { /* fetch */ },
//   selectTeacher: (id) => set({ selectedTeacherId: id }),
// }))

// Depois criar TeachersList similar a ConversationsList:
// export default function TeachersList() {
//   const teachers = useTeachersStore(s => s.teachers)
//   const hydrateTeachers = useTeachersStore(s => s.hydrateTeachers)
//   useEffect(() => hydrateTeachers(), [])
//   return <SidebarSection>
//     {teachers.map(t => <TeacherItem key={t.id} teacher={t} />)}
//   </SidebarSection>
// }

// ============================================================================
// 🔟 CHECKLIST - Antes de usar em produção
// ============================================================================

/*
✅ Pastas criadas
✅ Componentes principais prontos
✅ Conversas funcionam
✅ StudentSidebar refatorada
✅ Mobile e desktop testados
⏳ Remover componentes antigos (SidebarRooms, SidebarConversations)
⏳ Implementar useRoomsStore (rooms/)
⏳ Testar em todos os devices
⏳ Documentação finalizada
*/

// ============================================================================
// Próximos Passos:
// 1. Testar integração completa
// 2. Remover SidebarRooms.tsx e SidebarConversations.tsx
// 3. Implementar busca/filtro de conversas
// 4. Adicionar "Nova conversa" botão no header da seção
// ============================================================================
