'use client'

import { useState } from 'react'

type SidebarSearchProps = {
  onSearch: (value: string) => void
}

export default function SidebarSearch({ onSearch }: SidebarSearchProps) {
  const [query, setQuery] = useState('')

  return (
    <div className="pb-3">
      <input
        placeholder="Buscar conversas e salas..."
        value={query}
        onChange={(event) => {
          const value = event.target.value
          setQuery(value)
          onSearch(value)
        }}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
      />
    </div>
  )
}
