-- Schema para criar a tabela de mensagens no Supabase
-- Execute este SQL no painel do Supabase: https://supabase.com/dashboard

-- Criar tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    style VARCHAR(20) NOT NULL,
    topic VARCHAR(30) NOT NULL,
    hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT messages_style_check CHECK (style IN ('humor', 'curiosity', 'tip', 'reflection')),
    CONSTRAINT messages_topic_check CHECK (topic IN ('legal_tech', 'development', 'project_management', 'agile', 'mixed')),
    CONSTRAINT messages_content_length_check CHECK (char_length(content) > 0 AND char_length(content) <= 1000)
);

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_hash ON public.messages(hash);
CREATE INDEX IF NOT EXISTS idx_messages_style ON public.messages(style);
CREATE INDEX IF NOT EXISTS idx_messages_topic ON public.messages(topic);

-- Comentários para documentação
COMMENT ON TABLE public.messages IS 'Armazena todas as mensagens geradas e enviadas pelo bot';
COMMENT ON COLUMN public.messages.id IS 'Identificador único da mensagem';
COMMENT ON COLUMN public.messages.content IS 'Conteúdo da mensagem (máximo 1000 caracteres)';
COMMENT ON COLUMN public.messages.style IS 'Estilo da mensagem: humor, curiosity, tip, reflection';
COMMENT ON COLUMN public.messages.topic IS 'Tópico da mensagem: legal_tech, development, project_management, agile, mixed';
COMMENT ON COLUMN public.messages.hash IS 'Hash SHA-256 do conteúdo para evitar duplicatas';
COMMENT ON COLUMN public.messages.created_at IS 'Data e hora de criação da mensagem';
COMMENT ON COLUMN public.messages.sent_at IS 'Data e hora de envio da mensagem (NULL se não enviada)';

-- RLS (Row Level Security) - opcional, para segurança extra
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Política para permitir leitura e escrita para usuários autenticados
-- Ajuste conforme suas necessidades de segurança
CREATE POLICY "Enable read access for all users" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.messages
    FOR UPDATE USING (true);

-- View para estatísticas rápidas (opcional)
CREATE OR REPLACE VIEW public.message_stats AS
SELECT
    COUNT(*) as total_messages,
    COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END) as sent_messages,
    COUNT(CASE WHEN sent_at IS NULL THEN 1 END) as pending_messages,
    COUNT(CASE WHEN style = 'humor' THEN 1 END) as humor_messages,
    COUNT(CASE WHEN style = 'curiosity' THEN 1 END) as curiosity_messages,
    COUNT(CASE WHEN style = 'tip' THEN 1 END) as tip_messages,
    COUNT(CASE WHEN style = 'reflection' THEN 1 END) as reflection_messages,
    COUNT(CASE WHEN topic = 'legal_tech' THEN 1 END) as legal_tech_messages,
    COUNT(CASE WHEN topic = 'development' THEN 1 END) as development_messages,
    COUNT(CASE WHEN topic = 'project_management' THEN 1 END) as pm_messages,
    COUNT(CASE WHEN topic = 'agile' THEN 1 END) as agile_messages,
    COUNT(CASE WHEN topic = 'mixed' THEN 1 END) as mixed_messages,
    MIN(created_at) as first_message,
    MAX(sent_at) as last_sent
FROM public.messages;

-- Função para limpar mensagens antigas (opcional)
-- Mantém apenas as últimas 1000 mensagens para evitar crescimento descontrolado
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM public.messages
    WHERE id NOT IN (
        SELECT id FROM public.messages
        ORDER BY created_at DESC
        LIMIT 1000
    );
END;
$$;

-- Exemplo de como executar a limpeza (pode ser agendada)
-- SELECT public.cleanup_old_messages();
