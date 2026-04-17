import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Garantir proteção no Vercel Cron
  // Em produção, a Vercel envia um Bearer token no cabeçalho Authorization se configurado
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // Usar a Service Role Key pois isto será executado em background (não há usuário logado)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: config } = await supabase.from('configuracoes').select('*').limit(1).single()

  if (!config || !config.evolution_api_url || !config.evolution_api_key || !config.evolution_instance || !config.numeros_internos?.length) {
    return NextResponse.json({ error: 'Configuração Incompleta' }, { status: 400 })
  }

  const { evolution_api_url, evolution_api_key, evolution_instance, numeros_internos } = config

  // Função auxiliar de envio Evolution API
  async function sendMessage(number: string, text: string) {
    try {
      const endpoint = `${evolution_api_url}/message/sendText/${evolution_instance}`
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: evolution_api_key
        },
        body: JSON.stringify({
          number: number,
          textMessage: {
            text: text
          }
        })
      })
    } catch (e) {
      console.error(`Erro ao enviar msgs para ${number}`, e)
    }
  }

  let messagesToSend: string[] = []
  
  const hojeStr = new Date().toISOString().split('T')[0] // yyyy-mm-dd em UTC

  // 1. Processar Período de Teste: Buscar quem está em teste e terminou os dias
  const { data: clientesEmTeste } = await supabase.from('clientes').select('*').eq('em_teste', true)
  
  if (clientesEmTeste) {
    for (const c of clientesEmTeste) {
      if (c.data_inicio_teste) {
        const d_inicio = new Date(c.data_inicio_teste)
        // Adiciona os dias
        d_inicio.setDate(d_inicio.getDate() + c.dias_teste)
        const d_final = d_inicio.toISOString().split('T')[0]
        
        if (d_final <= hojeStr) {
          // Atualiza pra fechar o teste (opcional, ou so notifica)
          // Mas vamos notificar
          messagesToSend.push(`🟡 *Aviso de Teste*: Cliente *${c.nome_completo}* terminou o período de teste hoje. (Tel: ${c.telefone}). Verificar cobrança ou desligar os pontos.`)
        }
      }
    }
  }

  // 2. Vencimentos do Dia e Atrasos
  const { data: assinaturas } = await supabase.from('assinaturas').select('*, cliente:clientes(*)')

  if (assinaturas) {
    for (const ass of assinaturas) {
      const c = ass.cliente
      if (!c) continue

      if (ass.proximo_vencimento === hojeStr) {
        messagesToSend.push(`🔵 *Vencimento Hoje*: Cliente *${c.nome_completo}* (Tel: ${c.telefone}) vence hoje. Pagar via ${ass.forma_pagamento}. (Pontos: ${ass.qtd_pontos})`)
      } else if (ass.proximo_vencimento && ass.proximo_vencimento < hojeStr && c.status !== 'cancelado') {
        // Se a data do proximo vencimento já passou, ele está atrasado.
        // Opcional: Atualizar status do cliente para atrasado no banco automaticamente.
        if (c.status !== 'atrasado') {
          await supabase.from('clientes').update({ status: 'atrasado' }).eq('id', c.id)
        }
        messagesToSend.push(`🔴 *ATRASO*: O Cliente *${c.nome_completo}* (Tel: ${c.telefone}) está atrasado. O vencimento era: ${ass.proximo_vencimento}.`)
      }
    }
  }

  // Se houver msgs, dispare para os numeros configurados
  if (messagesToSend.length > 0) {
    const textoGeral = `📅 *Resumo Diário - Sat TV Notify*\n\n` + messagesToSend.join('\n\n')

    for (const numeroInterno of numeros_internos) {
      await sendMessage(numeroInterno, textoGeral)
    }
  }

  return NextResponse.json({ 
    success: true, 
    messagesFound: messagesToSend.length,
    processedTargets: numeros_internos 
  })
}
