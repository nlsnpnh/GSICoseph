
DELETE FROM auth.users WHERE id = 'ef7c4dc5-3088-4faa-aa68-66ba1c231474';
INSERT INTO public.user_roles (user_id, role) VALUES ('6235d4bb-89ec-4033-9d03-f169a0548f75', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
