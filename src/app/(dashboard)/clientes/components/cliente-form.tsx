'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveCliente } from '../form-actions'
import { toast } from 'sonner'
import { Cliente, Assinatura } from '@/types'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'


// Usando o Partial para quando nao estao preenchidos (modo criar)
export default function ClienteForm({ initialData, isEdit = false }: { initialData?: Partial<Cliente & { assinatura: Partial<Assinatura> }>, isEdit?: boolean }) {
  const router = useRouter()
  const [loadingCep, setLoadingCep] = useState(false)
  const [emTeste, setEmTeste] = useState(initialData?.em_teste || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [addressData, setAddressData] = useState({
    endereco: initialData?.endereco || '',
    bairro: initialData?.bairro || '',
    cidade: initialData?.cidade || '',
    estado: initialData?.estado || ''
  })

  // Estados para o CPF
  const [loadingCpf, setLoadingCpf] = useState(false)
  const [cpfStatus, setCpfStatus] = useState<{
    status: 'idle' | 'loading' | 'success' | 'error' | 'not_found',
    message?: string,
    situacao?: string
  }>({ status: 'idle' })

  const [personalData, setPersonalData] = useState({
    nome_completo: initialData?.nome_completo || '',
    data_nascimento: initialData?.data_nascimento || '',
    cpf: initialData?.cpf || ''
  })

  const validateCPF = (cpf: string) => {
    cpf = cpf.replace(/[^\d]+/g, '')
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false
    let add = 0
    for (let i = 0; i < 9; i++) add += parseInt(cpf.charAt(i)) * (10 - i)
    let rev = 11 - (add % 11)
    if (rev === 10 || rev === 11) rev = 0
    if (rev !== parseInt(cpf.charAt(9))) return false
    add = 0
    for (let i = 0; i < 10; i++) add += parseInt(cpf.charAt(i)) * (11 - i)
    rev = 11 - (add % 11)
    if (rev === 10 || rev === 11) rev = 0
    if (rev !== parseInt(cpf.charAt(10))) return false
    return true
  }

  const checkCPF = async (cpfValue: string) => {
    const cleanCpf = cpfValue.replace(/\D/g, '')
    
    if (cleanCpf.length === 11) {
      if (!validateCPF(cleanCpf)) {
        setCpfStatus({ status: 'error', message: 'CPF matematicamente inválido' })
        return
      }

      setLoadingCpf(true)
      setCpfStatus({ status: 'loading' })

      try {
        const res = await fetch(`/api/cpf/${cleanCpf}`)
        const data = await res.json()

        if (res.ok) {
          setCpfStatus({ 
            status: 'success', 
            situacao: data.situacao,
            message: `CPF ${data.situacao}` 
          })
          
          // Auto-preenchimento
          setPersonalData(prev => ({
            ...prev,
            nome_completo: data.nome_completo || prev.nome_completo,
            data_nascimento: data.data_nascimento || prev.data_nascimento
          }))

          toast.success(`CPF encontrado: ${data.situacao}`)
        } else {
          setCpfStatus({ 
            status: res.status === 404 ? 'not_found' : 'error', 
            message: data.error || 'Erro ao consultar CPF' 
          })
        }
      } catch (err) {
        setCpfStatus({ status: 'error', message: 'Erro na conexão com a API' })
      } finally {
        setLoadingCpf(false)
      }
    } else {
      setCpfStatus({ status: 'idle' })
    }
  }


  const checkCEP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    if (cep.length === 8) {
      setLoadingCep(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setAddressData({
            endereco: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            estado: data.uf
          })
        } else {
          toast.error('CEP não encontrado')
        }
      } catch {
        toast.error('Erro ao buscar CEP')
      } finally {
        setLoadingCep(false)
      }
    }
  }

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    const res = await saveCliente(formData, isEdit, initialData?.id)
    setIsSubmitting(false)

    if (res.error) {
      toast.error(res.error)
    } else {
      toast.success(isEdit ? 'Cliente atualizado!' : 'Cliente cadastrado com sucesso!')
      router.push('/clientes')
      router.refresh()
    }
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl">
      <Card>
        <CardHeader>
          <CardTitle>Dados Pessoais</CardTitle>
          <CardDescription>Informações básicas do assinante.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome Completo</Label>
            <Input 
              id="nome" 
              name="nome" 
              value={personalData.nome_completo} 
              onChange={(e) => setPersonalData({...personalData, nome_completo: e.target.value})}
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cpf">CPF</Label>
                {cpfStatus.status !== 'idle' && (
                  <span className={`text-[10px] font-medium flex items-center gap-1 ${
                    cpfStatus.status === 'success' ? (cpfStatus.situacao === 'REGULAR' ? 'text-green-600' : 'text-yellow-600') : 
                    cpfStatus.status === 'error' ? 'text-red-600' : 'text-muted-foreground'
                  }`}>
                    {cpfStatus.status === 'loading' && <Loader2 className="h-2 w-2 animate-spin" />}
                    {cpfStatus.status === 'success' && <CheckCircle2 className="h-2 w-2" />}
                    {(cpfStatus.status === 'error' || cpfStatus.status === 'not_found') && <AlertCircle className="h-2 w-2" />}
                    {cpfStatus.message || (cpfStatus.status === 'success' ? cpfStatus.situacao : '')}
                  </span>
                )}
              </div>
              <Input 
                id="cpf" 
                name="cpf" 
                value={personalData.cpf}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 11)
                  setPersonalData({...personalData, cpf: val})
                  if (val.length === 11) checkCPF(val)
                }}
                placeholder="000.000.000-00"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="data_nascimento">Data de Nascimento</Label>
              <Input 
                id="data_nascimento" 
                name="data_nascimento" 
                type="date" 
                value={personalData.data_nascimento} 
                onChange={(e) => setPersonalData({...personalData, data_nascimento: e.target.value})}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="telefone">Telefone (Whatsapp)</Label>
              <Input id="telefone" name="telefone" defaultValue={initialData?.telefone} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" defaultValue={initialData?.email} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
          <CardDescription>Busca automática pelo CEP (ViaCEP).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="cep">CEP</Label>
              <Input id="cep" name="cep" onChange={checkCEP} defaultValue={initialData?.cep} disabled={loadingCep} required />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 grid gap-2">
              <Label htmlFor="endereco">Logradouro</Label>
              <Input id="endereco" name="endereco" value={addressData.endereco} onChange={(e)=>setAddressData({...addressData, endereco: e.target.value})} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="numero">Número</Label>
              <Input id="numero" name="numero" defaultValue={initialData?.numero} required />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input id="bairro" name="bairro" value={addressData.bairro} onChange={(e)=>setAddressData({...addressData, bairro: e.target.value})} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input id="cidade" name="cidade" value={addressData.cidade} onChange={(e)=>setAddressData({...addressData, cidade: e.target.value})} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="estado">Estado (UF)</Label>
              <Input id="estado" name="estado" maxLength={2} value={addressData.estado} onChange={(e)=>setAddressData({...addressData, estado: e.target.value})} required />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Assinatura & Teste</CardTitle>
          <CardDescription>Configure se está em teste ou já defina os dados da cobrança.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex items-center space-x-2 bg-muted p-4 rounded-lg">
            <Switch id="em_teste" name="em_teste" checked={emTeste} onCheckedChange={setEmTeste} />
            <Label htmlFor="em_teste" className="flex flex-col gap-1">
              <span>Cliente em período de testes</span>
              <span className="font-normal text-xs text-muted-foreground">Isso define a comunicação que será enviada</span>
            </Label>
          </div>

          {emTeste && (
            <div className="grid gap-2 w-1/4">
              <Label htmlFor="dias_teste">Dias de Teste</Label>
              <Input id="dias_teste" name="dias_teste" type="number" min="1" defaultValue={initialData?.dias_teste || 3} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-4">
             <div className="grid gap-2">
              <Label htmlFor="qtd_pontos">Qtd. de Pontos (Telas)</Label>
              <Select name="qtd_pontos" defaultValue={initialData?.assinatura?.qtd_pontos?.toString() || "1"}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Ponto</SelectItem>
                  <SelectItem value="2">2 Pontos</SelectItem>
                  <SelectItem value="3">3 Pontos</SelectItem>
                  <SelectItem value="4">4 Pontos</SelectItem>
                  <SelectItem value="5">5 Pontos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="forma_pagamento">Forma Pagamento</Label>
              <Select name="forma_pagamento" defaultValue={initialData?.assinatura?.forma_pagamento || "Pix"}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pix">Pix</SelectItem>
                  <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                  <SelectItem value="Cartao">Cartão</SelectItem>
                  <SelectItem value="Boleto">Boleto</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="proximo_vencimento">Vencimento da Fatura {isEdit ? '' : '(Opcional)'}</Label>
              <Input id="proximo_vencimento" name="proximo_vencimento" type="date" defaultValue={initialData?.assinatura?.proximo_vencimento} />
              <p className="text-xs text-muted-foreground">{isEdit ? 'Altere para forçar nova data' : 'Deixe em branco para calcular automaticamente com base no Teste.'}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center bg-muted/20 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.push('/clientes')}>Cancelar</Button>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Salvando...' : 'Salvar Cliente'}</Button>
        </CardFooter>
      </Card>
    </form>
  )
}
