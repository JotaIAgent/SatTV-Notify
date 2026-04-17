'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function saveCliente(formData: FormData, isEdit: boolean, clienteId?: string) {
  const supabase = await createClient()

  // Extrair todos os campos do FormData
  const nome = formData.get('nome') as string
  const cpf = formData.get('cpf') as string
  const data_nascimento = formData.get('data_nascimento') as string
  const telefone = formData.get('telefone') as string
  const email = formData.get('email') as string
  const cep = formData.get('cep') as string
  const endereco = formData.get('endereco') as string
  const numero = formData.get('numero') as string
  const bairro = formData.get('bairro') as string
  const cidade = formData.get('cidade') as string
  const estado = formData.get('estado') as string
  
  const em_teste = formData.get('em_teste') === 'on'
  const dias_teste = parseInt(formData.get('dias_teste') as string) || 0
  
  // Dados de assinatura
  const qtd_pontos = parseInt(formData.get('qtd_pontos') as string) || 1
  const forma_pagamento = formData.get('forma_pagamento') as string
  const dia_vencimento = parseInt(formData.get('dia_vencimento') as string) || 10
  
  // Calculos automáticos
  const data_inicio_teste = em_teste ? new Date().toISOString() : null
  
  // Status default inicial
  let status = em_teste ? 'teste' : 'ativo'
  
  const clienteData = {
    nome_completo: nome,
    cpf,
    data_nascimento: data_nascimento || null,
    telefone,
    email,
    cep,
    endereco,
    numero,
    bairro,
    cidade,
    estado,
    em_teste,
    dias_teste,
    data_inicio_teste,
    status
  }

  let finalClienteId = clienteId

  if (isEdit && finalClienteId) {
    // Manter o status anterior ou alterar caso estava em teste e agora nao esta
    // Se quiser algo mais complexo deve ser tratado com mais logica no server
    const { error: errUpdate } = await supabase.from('clientes').update(clienteData).eq('id', finalClienteId)
    if (errUpdate) return { error: errUpdate.message }
  } else {
    // Cria novo
    const { data: newCliente, error: errInsert } = await supabase.from('clientes').insert(clienteData).select('id').single()
    if (errInsert) return { error: errInsert.message }
    finalClienteId = newCliente.id
  }

  const proximo_vencimento_manual = formData.get('proximo_vencimento') as string

  // Tratamento da assinatura
  const assinaturaData: any = {
    cliente_id: finalClienteId,
    qtd_pontos,
    forma_pagamento
  }

  // O Plano e "Paga e Usa" com as proximas faturas fixas
  if (proximo_vencimento_manual) {
    assinaturaData.proximo_vencimento = proximo_vencimento_manual
    assinaturaData.dia_vencimento = parseInt(proximo_vencimento_manual.split('-')[2], 10)
  } else if (!isEdit) {
    // A data de vencimento mensal sera definida automaticamente na CRIACAO do clliente se nao preenchida manual
    const h = new Date()
    
    // Se esta em teste, ele só vai ter que pagar apos expirar os dias de teste:
    if (em_teste) {
      h.setDate(h.getDate() + dias_teste)
    } 
    // Se nao estiver em teste, ele deve hoje. `h` permanece sendo hoje.
    
    assinaturaData.proximo_vencimento = h.toISOString().split('T')[0]
    assinaturaData.dia_vencimento = h.getDate()
  }

  // Verifica se o cliente ja tem assinatura vinculada
  const { data: existeAssin} = await supabase.from('assinaturas').select('id').eq('cliente_id', finalClienteId!).single()
  
  if (existeAssin) {
    await supabase.from('assinaturas').update(assinaturaData).eq('id', existeAssin.id)
  } else {
    await supabase.from('assinaturas').insert(assinaturaData)
  }

  revalidatePath('/clientes')
  return { success: true }
}
