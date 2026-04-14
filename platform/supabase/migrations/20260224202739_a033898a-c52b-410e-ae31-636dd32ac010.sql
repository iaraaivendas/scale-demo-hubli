
-- =============================================
-- MIGRATION 4: RLS + POLÍTICAS MULTI-TENANT
-- =============================================

-- HABILITAR RLS EM TODAS AS 16 TABELAS
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_ai_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_activations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns_financial ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pool_transactions ENABLE ROW LEVEL SECURITY;

-- ========== CLIENTS ==========
CREATE POLICY "Admins can view all clients" ON public.clients FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view own client" ON public.clients FOR SELECT TO authenticated
  USING (id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Admins can insert clients" ON public.clients FOR INSERT TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== PROFILES ==========
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Gestors can view client profiles" ON public.profiles FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());
CREATE POLICY "Admins can update any profile" ON public.profiles FOR UPDATE TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- ========== USER_ROLES ==========
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== LEADS ==========
CREATE POLICY "Admins can view all leads" ON public.leads FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client leads" ON public.leads FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Users can insert client leads" ON public.leads FOR INSERT TO authenticated
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Users can update client leads" ON public.leads FOR UPDATE TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete leads" ON public.leads FOR DELETE TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== LEAD_AI_ACTIVATIONS ==========
CREATE POLICY "Admins can view all activations" ON public.lead_ai_activations FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client activations" ON public.lead_ai_activations FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Users can insert client activations" ON public.lead_ai_activations FOR INSERT TO authenticated
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));
CREATE POLICY "Users can update client activations" ON public.lead_ai_activations FOR UPDATE TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));

-- ========== AI_ACTIVATIONS ==========
CREATE POLICY "Admins can view all ai_activations" ON public.ai_activations FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client ai_activations" ON public.ai_activations FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Users can insert ai_activations" ON public.ai_activations FOR INSERT TO authenticated
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));

-- ========== WHATSAPP_CONVERSATIONS ==========
CREATE POLICY "Admins can view all conversations" ON public.whatsapp_conversations FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client conversations" ON public.whatsapp_conversations FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Users can manage client conversations" ON public.whatsapp_conversations FOR ALL TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));

-- ========== WHATSAPP_MESSAGES ==========
CREATE POLICY "Users can view conversation messages" ON public.whatsapp_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.whatsapp_conversations c
    WHERE c.id = conversation_id
    AND (c.client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()))
  ));
CREATE POLICY "Users can insert messages" ON public.whatsapp_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.whatsapp_conversations c
    WHERE c.id = conversation_id
    AND (c.client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()))
  ));

-- ========== SCORES ==========
CREATE POLICY "Admins can view all scores" ON public.scores FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client scores" ON public.scores FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Users can insert client scores" ON public.scores FOR INSERT TO authenticated
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));

-- ========== CAMPAIGNS ==========
CREATE POLICY "Admins can view all campaigns" ON public.campaigns FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client campaigns" ON public.campaigns FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Users can manage client campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));

-- ========== PAYMENTS ==========
CREATE POLICY "Admins can view all payments" ON public.payments FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client payments" ON public.payments FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== SUBSCRIPTIONS ==========
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client subscriptions" ON public.subscriptions FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()));

-- ========== EXTRA_POOLS ==========
CREATE POLICY "Admins can view all extra_pools" ON public.extra_pools FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client extra_pools" ON public.extra_pools FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Users can insert extra_pools" ON public.extra_pools FOR INSERT TO authenticated
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));

-- ========== CAMPAIGNS_FINANCIAL ==========
CREATE POLICY "Admins can view all campaigns_financial" ON public.campaigns_financial FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client campaigns_financial" ON public.campaigns_financial FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Users can manage client campaigns_financial" ON public.campaigns_financial FOR ALL TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));

-- ========== GOALS ==========
CREATE POLICY "Admins can view all goals" ON public.goals FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client goals" ON public.goals FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "Users can manage client goals" ON public.goals FOR ALL TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));

-- ========== POOL_TRANSACTIONS ==========
CREATE POLICY "Admins can view all pool_transactions" ON public.pool_transactions FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
CREATE POLICY "Users can view client pool_transactions" ON public.pool_transactions FOR SELECT TO authenticated
  USING (client_id = public.get_user_client_id(auth.uid()));
CREATE POLICY "System can insert pool_transactions" ON public.pool_transactions FOR INSERT TO authenticated
  WITH CHECK (client_id = public.get_user_client_id(auth.uid()) OR public.is_admin(auth.uid()));
