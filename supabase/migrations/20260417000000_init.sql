-- Tabelas Base

CREATE TYPE status_cliente AS ENUM ('teste', 'ativo', 'atrasado', 'cancelado');
CREATE TYPE forma_pagamento AS ENUM ('Pix', 'Dinheiro', 'Cartao', 'Boleto', 'Outro');
CREATE TYPE tipo_notificacao AS ENUM ('teste_vencendo', 'cobranca_vencendo', 'atraso', 'personalizada');

-- Clientes
CREATE TABLE public.clientes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    nome_completo TEXT NOT NULL,
    cpf TEXT,
    data_nascimento DATE,
    telefone TEXT,
    email TEXT,
    senha TEXT, -- opcional caso a autenticação do próprio supabase seja usada, mas solicitado "Criar form com email/senha"
    cep TEXT,
    endereco TEXT,
    numero TEXT,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    em_teste BOOLEAN DEFAULT false,
    dias_teste INTEGER DEFAULT 0,
    data_inicio_teste TIMESTAMP WITH TIME ZONE,
    status status_cliente DEFAULT 'teste',
    user_id UUID REFERENCES auth.users(id) -- ID interno do dono saas, útil se for multi-tenant (mas o usuário disse sistema privado para ele)
);

-- Assinaturas
CREATE TABLE public.assinaturas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    qtd_pontos INTEGER NOT NULL CHECK (qtd_pontos BETWEEN 1 AND 5),
    forma_pagamento forma_pagamento NOT NULL,
    dia_vencimento INTEGER NOT NULL CHECK (dia_vencimento BETWEEN 1 AND 31),
    notificar_antes_dias INTEGER DEFAULT 3,
    notificar_no_dia BOOLEAN DEFAULT true,
    notificar_atraso_dias INTEGER DEFAULT 1,
    proximo_vencimento DATE -- Este campo controla a data exata da próxima fatura
);

-- Notificacoes
CREATE TABLE public.notificacoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    data_agendada DATE NOT NULL,
    hora_agendada TIME NOT NULL,
    tipo tipo_notificacao NOT NULL,
    enviada BOOLEAN DEFAULT false
);

-- Configuracoes Unicas
CREATE TABLE public.configuracoes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    evolution_api_url TEXT,
    evolution_api_key TEXT,
    evolution_instance TEXT,
    numeros_internos JSONB DEFAULT '[]'::jsonb
);

-- RLS (Simples: Somente Admin com acesso ao Supabase usando Service Role ou Usuários Autenticados podem gerenciar)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuracoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso total se autenticado" ON public.clientes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Acesso total se autenticado" ON public.assinaturas FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Acesso total se autenticado" ON public.notificacoes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Acesso total se autenticado" ON public.configuracoes FOR ALL USING (auth.uid() IS NOT NULL);
