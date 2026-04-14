
-- =============================================
-- MIGRATION 3: FUNÇÕES E TRIGGERS
-- =============================================

-- FUNÇÃO: user_belongs_to_client
CREATE OR REPLACE FUNCTION public.user_belongs_to_client(_user_id UUID, _client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND client_id = _client_id
  );
$$;

-- FUNÇÃO: has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- FUNÇÃO: is_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('superadmin', 'iara_admin')
  );
$$;

-- FUNÇÃO: get_user_client_id
CREATE OR REPLACE FUNCTION public.get_user_client_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT client_id FROM public.profiles WHERE id = _user_id LIMIT 1;
$$;

-- FUNÇÃO: set_updated_at (trigger)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- FUNÇÃO: sync_plan_limits (trigger)
CREATE OR REPLACE FUNCTION public.sync_plan_limits()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    CASE NEW.plan
      WHEN 'ESSENCIAL' THEN
        NEW.pools_included := 450;
        NEW.users_limit := 2;
      WHEN 'GROWTH' THEN
        NEW.pools_included := 1000;
        NEW.users_limit := 5;
      WHEN 'PRO' THEN
        NEW.pools_included := 2000;
        NEW.users_limit := 8;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;

-- FUNÇÃO: handle_new_user (trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'vendedor');
  RETURN NEW;
END;
$$;

-- FUNÇÃO: consume_pool
CREATE OR REPLACE FUNCTION public.consume_pool(
  _client_id UUID,
  _description TEXT DEFAULT 'IA activation'
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _client public.clients%ROWTYPE;
  _new_used INTEGER;
BEGIN
  SELECT * INTO _client FROM public.clients WHERE id = _client_id FOR UPDATE;
  IF NOT FOUND THEN RETURN FALSE; END IF;
  IF _client.pools_used >= (_client.pools_included + _client.pools_extra) THEN
    RETURN FALSE;
  END IF;
  _new_used := _client.pools_used + 1;
  UPDATE public.clients SET pools_used = _new_used, updated_at = now() WHERE id = _client_id;
  INSERT INTO public.pool_transactions (client_id, type, amount, balance_after, description)
  VALUES (_client_id, 'ai_consume', -1, (_client.pools_included + _client.pools_extra) - _new_used, _description);
  RETURN TRUE;
END;
$$;

-- FUNÇÃO: purchase_additional_pools
CREATE OR REPLACE FUNCTION public.purchase_additional_pools(
  _client_id UUID,
  _quantity INTEGER,
  _price_centavos INTEGER,
  _month_reference TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _current_extra INTEGER;
BEGIN
  SELECT COALESCE(SUM(quantity), 0) INTO _current_extra
  FROM public.extra_pools
  WHERE client_id = _client_id AND month_reference = _month_reference;
  IF (_current_extra + _quantity) > 1000 THEN RETURN FALSE; END IF;
  INSERT INTO public.extra_pools (client_id, quantity, price_centavos, month_reference)
  VALUES (_client_id, _quantity, _price_centavos, _month_reference);
  UPDATE public.clients SET pools_extra = pools_extra + _quantity, updated_at = now() WHERE id = _client_id;
  INSERT INTO public.pool_transactions (client_id, type, amount, balance_after, description)
  VALUES (_client_id, 'extra_purchase', _quantity, 
    (SELECT pools_included + pools_extra - pools_used FROM public.clients WHERE id = _client_id),
    'Compra de ' || _quantity || ' pools extras');
  RETURN TRUE;
END;
$$;

-- FUNÇÃO: can_activate_ai
CREATE OR REPLACE FUNCTION public.can_activate_ai(_client_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT pools_used < (pools_included + pools_extra)
  FROM public.clients WHERE id = _client_id;
$$;

-- TRIGGERS
CREATE TRIGGER trg_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_whatsapp_conversations_updated_at BEFORE UPDATE ON public.whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_sync_plan_limits BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.sync_plan_limits();
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
