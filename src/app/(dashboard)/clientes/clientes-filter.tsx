'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState, useEffect } from 'react'
import { useDebounce } from '@/hooks/use-debounce'

export function ClientesFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const initialQ = searchParams.get('q') || ''
  const initialStatus = searchParams.get('status') || 'todos'

  const [search, setSearch] = useState(initialQ)
  const debouncedSearch = useDebounce(search, 500)

  useEffect(() => {
    handleFilterChange(initialStatus, debouncedSearch || '')
  }, [debouncedSearch])

  const handleFilterChange = (status: string, q: string) => {
    const params = new URLSearchParams()
    if (status && status !== 'todos') params.set('status', status)
    if (q) params.set('q', q)
    
    router.push(`/clientes?${params.toString()}`)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-4">
      <div className="flex-1">
        <Input 
          placeholder="Buscar por nome, celular ou CPF..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
      </div>
      <div className="w-full sm:w-[200px]">
        <Select 
          value={initialStatus} 
          onValueChange={(val) => handleFilterChange(val || '', search || '')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="teste">Em Teste</SelectItem>
            <SelectItem value="atrasado">Atrasados</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
