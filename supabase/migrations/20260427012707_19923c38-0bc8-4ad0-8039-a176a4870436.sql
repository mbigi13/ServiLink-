
-- ============= PROFILES =============
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'User',
  avatar_url TEXT,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  is_provider BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Insert own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Update own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= ENUMS =============
CREATE TYPE public.job_status AS ENUM ('OPEN', 'IN_PROGRESS', 'DONE');
CREATE TYPE public.urgency_level AS ENUM ('Now', 'Today', 'Flexible');
CREATE TYPE public.offer_status AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- ============= JOBS (table only, policies later) =============
CREATE TABLE public.jobs (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL,
  budget NUMERIC(10,2),
  urgency public.urgency_level NOT NULL DEFAULT 'Flexible',
  status public.job_status NOT NULL DEFAULT 'OPEN',
  accepted_offer_id UUID,
  rating_stars INT,
  rating_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX jobs_creator_idx ON public.jobs(creator_id);
CREATE INDEX jobs_status_idx ON public.jobs(status);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============= OFFERS =============
CREATE TABLE public.offers (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  price NUMERIC(10,2) NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  eta TEXT NOT NULL,
  status public.offer_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX offers_job_idx ON public.offers(job_id);
CREATE INDEX offers_provider_idx ON public.offers(provider_id);
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- ============= JOBS POLICIES (now offers exists) =============
CREATE POLICY "Jobs visibility"
  ON public.jobs FOR SELECT TO authenticated
  USING (
    status = 'OPEN'
    OR creator_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.offers o
      WHERE o.job_id = jobs.id AND o.provider_id = auth.uid()
    )
  );
CREATE POLICY "Insert own job"
  ON public.jobs FOR INSERT TO authenticated WITH CHECK (creator_id = auth.uid());
CREATE POLICY "Update own job"
  ON public.jobs FOR UPDATE TO authenticated USING (creator_id = auth.uid());
CREATE POLICY "Delete own job"
  ON public.jobs FOR DELETE TO authenticated USING (creator_id = auth.uid());

-- ============= OFFERS POLICIES =============
CREATE POLICY "Offer visibility"
  ON public.offers FOR SELECT TO authenticated
  USING (
    provider_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = offers.job_id AND j.creator_id = auth.uid())
  );
CREATE POLICY "Insert offer on open job"
  ON public.offers FOR INSERT TO authenticated
  WITH CHECK (
    provider_id = auth.uid()
    AND EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.status = 'OPEN')
  );
CREATE POLICY "Update offer by stakeholder"
  ON public.offers FOR UPDATE TO authenticated
  USING (
    provider_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = offers.job_id AND j.creator_id = auth.uid())
  );

-- ============= MESSAGES =============
CREATE TABLE public.messages (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX messages_job_idx ON public.messages(job_id, created_at);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own messages"
  ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());
CREATE POLICY "Send own messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- ============= ACTIVITY =============
CREATE TABLE public.activity (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX activity_user_idx ON public.activity(user_id, created_at DESC);
ALTER TABLE public.activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read own activity"
  ON public.activity FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Update own activity"
  ON public.activity FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Insert own activity"
  ON public.activity FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ============= TRIGGERS =============
CREATE OR REPLACE FUNCTION public.notify_new_offer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_creator UUID; v_provider_name TEXT;
BEGIN
  SELECT creator_id INTO v_creator FROM public.jobs WHERE id = NEW.job_id;
  SELECT name INTO v_provider_name FROM public.profiles WHERE id = NEW.provider_id;
  IF v_creator IS NOT NULL AND v_creator <> NEW.provider_id THEN
    INSERT INTO public.activity(user_id, kind, job_id, title, body)
    VALUES (v_creator, 'offer', NEW.job_id, 'New offer received',
      COALESCE(v_provider_name, 'Provider') || ' • $' || NEW.price::text || ' • ' || NEW.eta);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER offers_notify_insert AFTER INSERT ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_offer();

CREATE OR REPLACE FUNCTION public.handle_offer_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'ACCEPTED' AND (OLD.status IS DISTINCT FROM 'ACCEPTED') THEN
    UPDATE public.jobs SET status = 'IN_PROGRESS', accepted_offer_id = NEW.id WHERE id = NEW.job_id;
    UPDATE public.offers SET status = 'DECLINED'
      WHERE job_id = NEW.job_id AND id <> NEW.id AND status = 'PENDING';
    INSERT INTO public.activity(user_id, kind, job_id, title, body)
    VALUES (NEW.provider_id, 'status', NEW.job_id, 'Offer accepted', 'Job is now in progress.');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER offers_accepted AFTER UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.handle_offer_accepted();

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_sender_name TEXT;
BEGIN
  SELECT name INTO v_sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.activity(user_id, kind, job_id, title, body)
  VALUES (NEW.recipient_id, 'message', NEW.job_id, COALESCE(v_sender_name, 'Someone'), NEW.text);
  RETURN NEW;
END; $$;
CREATE TRIGGER messages_notify_insert AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- ============= REALTIME =============
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity;

ALTER TABLE public.jobs REPLICA IDENTITY FULL;
ALTER TABLE public.offers REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.activity REPLICA IDENTITY FULL;
