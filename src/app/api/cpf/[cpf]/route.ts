import { NextResponse } from 'next/server'

interface CpfResponse {
  nome_completo: string;
  data_nascimento: string;
  situacao: string;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ cpf: string }> }
) {
  const { cpf: rawCpf } = await params
  const cpf = rawCpf.replace(/\D/g, '')

  if (cpf.length !== 11) {
    return NextResponse.json({ error: 'CPF inválido' }, { status: 400 })
  }

  // Lista de Provedores para Fallback
  const providers = [
    {
      name: 'MixAPI',
      url: `https://api.mix-api.xyz/cpf/${cpf}`,
      mapper: (data: any) => ({
        nome_completo: data.nome || data.nome_completo,
        data_nascimento: data.nascimento || data.data_nascimento,
        situacao: data.situacao || 'REGULAR'
      })
    },
    {
      name: 'RecortCloud',
      url: `https://api.ws.recort.cloud/cpf/${cpf}`,
      mapper: (data: any) => ({
        nome_completo: data.nome,
        data_nascimento: data.data_nascimento,
        situacao: data.situacao
      })
    },
    {
      name: 'BrasilAPI',
      url: `https://brasilapi.com.br/api/cpf/v1/${cpf}`,
      mapper: (data: any) => ({
        nome_completo: data.nome_completo,
        data_nascimento: data.data_nascimento,
        situacao: data.situacao
      })
    }
  ]

  for (const provider of providers) {
    try {
      console.log(`Tentando provedor: ${provider.name}`)
      const response = await fetch(provider.url, { 
        signal: AbortSignal.timeout(5000), // Timeout de 5s por fonte
        next: { revalidate: 3600 } 
      })

      if (response.ok) {
        const data = await response.json()
        const normalized = provider.mapper(data)
        
        if (normalized.nome_completo) {
          console.log(`Sucesso com provedor: ${provider.name}`)
          return NextResponse.json(normalized)
        }
      }
    } catch (error) {
      console.warn(`Falha no provedor ${provider.name}:`, error)
      continue // Tenta o próximo
    }
  }

  return NextResponse.json(
    { error: 'Não foi possível consultar o CPF em nenhuma das fontes automáticas. Utilize a consulta manual.' }, 
    { status: 404 }
  )
}
