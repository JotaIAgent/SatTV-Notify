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

  const { 
    evolution_api_url, 
    evolution_api_key, 
    evolution_instance, 
    numeros_internos,
    msg_teste_vencendo,
    msg_vencimento_hoje,
    msg_atraso
  } = config

  // Função auxiliar de envio Evolution API - Corrigida para padrão Evolution v1/v2
  async function sendMessage(number: string, text: string) {
    try {
      // Limpar a URL para evitar barra dupla
      const baseUrl = evolution_api_url.replace(/\/$/, '');
      const endpoint = `${baseUrl}/message/sendText/${evolution_instance}`
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: evolution_api_key
        },
        body: JSON.stringify({
          number: number,
          text: text // Evolution API espera 'text' direto para sendText
        })
      })

      if (!response.ok) {
        console.error(`Erro API Evolution (${response.status}):`, await response.text())
      }
    } catch (e) {
      console.error(`Erro ao enviar msgs para ${number}`, e)
    }
  }

  let messagesToSend: string[] = []
  
  const hojeStr = new Date().toISOString().split('T')[0] // yyyy-mm-dd em UTC

  // Helper para substituir variáveis nos templates
  const replaceTags = (template: string, data: any) => {
    return template
      .replace(/{{nome}}/g, data.nome_completo || '')
      .replace(/{{telefone}}/g, data.telefone || '')
      .replace(/{{cpf}}/g, data.cpf || '')
      .replace(/{{plano}}/g, `${data.qtd_pontos || 1} Pontos`)
      .replace(/{{vencimento}}/g, data.proximo_vencimento || '');
  }

  // 1. Processar Período de Teste: Buscar quem está em teste e terminou os dias
  const { data: clientesEmTeste } = await supabase.from('clientes').select('*').eq('em_teste', true)
  
  if (clientesEmTeste) {
    for (const c of clientesEmTeste) {
      if (c.data_inicio_teste) {
        const d_inicio = new Date(c.data_inicio_teste)
        d_inicio.setDate(d_inicio.getDate() + c.dias_teste)
        const d_final = d_inicio.toISOString().split('T')[0]
        
        if (d_final <= hojeStr) {
          const template = msg_teste_vencendo || `🟡 *Aviso de Teste*: Cliente *{{nome}}* terminou o período de teste hoje. (Tel: {{telefone}}). Verificar cobrança ou desligar os pontos.`
          messagesToSend.push(replaceTags(template, { ...c, proximo_vencimento: d_final }))
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
        const template = msg_vencimento_hoje || `🔵 *Vencimento Hoje*: Cliente *{{nome}}* (Tel: {{telefone}}) vence hoje. Pagar via {{forma_pagamento}}. (Pontos: {{plano}})`
        messagesToSend.push(replaceTags(template, { ...c, ...ass }))
      } else if (ass.proximo_vencimento && ass.proximo_vencimento < hojeStr && c.status !== 'cancelado') {
        if (c.status !== 'atrasado') {
          await supabase.from('clientes').update({ status: 'atrasado' }).eq('id', c.id)
        }
        const template = msg_atraso || `🔴 *ATRASO*: O Cliente *{{nome}}* (Tel: {{telefone}}) está atrasado. O vencimento era: {{vencimento}}.`
        messagesToSend.push(replaceTags(template, { ...c, ...ass }))
      }
    }
  }

  // Se houver msgs, dispare para os numeros configurados
  if (messagesToSend.length > 0) {
    // Dividir em mensagens separadas se houver muitas, ou enviar um resumo
    // Vamos manter o resumo por enquanto mas corrigindo o formato
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
