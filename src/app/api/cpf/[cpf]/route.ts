import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { cpf: string } }
) {
  const cpf = params.cpf.replace(/\D/g, '')

  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cpf/v1/${cpf}`, {
      next: { revalidate: 3600 } // Cache de 1 hora
    })

    if (response.status === 404) {
      return NextResponse.json({ error: 'CPF não encontrado na base da Receita Federal' }, { status: 404 })
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Erro ao consultar Brasil API' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Erro na rota de CPF:', error)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
