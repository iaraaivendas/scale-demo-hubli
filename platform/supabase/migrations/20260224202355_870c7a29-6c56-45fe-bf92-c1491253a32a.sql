
-- =============================================
-- MIGRATION 1: ENUMS + PRIMEIRAS 8 TABELAS
-- =============================================

-- ENUMS
CREATE TYPE public.plan_id AS ENUM ('ESSENCIAL', 'GROWTH', 'PRO');
CREATE TYPE public.app_role AS ENUM ('superadmin', 'iara_admin', 'gestor', 'marketing', 'vendedor');
CREATE TYPE public.client_status AS ENUM ('active', 'suspended', 'canceled');
CREATE TYPE public.lead_status AS ENUM ('novo', 'qualificado', 'proposta', 'negociacao', 'ganho', 'perdido', 'reativacao');
CREATE TYPE public.lead_ai_status AS ENUM ('none', 'active', 'paused', 'finished', 'blocked');
CREATE TYPE public.ai_type_id AS ENUM ('commercial', 'reactivation', 'performance', 'upsell', 'marketing', 'copy');
CREATE TYPE public.ai_activation_status AS ENUM ('active', 'paused', 'finished', 'blocked');
CREATE TYPE public.conversation_status AS ENUM ('open', 'closed', 'archived');
CREATE TYPE public.message_sender AS ENUM ('lead', 'ai', 'human');
CREATE TYPE public.payment_status AS ENUM ('paid', 'pending', 'failed');
CREATE TYPE public.payment_type AS ENUM ('subscription', 'extra_pools');
CREATE TYPE public.subscription_status AS ENUM ('active', 'canceled');
CREATE TYPE public.campaign_status AS ENUM ('draft', 'active', 'paused', 'finished');
CREATE TYPE public.campaign_channel AS ENUM ('google_ads', 'meta_ads', 'linkedin', 'email', 'whatsapp', 'organic', 'referral');
CREATE TYPE public.pool_transaction_type AS ENUM ('plan_credit', 'extra_purchase', 'ai_consume', 'manual_adjust');

-- 1. CLIENTS
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  plan public.plan_id NOT NULL DEFAULT 'ESSENCIAL',
  status public.client_status NOT NULL DEFAULT 'active',
  pools_included INTEGER NOT NULL DEFAULT 450,
  pools_extra INTEGER NOT NULL DEFAULT 0,
  pools_used INTEGER NOT NULL DEFAULT 0,
  users_limit INTEGER NOT NULL DEFAULT 2,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. USER_ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'vendedor',
  UNIQUE(user_id, role)
);

-- 4. LEADS
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  status public.lead_status NOT NULL DEFAULT 'novo',
  ai_status public.lead_ai_status NOT NULL DEFAULT 'none',
  source TEXT,
  score INTEGER DEFAULT 0,
  notes TEXT,
  value_centavos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. LEAD_AI_ACTIVATIONS
CREATE TABLE public.lead_ai_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  ai_type public.ai_type_id NOT NULL,
  status public.ai_activation_status NOT NULL DEFAULT 'active',
  activated_by UUID NOT NULL REFERENCES auth.users(id),
  activated_by_name TEXT,
  pool_consumed BOOLEAN NOT NULL DEFAULT false,
  last_interaction TIMESTAMPTZ,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paused_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- 6. AI_ACTIVATIONS (legacy)
CREATE TABLE public.ai_activations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  ai_type public.ai_type_id NOT NULL,
  activated_by UUID NOT NULL REFERENCES auth.users(id),
  pool_consumed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. WHATSAPP_CONVERSATIONS
CREATE TABLE public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  ai_type public.ai_type_id NOT NULL DEFAULT 'commercial',
  status public.conversation_status NOT NULL DEFAULT 'open',
  phone TEXT NOT NULL,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. WHATSAPP_MESSAGES
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  sender public.message_sender NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
