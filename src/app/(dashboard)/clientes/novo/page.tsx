import ClienteForm from '../components/cliente-form'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NovoClientePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Cliente</h1>
          <p className="text-sm text-muted-foreground">Adicione um novo assinante ao sistema.</p>
        </div>
      </div>
      
      <ClienteForm />
    </div>
  )
}
