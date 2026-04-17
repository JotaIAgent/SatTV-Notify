import { createClient } from '@/lib/supabase/server'
import ClienteForm from '../components/cliente-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function EditClientePage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()

  const resolvedParams = await params

  const { data: cliente } = await supabase
    .from('clientes')
    .select('*, assinaturas(*)')
    .eq('id', resolvedParams.id)
    .single()

  if (!cliente) {
    notFound()
  }

  // formatar
  const initialData = {
    ...cliente,
    assinatura: cliente.assinaturas?.[0] || {}
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar Cliente</h1>
          <p className="text-sm text-muted-foreground">Altere as informações de {cliente.nome_completo}.</p>
        </div>
      </div>
      
      <ClienteForm initialData={initialData} isEdit={true} />
    </div>
  )
}
