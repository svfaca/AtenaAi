**📐 Diagrama da Arquitetura Nova da Sidebar**

```mermaid
graph TD
    A["StudentLayout"] -->|converte props| B["StudentSidebar<br/>(Feature Wrapper)"]
    B -->|chama| C["Sidebar<br/>(NEW - Único)"]
    
    C -->|usa| D["useSidebar Hook<br/>- isCollapsed<br/>- isMobileOpen"]
    
    C -->|renderiza| E["SidebarContent"]
    E -->|renderiza| F["ConversationsList"]
    E -->|renderiza| G["RoomsList"]
    
    F -->|usa| H["useChatStore<br/>- conversations<br/>- activeConversationId"]
    F -->|renderiza loop| I["ConversationItem<br/>+ ConversationMenu"]
    
    G -->|usa| J["useRoomsStore<br/>TODO"]
    G -->|renderiza loop| K["RoomItem<br/>+ RoomMenu"]
    
    C -->|renderiza| L["SidebarFooter"]
    L -->|contém| M["Configurações, Logout,<br/>Quem Somos"]
    
    C -->|overlay mobile| N["Overlay<br/>- Fecha ao clicar"]
    C -->|animações| O["Transitions<br/>- Desktop collapse<br/>- Mobile slide"]
    
    style C fill:#00ff00,stroke:#000,stroke-width:3px
    style D fill:#ffff00,stroke:#000
    style H fill:#ffff00,stroke:#000
    style J fill:#ffff00,stroke:#000
    style I fill:#00ccff,stroke:#000
    style K fill:#00ccff,stroke:#000
```

**Benefícios Visuais:**

🟢 **Sidebar Component** - Único container, gerencia tudo
🟡 **Hooks** - Única fonte de verdade por domínio
🔵 **Items** - Componentes simples e focados
⚫ **Props** - Eliminadas (uso de hooks direto)

**Fluxo de Dados (antes vs depois):**

❌ **Antes - Prop Drilling:**
```
StudentLayout
  → props (15+)
    → StudentSidebar
      → props (10+)
        → SidebarConversations
          → onSelectConversation (callback)
          → onDeleteConversation (callback)
```

✅ **Depois - Direto via Hooks:**
```
StudentLayout
  → StudentSidebar (minimal props)
    → Sidebar + ConversationsList
      useChatStore() → useChatStore() [local]
      useSidebar() → useSidebar() [local]
```
```

Salve como: `SIDEBAR_ARCHITECTURE_DIAGRAM.md`
