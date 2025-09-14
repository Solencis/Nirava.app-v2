/*
  # Ajouter les fonctionnalités de partage Journal vers Communauté

  1. Modifications de la table posts
    - Ajouter `source_type` pour identifier l'origine du post
    - Ajouter `image_url` pour les photos partagées
    - Ajouter `metadata` pour stocker des données supplémentaires (durée méditation, etc.)

  2. Bucket Storage
    - Créer le bucket `journal_uploads` pour les photos
    - Configurer les politiques d'accès

  3. Sécurité
    - RLS sur le bucket pour que chaque utilisateur accède seulement à ses photos
    - Politiques de lecture publique pour les images partagées
*/

-- Ajouter colonnes à la table posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE posts ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Créer le bucket pour les uploads du journal
INSERT INTO storage.buckets (id, name, public) 
VALUES ('journal_uploads', 'journal_uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Politique pour permettre aux utilisateurs d'uploader leurs propres photos
CREATE POLICY "Users can upload their own journal photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'journal_uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre aux utilisateurs de voir leurs propres photos
CREATE POLICY "Users can view their own journal photos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'journal_uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Politique pour permettre la lecture publique des photos partagées
CREATE POLICY "Public can view shared journal photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'journal_uploads');

-- Politique pour permettre aux utilisateurs de supprimer leurs propres photos
CREATE POLICY "Users can delete their own journal photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'journal_uploads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);