'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveConfig(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Não autorizado' }

  const url = formData.get('evolution_api_url') as string
  const key = formData.get('evolution_api_key') as string
  const instance = formData.get('evolution_instance') as string
  const numbersStr = formData.get('numeros_internos') as string

  // Arquivos de Mensagens
  const msg_teste_vencendo = formData.get('msg_teste_vencendo') as string
  const msg_vencimento_hoje = formData.get('msg_vencimento_hoje') as string
  const msg_atraso = formData.get('msg_atraso') as string

  // Tratar a string de números para array JSONB
  const numbersArray = numbersStr ? numbersStr.split(',').map(n => n.trim()).filter(Boolean) : []

  // Check se ja tem config
  const { data: config } = await supabase.from('configuracoes').select('id').limit(1).single()

  const pushData = {
    evolution_api_url: url,
    evolution_api_key: key,
    evolution_instance: instance,
    numeros_internos: numbersArray,
    msg_teste_vencendo,
    msg_vencimento_hoje,
    msg_atraso
  }

  if (config?.id) {
    // Update
    const { error } = await supabase.from('configuracoes')
      .update(pushData)
      .eq('id', config.id)
      
    if (error) return { error: error.message }
  } else {
    // Insert
    const { error } = await supabase.from('configuracoes')
      .insert(pushData)
      
    if (error) return { error: error.message }
  }

  revalidatePath('/configuracoes')
  return { success: true }
}

export async function testEvoConnection() {
  const supabase = await createClient()
  
  const { data: config } = await supabase.from('configuracoes').select('*').limit(1).single()
  
  if (!config || !config.evolution_api_url || !config.evolution_api_key || !config.evolution_instance) {
    return { error: 'Evolution API não configurada corretamente.' }
  }

  const numeros = config.numeros_internos as string[]
  if (!numeros || numeros.length === 0) {
    return { error: 'Nenhum número interno configurado para receber o teste.' }
  }

  const endpoint = `${config.evolution_api_url.replace(/\/$/, '')}/message/sendText/${config.evolution_instance}`
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': config.evolution_api_key
      },
      body: JSON.stringify({
        number: numeros[0], // testa apenas com o primeiro numero
        delay: 1000,
        text: "🚀 *Teste de Conexão*\n\nEssa é uma mensagem de teste do seu novo Sistema de Gestão de TV Privado."
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return { error: `Erro na API: ${response.statusText}`, details: err }
    }

    return { success: true }
  } catch (error: any) {
    return { error: 'Erro de Requisição', details: error.message }
  }
}
