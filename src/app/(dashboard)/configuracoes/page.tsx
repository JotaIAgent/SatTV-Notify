import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { saveConfig } from './actions'
import { EvoTestButton } from './test-button'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: config } = await supabase.from('configuracoes').select('*').limit(1).single()

  // Extrair numeros do JSONB
  const savedNumbers = config?.numeros_internos ? (config.numeros_internos as string[]).join(', ') : ''

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configurações</h2>
        <p className="text-muted-foreground">
          Gerencie as integrações da Evolution API e personalize os alertas internos.
        </p>
      </div>

      <form key={config?.id || 'nova_form'} action={async (formData) => {
        'use server';
        await saveConfig(formData);
      }} className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Coluna Esquerda: Conexão e API */}
        <Card>
          <CardHeader>
            <CardTitle>Conexão & API</CardTitle>
            <CardDescription>
              Dados técnicos para o funcionamento do disparo via Evolution API.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="evolution_api_url">URL da API</Label>
              <Input 
                id="evolution_api_url" 
                name="evolution_api_url" 
                placeholder="https://api.evolution.sua-url.com" 
                defaultValue={config?.evolution_api_url || ''}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="evolution_api_key">Global API Key</Label>
              <Input 
                id="evolution_api_key" 
                name="evolution_api_key" 
                type="password"
                placeholder="Sua chava apikey..." 
                defaultValue={config?.evolution_api_key || ''}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="evolution_instance">Nome da Instância</Label>
              <Input 
                id="evolution_instance" 
                name="evolution_instance" 
                placeholder="TV_Admin" 
                defaultValue={config?.evolution_instance || ''}
              />
            </div>

            <div className="grid gap-2 mt-4">
              <Label htmlFor="numeros_internos">Números que receberão os avisos</Label>
              <Input 
                id="numeros_internos" 
                name="numeros_internos" 
                placeholder="5511999999999, 5511888888888" 
                defaultValue={savedNumbers}
              />
              <p className="text-xs text-muted-foreground">
                Separe por vírgulas. Apenas estes números recebem os alertas.
              </p>
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4 flex justify-between">
            <Button type="submit">Salvar Configurações</Button>
            <EvoTestButton />
          </CardFooter>
        </Card>

        {/* Coluna Direita: Templates de Mensagens */}
        <Card>
          <CardHeader>
            <CardTitle>Personalizar Alertas</CardTitle>
            <CardDescription>
              Tags: <code className="bg-background border px-1 rounded text-[10px]">{"{{nome}}"}</code> <code className="bg-background border px-1 rounded text-[10px]">{"{{telefone}}"}</code> <code className="bg-background border px-1 rounded text-[10px]">{"{{cpf}}"}</code> <code className="bg-background border px-1 rounded text-[10px]">{"{{plano}}"}</code> <code className="bg-background border px-1 rounded text-[10px]">{"{{vencimento}}"}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="msg_teste_vencendo" className="text-xs">Alerta: Teste Acabando</Label>
              <textarea 
                id="msg_teste_vencendo" 
                name="msg_teste_vencendo" 
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={config?.msg_teste_vencendo || '⚠️ *Alerta de Teste*: O cliente {{nome}} (CPF: {{cpf}}) está com o teste vencendo hoje. Plano: {{plano}}.'}
              ></textarea>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="msg_vencimento_hoje" className="text-xs">Alerta: Cobrança Hoje</Label>
              <textarea 
                id="msg_vencimento_hoje" 
                name="msg_vencimento_hoje" 
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={config?.msg_vencimento_hoje || '💰 *Cobrança Hoje*: Hoje vence o cliente {{nome}} (CPF: {{cpf}}). Plano: {{plano}}.'}
              ></textarea>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="msg_atraso" className="text-xs">Alerta: Atrasado</Label>
              <textarea 
                id="msg_atraso" 
                name="msg_atraso" 
                rows={3}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                defaultValue={config?.msg_atraso || '🚨 *Atraso*: O cliente {{nome}} (CPF: {{cpf}}) não pagou! Plano: {{plano}}.'}
              ></textarea>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
