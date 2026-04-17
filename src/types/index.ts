export type StatusCliente = 'teste' | 'ativo' | 'atrasado' | 'cancelado'
export type FormaPagamento = 'Pix' | 'Dinheiro' | 'Cartao' | 'Boleto' | 'Outro'

export interface Cliente {
  id: string
  created_at: string
  nome_completo: string
  cpf: string
  data_nascimento: string
  telefone: string
  email: string
  cep: string
  endereco: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  em_teste: boolean
  dias_teste: number
  data_inicio_teste: string
  status: StatusCliente
}

export interface Assinatura {
  id: string
  cliente_id: string
  qtd_pontos: number
  forma_pagamento: FormaPagamento
  dia_vencimento: number
  notificar_antes_dias: number
  notificar_no_dia: boolean
  notificar_atraso_dias: number
  proximo_vencimento: string // date
}

export interface ExtendedCliente extends Cliente {
  assinaturas?: Assinatura[]
}
