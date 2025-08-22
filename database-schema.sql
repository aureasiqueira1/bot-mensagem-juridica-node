-- Schema atualizado para o bot de conteúdo criativo
-- Execute este SQL no painel do Supabase: https://supabase.com/dashboard

-- Apagar tabela existente se quiser começar do zero (CUIDADO!)
-- DROP TABLE IF EXISTS public.messages CASCADE;

-- Criar tabela de mensagens com novos tópicos
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    style VARCHAR(20) NOT NULL,
    topic VARCHAR(30) NOT NULL,
    hash VARCHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    day_of_week INTEGER, -- Novo: dia da semana (1=segunda, 5=sexta)
    effectiveness VARCHAR(10) DEFAULT 'medium', -- Novo: efetividade da mensagem

    -- Constraints atualizados
    CONSTRAINT messages_style_check CHECK (style IN ('humor', 'curiosity', 'tip', 'reflection')),
    CONSTRAINT messages_topic_check CHECK (topic IN ('tech_humor', 'dev_life', 'code_wisdom', 'tech_facts', 'legal_tech', 'development', 'project_management', 'agile', 'mixed')),
    CONSTRAINT messages_content_length_check CHECK (char_length(content) > 0 AND char_length(content) <= 500),
    CONSTRAINT messages_day_of_week_check CHECK (day_of_week >= 1 AND day_of_week <= 5),
    CONSTRAINT messages_effectiveness_check CHECK (effectiveness IN ('low', 'medium', 'high'))
);

-- Índices otimizados para consultas
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON public.messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_hash ON public.messages(hash);
CREATE INDEX IF NOT EXISTS idx_messages_style ON public.messages(style);
CREATE INDEX IF NOT EXISTS idx_messages_topic ON public.messages(topic);
CREATE INDEX IF NOT EXISTS idx_messages_day_of_week ON public.messages(day_of_week);
CREATE INDEX IF NOT EXISTS idx_messages_effectiveness ON public.messages(effectiveness);

-- Índice composto para consultas por dia e estilo
CREATE INDEX IF NOT EXISTS idx_messages_day_style ON public.messages(day_of_week, style);

-- Comentários atualizados
COMMENT ON TABLE public.messages IS 'Mensagens criativas para dias úteis';
COMMENT ON COLUMN public.messages.id IS 'Identificador único da mensagem';
COMMENT ON COLUMN public.messages.content IS 'Conteúdo criativo da mensagem (máximo 500 caracteres)';
COMMENT ON COLUMN public.messages.style IS 'Estilo: humor, curiosity, tip, reflection';
COMMENT ON COLUMN public.messages.topic IS 'Tópico: tech_humor, dev_life, code_wisdom, tech_facts, legal_tech, mixed';
COMMENT ON COLUMN public.messages.hash IS 'Hash SHA-256 do conteúdo para evitar duplicatas';
COMMENT ON COLUMN public.messages.day_of_week IS 'Dia da semana (1=segunda, 5=sexta)';
COMMENT ON COLUMN public.messages.effectiveness IS 'Efetividade percebida da mensagem';

-- RLS (Row Level Security)
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso
CREATE POLICY "Enable read access for all users" ON public.messages
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.messages
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.messages
    FOR UPDATE USING (true);

-- View para estatísticas de criatividade
CREATE OR REPLACE VIEW public.creative_message_stats AS
SELECT
    COUNT(*) as total_messages,
    COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END) as sent_messages,
    COUNT(CASE WHEN sent_at IS NULL THEN 1 END) as pending_messages,

    -- Estatísticas por estilo
    COUNT(CASE WHEN style = 'humor' THEN 1 END) as humor_messages,
    COUNT(CASE WHEN style = 'curiosity' THEN 1 END) as curiosity_messages,
    COUNT(CASE WHEN style = 'tip' THEN 1 END) as tip_messages,
    COUNT(CASE WHEN style = 'reflection' THEN 1 END) as reflection_messages,

    -- Estatísticas por tópico
    COUNT(CASE WHEN topic = 'tech_humor' THEN 1 END) as tech_humor_messages,
    COUNT(CASE WHEN topic = 'dev_life' THEN 1 END) as dev_life_messages,
    COUNT(CASE WHEN topic = 'code_wisdom' THEN 1 END) as code_wisdom_messages,
    COUNT(CASE WHEN topic = 'tech_facts' THEN 1 END) as tech_facts_messages,
    COUNT(CASE WHEN topic = 'legal_tech' THEN 1 END) as legal_tech_messages,
    COUNT(CASE WHEN topic = 'mixed' THEN 1 END) as mixed_messages,

    -- Estatísticas por dia da semana
    COUNT(CASE WHEN day_of_week = 1 THEN 1 END) as monday_messages,
    COUNT(CASE WHEN day_of_week = 2 THEN 1 END) as tuesday_messages,
    COUNT(CASE WHEN day_of_week = 3 THEN 1 END) as wednesday_messages,
    COUNT(CASE WHEN day_of_week = 4 THEN 1 END) as thursday_messages,
    COUNT(CASE WHEN day_of_week = 5 THEN 1 END) as friday_messages,

    -- Estatísticas de efetividade
    COUNT(CASE WHEN effectiveness = 'high' THEN 1 END) as high_effectiveness,
    COUNT(CASE WHEN effectiveness = 'medium' THEN 1 END) as medium_effectiveness,
    COUNT(CASE WHEN effectiveness = 'low' THEN 1 END) as low_effectiveness,

    -- Datas
    MIN(created_at) as first_message,
    MAX(sent_at) as last_sent,

    -- Média de caracteres
    ROUND(AVG(char_length(content)), 0) as avg_message_length
FROM public.messages;

-- Função para analisar variedade de conteúdo por semana
CREATE OR REPLACE FUNCTION public.analyze_weekly_content_variety()
RETURNS TABLE (
    week_start DATE,
    total_messages BIGINT,
    unique_styles BIGINT,
    unique_topics BIGINT,
    variety_score NUMERIC
)
LANGUAGE SQL
AS $$
    SELECT
        date_trunc('week', created_at)::DATE as week_start,
        COUNT(*) as total_messages,
        COUNT(DISTINCT style) as unique_styles,
        COUNT(DISTINCT topic) as unique_topics,
        ROUND(
            (COUNT(DISTINCT style)::NUMERIC * COUNT(DISTINCT topic)::NUMERIC) /
            GREATEST(COUNT(*)::NUMERIC, 1) * 100,
            2
        ) as variety_score
    FROM public.messages
    WHERE sent_at IS NOT NULL
    GROUP BY date_trunc('week', created_at)
    ORDER BY week_start DESC;
$$;

-- Função para buscar mensagens similares (evitar repetições)
CREATE OR REPLACE FUNCTION public.find_similar_messages(
    input_content TEXT,
    similarity_threshold NUMERIC DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    similarity_score NUMERIC
)
LANGUAGE SQL
AS $$
    SELECT
        m.id,
        m.content,
        m.created_at,
        ROUND(
            LENGTH(input_content) -
            CAST(levenshtein(LOWER(input_content), LOWER(m.content)) AS NUMERIC)
        ) / GREATEST(LENGTH(input_content), LENGTH(m.content)) as similarity_score
    FROM public.messages m
    WHERE sent_at IS NOT NULL
    AND ROUND(
        LENGTH(input_content) -
        CAST(levenshtein(LOWER(input_content), LOWER(m.content)) AS NUMERIC)
    ) / GREATEST(LENGTH(input_content), LENGTH(m.content)) >= similarity_threshold
    ORDER BY similarity_score DESC
    LIMIT 5;
$$;

-- Função para limpar mensagens antigas (manter só últimas 500)
CREATE OR REPLACE FUNCTION public.cleanup_old_messages()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH messages_to_keep AS (
        SELECT id FROM public.messages
        ORDER BY created_at DESC
        LIMIT 500
    )
    DELETE FROM public.messages
    WHERE id NOT IN (SELECT id FROM messages_to_keep);

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- Trigger para automatically set day_of_week
CREATE OR REPLACE FUNCTION public.set_day_of_week()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.day_of_week = EXTRACT(DOW FROM NEW.created_at AT TIME ZONE 'America/Sao_Paulo');
    -- Converte domingo(0) para 7, mantém 1-6 como está
    IF NEW.day_of_week = 0 THEN
        NEW.day_of_week = 7;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_day_of_week
    BEFORE INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.set_day_of_week();

-- View para dashboard de insights
CREATE OR REPLACE VIEW public.content_insights AS
SELECT
    -- Métricas gerais
    COUNT(*) as total_messages,
    COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END) as sent_count,

    -- Top estilos
    mode() WITHIN GROUP (ORDER BY style) as most_used_style,
    mode() WITHIN GROUP (ORDER BY topic) as most_used_topic,

    -- Distribuição por dia
    COUNT(CASE WHEN day_of_week = 1 THEN 1 END) as monday_count,
    COUNT(CASE WHEN day_of_week = 2 THEN 1 END) as tuesday_count,
    COUNT(CASE WHEN day_of_week = 3 THEN 1 END) as wednesday_count,
    COUNT(CASE WHEN day_of_week = 4 THEN 1 END) as thursday_count,
    COUNT(CASE WHEN day_of_week = 5 THEN 1 END) as friday_count,

    -- Métricas de qualidade
    ROUND(AVG(char_length(content)), 1) as avg_length,
    MIN(char_length(content)) as shortest_message,
    MAX(char_length(content)) as longest_message,

    -- Efetividade
    COUNT(CASE WHEN effectiveness = 'high' THEN 1 END) as high_impact_count,
    ROUND(
        COUNT(CASE WHEN effectiveness = 'high' THEN 1 END) * 100.0 /
        NULLIF(COUNT(CASE WHEN sent_at IS NOT NULL THEN 1 END), 0),
        1
    ) as high_impact_percentage,

    -- Atividade recente
    MAX(sent_at) as last_message_sent,
    COUNT(CASE WHEN sent_at > NOW() - INTERVAL '7 days' THEN 1 END) as messages_this_week

FROM public.messages;
