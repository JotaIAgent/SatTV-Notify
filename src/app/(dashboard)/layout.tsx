import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TvIcon, Users, Settings, LayoutDashboard, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold md:w-64">
          <TvIcon className="h-6 w-6 text-primary" />
          <span className="hidden md:block">Sat TV Notify</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium ml-auto">
          <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Painel</span>
          </Link>
          <Link href="/clientes" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Clientes</span>
          </Link>
          <Link href="/configuracoes" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Configurações</span>
          </Link>
          
          <form action={async () => {
            'use server'
            const s = await createClient()
            await s.auth.signOut()
            redirect('/login')
          }}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground hover:bg-muted">
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </form>
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        {children}
      </main>
    </div>
  )
}
