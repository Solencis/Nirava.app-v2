/*
  # Configuration du stockage pour les photos de journal

  1. Bucket de stockage
    - Création du bucket `journal-images` pour stocker les photos des utilisateurs
    - Configuration sécurisée avec accès restreint aux utilisateurs authentifiés

  2. Politiques de sécurité (RLS)
    - Upload : utilisateurs authentifiés uniquement dans leur dossier personnel
    - Lecture : propriétaire uniquement (sécurité maximale)
    - Suppression : propriétaire uniquement

  3. Structure des fichiers
    - Organisation par utilisateur : `{user_id}/{filename}`
    - Formats supportés : JPG, PNG, WebP
    - Taille maximale : 5MB par fichier
*/

-- 1. Créer le bucket pour les images de journal (privé par défaut)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'journal-images',
  'journal-images', 
  false,
  5242880, -- 5MB en bytes
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- 2. Politique pour l'upload - utilisateurs authentifiés dans leur dossier
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT 
  WITH CHECK (
    bucket_id = 'journal-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Politique pour la lecture - propriétaire uniquement
CREATE POLICY "Users can read own images" ON storage.objects
  FOR SELECT 
  USING (
    bucket_id = 'journal-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 4. Politique pour la suppression - propriétaire uniquement
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE 
  USING (
    bucket_id = 'journal-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5. Politique pour la mise à jour - propriétaire uniquement
CREATE POLICY "Users can update own images" ON storage.objects
  FOR UPDATE 
  USING (
    bucket_id = 'journal-images' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );