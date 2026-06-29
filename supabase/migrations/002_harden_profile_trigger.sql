-- Harden profile creation on signup (avoid opaque auth errors when trigger fails)

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  desired_username text;
BEGIN
  desired_username := COALESCE(
    NULLIF(trim(NEW.raw_user_meta_data->>'username'), ''),
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, desired_username)
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    INSERT INTO public.profiles (id, email, username)
    VALUES (
      NEW.id,
      NEW.email,
      desired_username || '_' || substring(replace(NEW.id::text, '-', ''), 1, 6)
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;
