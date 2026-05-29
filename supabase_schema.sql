-- ============================================================
-- SUPABASE SQL COMPLETO PARA PETADOPT
-- Ejecutar en orden en Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- ============================================================
-- 1. ESQUEMA BASE: TABLAS PRINCIPALES
-- ============================================================

-- PERFILES (extiende auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  avatar_url TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- PRODUCTOS (mascotas en adopción)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DOUBLE PRECISION NOT NULL DEFAULT 0,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SALAS DE CHAT
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- MENSAJES
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT,
  image_url TEXT,
  author_username TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- SOLICITUDES DE ADOPCIÓN
CREATE TABLE IF NOT EXISTS adoption_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL,
  pet_name TEXT NOT NULL,
  pet_image TEXT,
  adopter_id UUID NOT NULL,
  adopter_username TEXT NOT NULL,
  shelter_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'enviada'
    CHECK (status IN ('enviada', 'revisando', 'entrevista', 'aprobada', 'rechazada')),
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_products_seller ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_rooms_product ON rooms(product_id);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_messages_room ON messages(room_id);
CREATE INDEX IF NOT EXISTS idx_messages_user ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_adoption_applications_adopter ON adoption_applications(adopter_id);
CREATE INDEX IF NOT EXISTS idx_adoption_applications_shelter ON adoption_applications(shelter_id);
CREATE INDEX IF NOT EXISTS idx_adoption_applications_pet ON adoption_applications(pet_id);

-- ============================================================
-- 3. TRIGGER: auto-crear perfil al registrarse
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE adoption_applications ENABLE ROW LEVEL SECURITY;

-- ---------------
-- POLÍTICAS: profiles
-- ---------------

-- Todos los autenticados pueden leer perfiles
CREATE POLICY "Perfiles visibles para autenticados"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Usuario edita solo su propio perfil
CREATE POLICY "Usuario edita su perfil"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Usuario inserta su propio perfil
CREATE POLICY "Usuario inserta su perfil"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ---------------
-- POLÍTICAS: products
-- ---------------

-- Todos los autenticados pueden ver productos
CREATE POLICY "Productos visibles para autenticados"
  ON products FOR SELECT
  TO authenticated
  USING (true);

-- Solo vendedor crea productos
CREATE POLICY "Vendedor publica mascota"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

-- Solo vendedor actualiza su producto
CREATE POLICY "Vendedor actualiza su mascota"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- Solo vendedor elimina su producto
CREATE POLICY "Vendedor elimina su mascota"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

-- ---------------
-- POLÍTICAS: rooms
-- ---------------

-- Usuario ve sus propias salas
CREATE POLICY "Usuario ve sus salas"
  ON rooms FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Vendedor ve salas de sus productos
CREATE POLICY "Vendedor ve salas de sus productos"
  ON rooms FOR SELECT
  TO authenticated
  USING (
    product_id IN (
      SELECT id FROM products WHERE seller_id = auth.uid()
    )
  );

-- Usuario crea sala
CREATE POLICY "Usuario crea sala"
  ON rooms FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- ---------------
-- POLÍTICAS: messages
-- ---------------

-- Usuario ve mensajes de sus salas
CREATE POLICY "Usuario ve mensajes de sus salas"
  ON messages FOR SELECT
  TO authenticated
  USING (
    room_id IN (SELECT id FROM rooms WHERE created_by = auth.uid())
    OR
    room_id IN (
      SELECT r.id FROM rooms r
      JOIN products p ON r.product_id = p.id
      WHERE p.seller_id = auth.uid()
    )
  );

-- Usuario envía mensajes en sus salas
CREATE POLICY "Usuario envía mensaje en sus salas"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    room_id IN (SELECT id FROM rooms WHERE created_by = auth.uid())
    OR
    room_id IN (
      SELECT r.id FROM rooms r
      JOIN products p ON r.product_id = p.id
      WHERE p.seller_id = auth.uid()
    )
  );

-- ---------------
-- POLÍTICAS: adoption_applications
-- ---------------

-- Adoptante ve sus solicitudes
CREATE POLICY "Adoptante ve sus solicitudes"
  ON adoption_applications FOR SELECT
  TO authenticated
  USING (adopter_id = auth.uid());

-- Refugio ve solicitudes de sus mascotas
CREATE POLICY "Refugio ve solicitudes recibidas"
  ON adoption_applications FOR SELECT
  TO authenticated
  USING (shelter_id = auth.uid());

-- Adoptante crea solicitud
CREATE POLICY "Adoptante crea solicitud"
  ON adoption_applications FOR INSERT
  TO authenticated
  WITH CHECK (adopter_id = auth.uid());

-- Refugio actualiza estado de solicitud
CREATE POLICY "Refugio actualiza estado"
  ON adoption_applications FOR UPDATE
  TO authenticated
  USING (shelter_id = auth.uid())
  WITH CHECK (shelter_id = auth.uid());

-- ============================================================
-- 5. AUTENTICACIÓN
-- ============================================================

-- Email confirmation config
-- Ve a Supabase Dashboard > Authentication > Settings:
--   - Enable "Confirm email" para nuevos usuarios
--   - Configurar SMTP si deseas emails personalizados

-- Google OAuth config
-- Ve a Supabase Dashboard > Authentication > Providers > Google:
--   1. Habilitar Google provider
--   2. Crear credenciales OAuth en Google Cloud Console
--      (https://console.cloud.google.com/apis/credentials)
--   3. Configurar redirect URIs en Google:
--      https://<PROJECT_REF>.supabase.co/auth/v1/callback
--   4. Pegar Client ID y Client Secret en Supabase

-- ============================================================
-- 6. STORAGE: BUCKETS E IMÁGENES
-- ============================================================

-- Crear bucket para imágenes de chat (si no existe)
-- Ejecutar en Supabase Dashboard > Storage, o via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('chat-images', 'chat-images', true)
ON CONFLICT (id) DO NOTHING;

-- Crear bucket para imágenes de mascotas
INSERT INTO storage.buckets (id, name, public)
VALUES ('pet_images', 'pet_images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. POLÍTICAS DE STORAGE
-- ============================================================

-- chat-images: autenticados pueden ver y subir
CREATE POLICY "Chat images visibles para todos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'chat-images');

CREATE POLICY "Autenticados suben a chat-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'chat-images');

-- pet_images: autenticados pueden ver y subir
CREATE POLICY "Pet images visibles para todos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'pet_images');

CREATE POLICY "Autenticados suben a pet_images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'pet_images');

CREATE POLICY "Dueño puede eliminar su imagen"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id IN ('chat-images', 'pet_images') AND owner = auth.uid());

-- ============================================================
-- 8. PERMISOS DE ESQUEMA PÚBLICO
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

-- ============================================================
-- FIN
-- ============================================================
