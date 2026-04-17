'use client'

import { useState } from 'react'
import Link from 'next/link'
import { confirmarPagamento, deleteCliente } from './actions'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, CheckCircle2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuGroup,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ClientesListActions({ clienteId, temAssinatura }: { clienteId: string, temAssinatura: boolean }) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const router = useRouter()

  const handleConfirm = async () => {
    setIsConfirming(true)
    toast.promise(confirmarPagamento(clienteId), {
      loading: 'Confirmando...',
      success: 'Pagamento confirmado e notificação movida para o próximo mês!',
      error: 'Erro ao confirmar pagamento',
      finally: () => setIsConfirming(false)
    })
  }

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir o cliente?')) return
    setIsDeleting(true)
    toast.promise(deleteCliente(clienteId), {
      loading: 'Excluindo...',
      success: 'Cliente excluído com sucesso.',
      error: 'Erro ao excluir.',
      finally: () => setIsDeleting(false)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md text-sm font-medium hover:bg-muted hover:text-accent-foreground h-8 w-8 p-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <span className="sr-only">Abrir menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          
          {temAssinatura && (
            <DropdownMenuItem onClick={handleConfirm} disabled={isConfirming}>
              <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
              Confirmar Pagamento
            </DropdownMenuItem>
          )}
          
          <DropdownMenuItem onClick={() => router.push(`/clientes/${clienteId}`)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600 focus:bg-red-100 focus:text-red-900">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
