import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TvIcon, Users, AlertCircle, CalendarClock, Activity } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Queries para as métricas
  const { count: countTotal } = await supabase.from('clientes').select('*', { count: 'exact', head: true })
  const { count: countTeste } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('status', 'teste')
  const { count: countAtivos } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('status', 'ativo')
  const { count: countAtrasados } = await supabase.from('clientes').select('*', { count: 'exact', head: true }).eq('status', 'atrasado')

  // Trabalhando datas no servidor (fuso horário local aproximado UTC-X dependendo do deploy, 
  // sugerido usar date-fns-tz em prod mas para MVP usaremos UTC basico formatado para ISO date)
  const hoje = new Date()
  const hojeStr = hoje.toISOString().split('T')[0]
  
  const amanha = new Date(hoje)
  amanha.setDate(amanha.getDate() + 1)
  const amanhaStr = amanha.toISOString().split('T')[0]

  const { count: vencemHoje } = await supabase.from('assinaturas')
    .select('*', { count: 'exact', head: true })
    .eq('proximo_vencimento', hojeStr)
    
  const { count: vencemAmanha } = await supabase.from('assinaturas')
    .select('*', { count: 'exact', head: true })
    .eq('proximo_vencimento', amanhaStr)

  return (
    <>
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Resumo do Sistema</h1>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Link href="/clientes?status=ativo" className="transition-transform hover:scale-105">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clientes Ativos</CardTitle>
              <Activity className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countAtivos || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Assinaturas pagas em dia
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clientes?status=teste" className="transition-transform hover:scale-105">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Em Período de Teste</CardTitle>
              <TvIcon className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countTeste || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Testes não convertidos
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/clientes?status=atrasado" className="transition-transform hover:scale-105">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Clientes Atrasados</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{countAtrasados || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Pagamentos em aberto
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vencimentos (Hoje/Amanhã)</CardTitle>
            <CalendarClock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vencemHoje || 0} / {vencemAmanha || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Mensalidades próximas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3 mt-4">
        {/* Futuro: Tabela de últimas assinaturas cobradas ou de notificações recentes */}
        <Card className="xl:col-span-2" x-chunk="dashboard-01-chunk-4">
          <CardHeader className="flex flex-row items-center">
            <div className="grid gap-2">
              <CardTitle>Painel Principal</CardTitle>
              <CardContent className="px-0 pt-4 text-sm text-muted-foreground">
                <p>Navegue pelas abas superiores para acessar o controle de Clientes e agendamento de mensagens. Configure os dados da Evolution API na aba Configurações.</p>
              </CardContent>
            </div>
          </CardHeader>
        </Card>
      </div>
    </>
  )
}
