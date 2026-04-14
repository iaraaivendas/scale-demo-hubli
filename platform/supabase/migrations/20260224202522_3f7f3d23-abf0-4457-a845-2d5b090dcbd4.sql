
-- =============================================
-- MIGRATION 2: TABELAS RESTANTES + INDICES
-- =============================================

-- 9. SCORES
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  score_type TEXT NOT NULL DEFAULT 'general',
  value INTEGER NOT NULL DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. CAMPAIGNS
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  channel public.campaign_channel NOT NULL,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  budget_centavos INTEGER DEFAULT 0,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 11. PAYMENTS
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  amount_centavos INTEGER NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  type public.payment_type NOT NULL DEFAULT 'subscription',
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  plan public.plan_id NOT NULL DEFAULT 'ESSENCIAL',
  monthly_fee_centavos INTEGER NOT NULL DEFAULT 99900,
  pools_included INTEGER NOT NULL DEFAULT 450,
  users_limit INTEGER NOT NULL DEFAULT 2,
  status public.subscription_status NOT NULL DEFAULT 'active',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancel_date TIMESTAMPTZ
);

-- 13. EXTRA_POOLS
CREATE TABLE public.extra_pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  price_centavos INTEGER NOT NULL,
  month_reference TEXT NOT NULL,
  purchase_date TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 14. CAMPAIGNS_FINANCIAL
CREATE TABLE public.campaigns_financial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  channel TEXT NOT NULL,
  spend_centavos INTEGER NOT NULL DEFAULT 0,
  leads INTEGER NOT NULL DEFAULT 0,
  conversions INTEGER NOT NULL DEFAULT 0,
  revenue_attributed_centavos INTEGER NOT NULL DEFAULT 0,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 15. GOALS
CREATE TABLE public.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  monthly_goal_centavos INTEGER NOT NULL DEFAULT 0,
  annual_goal_centavos INTEGER NOT NULL DEFAULT 0,
  month_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 16. POOL_TRANSACTIONS
CREATE TABLE public.pool_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  type public.pool_transaction_type NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  reference_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDICES DE PERFORMANCE
CREATE INDEX idx_profiles_client_id ON public.profiles(client_id);
CREATE INDEX idx_leads_client_id ON public.leads(client_id);
CREATE INDEX idx_leads_assigned_to ON public.leads(assigned_to);
CREATE INDEX idx_leads_status ON public.leads(status);
CREATE INDEX idx_lead_ai_activations_lead_id ON public.lead_ai_activations(lead_id);
CREATE INDEX idx_lead_ai_activations_client_id ON public.lead_ai_activations(client_id);
CREATE INDEX idx_ai_activations_client_id ON public.ai_activations(client_id);
CREATE INDEX idx_whatsapp_conversations_client_id ON public.whatsapp_conversations(client_id);
CREATE INDEX idx_whatsapp_conversations_lead_id ON public.whatsapp_conversations(lead_id);
CREATE INDEX idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_scores_lead_id ON public.scores(lead_id);
CREATE INDEX idx_scores_client_id ON public.scores(client_id);
CREATE INDEX idx_campaigns_client_id ON public.campaigns(client_id);
CREATE INDEX idx_payments_client_id ON public.payments(client_id);
CREATE INDEX idx_subscriptions_client_id ON public.subscriptions(client_id);
CREATE INDEX idx_extra_pools_client_id ON public.extra_pools(client_id);
CREATE INDEX idx_campaigns_financial_client_id ON public.campaigns_financial(client_id);
CREATE INDEX idx_goals_client_id ON public.goals(client_id);
CREATE INDEX idx_pool_transactions_client_id ON public.pool_transactions(client_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
