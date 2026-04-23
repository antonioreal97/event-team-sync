-- Create admin user directly in auth.users
DO $$
DECLARE
  admin_user_id uuid;
  existing_user_id uuid;
BEGIN
  -- Check if user already exists
  SELECT id INTO existing_user_id FROM auth.users WHERE email = 'admin@frela.com';
  
  IF existing_user_id IS NOT NULL THEN
    -- Update password if user exists
    UPDATE auth.users 
    SET encrypted_password = crypt('admin123', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, now()),
        updated_at = now()
    WHERE id = existing_user_id;
    admin_user_id := existing_user_id;
  ELSE
    -- Create new user
    admin_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      admin_user_id,
      'authenticated',
      'authenticated',
      'admin@frela.com',
      crypt('admin123', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Admin","role":"gestor"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    INSERT INTO auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      admin_user_id,
      jsonb_build_object('sub', admin_user_id::text, 'email', 'admin@frela.com', 'email_verified', true),
      'email',
      admin_user_id::text,
      now(),
      now(),
      now()
    );
  END IF;
  
  -- Ensure profile exists
  INSERT INTO public.profiles (user_id, name, email, experience_level)
  VALUES (admin_user_id, 'Admin', 'admin@frela.com', 'avancado')
  ON CONFLICT (user_id) DO UPDATE SET name = 'Admin', email = 'admin@frela.com';
  
  -- Ensure gestor role (remove other roles, add gestor)
  DELETE FROM public.user_roles WHERE user_id = admin_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (admin_user_id, 'gestor');
END $$;

-- Add unique constraint on profiles.user_id if missing (for ON CONFLICT)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'profiles_user_id_key' AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;