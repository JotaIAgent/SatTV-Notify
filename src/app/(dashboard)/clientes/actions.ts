'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function deleteCliente(id: string) {
  const supabase = await createClient()
  await supabase.from('clientes').delete().eq('id', id)
  revalidatePath('/clientes')
}

export async function confirmarPagamento(clienteId: string) {
  const supabase = await createClient()
  
  // Buscar a assinatura para pegar o próximo vencimento atual
  const { data: assinatura } = await supabase
    .from('assinaturas')
    .select('id, proximo_vencimento')
    .eq('cliente_id', clienteId)
    .single()

  if (assinatura && assinatura.proximo_vencimento) {
    // Adicionar 1 mês usando Date puro para não depender de pacotes no server action se não quiser
    const dataVenc = new Date(assinatura.proximo_vencimento)
    // Se a data de vencimento for invalida, tenta arrumar pegando a atual e somando, mas vamos crer que esta ok
    dataVenc.setUTCMonth(dataVenc.getUTCMonth() + 1)
    
    await supabase.from('assinaturas').update({
      proximo_vencimento: dataVenc.toISOString().split('T')[0]
    }).eq('id', assinatura.id)
    
    // Atualiza status do cliente para ativo (caso estivesse atrasado ou em teste que finalizou)
    await supabase.from('clientes').update({
      status: 'ativo',
      em_teste: false
    }).eq('id', clienteId)
  }

  revalidatePath('/clientes')
  return { success: true }
}
