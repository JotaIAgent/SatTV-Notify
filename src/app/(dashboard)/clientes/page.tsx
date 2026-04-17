import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ExtendedCliente } from '@/types'
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlusCircle, Edit, Trash2, CheckCircle2 } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ClientComponent para gerenciar interações como Confirmar Pagamento e Deletar
import ClientesListActions from './client-actions'
import { ClientesFilter } from './clientes-filter'

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ status?: string, q?: string }> }) {
  const supabase = await createClient()

  const resolvedParams = await searchParams
  const q = resolvedParams.q || ''
  const statusFilter = resolvedParams.status || 'todos'

  // Buscar clientes com a primeira assinatura vinculada para mostrar datas
  let query = supabase
    .from('clientes')
    .select(`
      *,
      assinaturas ( id, dia_vencimento, proximo_vencimento )
    `)
    .order('created_at', { ascending: false })

  if (statusFilter && statusFilter !== 'todos') {
    query = query.eq('status', statusFilter)
  }

  if (q) {
    query = query.or(`nome_completo.ilike.%${q}%,telefone.ilike.%${q}%,cpf.ilike.%${q}%`)
  }

  const { data: clientes } = await query

  const formatStatus = (status: string) => {
    switch (status) {
      case 'teste': return <Badge className="bg-yellow-500 hover:bg-yellow-600">Teste</Badge>
      case 'ativo': return <Badge className="bg-green-500 hover:bg-green-600">Ativo</Badge>
      case 'atrasado': return <Badge variant="destructive">Atrasado</Badge>
      default: return <Badge variant="secondary">Cancelado</Badge>
    }
  }

  const formatData = (isoDateString?: string) => {
    if (!isoDateString) return 'Não Definido'
    try {
      // Como salvamos proximo_vencimento em "YYYY-MM-DD" e ele retorna assim
      const [year, month, day] = isoDateString.split('-')
      return `${day}/${month}/${year}`
    } catch {
      return isoDateString
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Gerenciar Clientes</h1>
        <Link href="/clientes/novo">
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Adicionar Cliente</span>
          </Button>
        </Link>
      </div>

      <ClientesFilter />

      <Card>
        <CardHeader>
          <CardTitle>Base de Assinantes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vencimento do Mês (Dia)</TableHead>
                <TableHead>Próximo Pagamento</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes?.map((cliente: any) => {
                const assinatura = cliente.assinaturas?.[0]
                return (
                  <TableRow key={cliente.id}>
                    <TableCell className="font-medium">
                      {cliente.nome_completo}
                      <div className="text-xs text-muted-foreground">{cliente.telefone}</div>
                    </TableCell>
                    <TableCell>{formatStatus(cliente.status)}</TableCell>
                    <TableCell>{assinatura?.dia_vencimento ? `Todo dia ${assinatura.dia_vencimento}` : 'N/A'}</TableCell>
                    <TableCell>{formatData(assinatura?.proximo_vencimento)}</TableCell>
                    <TableCell className="text-right">
                      <ClientesListActions clienteId={cliente.id} temAssinatura={!!assinatura} />
                    </TableCell>
                  </TableRow>
                )
              })}
              {(!clientes || clientes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Nenhum cliente cadastrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
