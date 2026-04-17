'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'
import { testEvoConnection } from './actions'
import { toast } from 'sonner'

export function EvoTestButton() {
  const [loading, setLoading] = useState(false)

  const handleTest = async () => {
    setLoading(true)
    toast.info('Enviando mensagem de teste...')
    
    try {
      const res = await testEvoConnection()
      if (res?.error) {
        toast.error(res.error)
        if (res.details) {
          console.error('Detalhes do erro API:', res.details)
        }
      } else {
        toast.success('Mensagem enviada com sucesso ao WhatsApp!')
      }
    } catch (e: any) {
      toast.error('Ocorreu um erro no servidor.', { description: e.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      type="button" 
      variant="secondary" 
      onClick={handleTest} 
      disabled={loading}
      className="ml-4"
    >
      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
      Disparar Teste
    </Button>
  )
}
