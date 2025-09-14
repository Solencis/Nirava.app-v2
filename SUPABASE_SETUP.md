# 🔐 Configuration Supabase pour Nirava

## 📋 Tables à créer

### 1. Table `checkins`
```sql
CREATE TABLE checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  emotion TEXT,
  intensity INTEGER CHECK (intensity >= 0 AND intensity <= 10),
  need TEXT,
  notes TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour performance (user_id + created_at)
CREATE INDEX idx_checkins_user_created ON checkins(user_id, created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can read own checkins" ON checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON checkins
  FOR DELETE USING (auth.uid() = user_id);
```

### 2. Table `journals`
```sql
CREATE TABLE journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour performance
CREATE INDEX idx_journals_user_created ON journals(user_id, created_at DESC);

-- RLS
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can read own journals" ON journals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journals" ON journals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journals" ON journals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own journals" ON journals
  FOR DELETE USING (auth.uid() = user_id);
```

### 4. Table `meditation_sessions`
```sql
CREATE TABLE meditation_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  type TEXT DEFAULT 'free',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index pour performance
CREATE INDEX idx_meditation_sessions_user_created ON meditation_sessions(user_id, created_at DESC);

-- RLS
ALTER TABLE meditation_sessions ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can read own meditation sessions" ON meditation_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meditation sessions" ON meditation_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meditation sessions" ON meditation_sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meditation sessions" ON meditation_sessions
  FOR DELETE USING (auth.uid() = user_id);
```

### 3. Table `post_comments`
```sql
CREATE TABLE post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index pour performance
CREATE INDEX idx_post_comments_post_id ON post_comments(post_id);
CREATE INDEX idx_post_comments_user_id ON post_comments(user_id);

-- RLS
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Policies RLS
CREATE POLICY "Users can read all comments" ON post_comments
  FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON post_comments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON post_comments
  FOR DELETE USING (auth.uid() = user_id);
```

## 📸 Storage pour photos

### 1. Créer le bucket `journal-images`
- Dans Supabase Dashboard → Storage
- Create bucket: `journal-images`
- **Public: OFF** (sécurisé)

### 2. Policies Storage
```sql
-- Upload: utilisateurs authentifiés seulement
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'journal-images' 
    AND auth.role() = 'authenticated'
  );

-- Read: propriétaire seulement (ou tous les authentifiés si tu préfères)
CREATE POLICY "Users can read own images" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'journal-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Delete: propriétaire seulement
CREATE POLICY "Users can delete own images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'journal-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## ⚙️ Configuration Auth

### Configuration Email (IMPORTANT)
Dans Supabase Dashboard → Authentication → Settings:

**Option 1: Désactiver la confirmation par email (recommandé pour le développement)**
```
Enable email confirmations: OFF
```

**Option 2: Configurer les emails (pour la production)**
```
Enable email confirmations: ON
SMTP Settings: Configurez votre serveur SMTP
```

### URL Configuration (Dashboard → Auth → URL Configuration)
```
Site URL: https://your-domain.com
Redirect URLs:
- http://localhost:5173/auth/callback
- https://your-domain.com/auth/callback
```

## 🔑 Variables d'environnement

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ... (anon key seulement)
```

### ⚠️ IMPORTANT - Sécurité
- **Frontend**: UNIQUEMENT `anon key` (jamais service role)
- **Backend**: Service role key si nécessaire
- **RLS**: TOUJOURS activé sur toutes les tables
- **user_id**: TOUJOURS récupéré via `supabase.auth.getUser()`

## 🧪 Test de la configuration

### 1. Test authentification
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'password123'
});
```

### 2. Test insert check-in
```javascript
const { data: { user } } = await supabase.auth.getUser();
const { data, error } = await supabase.from('checkins').insert({
  user_id: user?.id, // CRITICAL pour RLS
  emotion: 'joie',
  intensity: 6,
  notes: 'Test check-in'
});
```

### 3. Test lecture
```javascript
const { data, error } = await supabase
  .from('checkins')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10);
```

## 🚨 Pièges à éviter

1. **Anon key vs Service Role**: Frontend = anon key uniquement
2. **RLS sans user_id**: Insert refusé si pas de user_id
3. **URL de callback**: Doit être exacte dans Auth settings
4. **Index manquants**: Performance dégradée sans index
5. **Session expirée**: Vérifier auth.getUser() avant chaque requête

---

✅ **Configuration terminée !** Ton app Nirava est maintenant sécurisée avec RLS.