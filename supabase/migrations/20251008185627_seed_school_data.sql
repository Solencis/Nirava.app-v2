/*
  # Seed données École - Données de démonstration

  ## Description
  Ajoute les données initiales pour la section École :
  - 7 niveaux (N1-N2 gratuits, N3-N7 premium)
  - 1 module démo par niveau
  - 5 étapes par module (gabarit complet)
  - Badges de base

  ## Notes
  - Les contenus sont des placeholders à remplacer
  - Les URLs médias sont des exemples
  - Les quiz et prompts sont fonctionnels
*/

-- ============================================================================
-- NIVEAUX (Levels 1-7)
-- ============================================================================

INSERT INTO levels (id, title, slug, goal, keys_of_success, is_free, order_index) VALUES
(
  1,
  'Sécurité & Ancrage',
  'securite-ancrage',
  'Retrouver un sentiment de sécurité intérieure et se reconnecter à son corps',
  '["Identifier ses signaux de sécurité/danger", "Pratiquer l''ancrage corporel", "Créer un espace sûr intérieur"]'::jsonb,
  true,
  1
),
(
  2,
  'Émotions & Besoins',
  'emotions-besoins',
  'Comprendre et accueillir ses émotions, identifier ses besoins fondamentaux',
  '["Nommer ses émotions avec précision", "Relier émotions et besoins", "Pratiquer l''auto-empathie"]'::jsonb,
  true,
  2
),
(
  3,
  'Croyances & Schémas',
  'croyances-schemas',
  'Identifier et transformer ses schémas limitants et croyances inconscientes',
  '["Repérer ses schémas répétitifs", "Questionner ses croyances", "Créer de nouvelles narrations"]'::jsonb,
  false,
  3
),
(
  4,
  'Relations & Limites',
  'relations-limites',
  'Développer des relations saines et poser des limites claires',
  '["Identifier ses patterns relationnels", "Communiquer ses limites", "Cultiver l''interdépendance"]'::jsonb,
  false,
  4
),
(
  5,
  'Créativité & Expression',
  'creativite-expression',
  'Libérer sa créativité et trouver sa voix authentique',
  '["Explorer différentes formes d''expression", "Dépasser la peur du jugement", "Créer sans attente"]'::jsonb,
  false,
  5
),
(
  6,
  'Intuition & Vision',
  'intuition-vision',
  'Développer son intuition et clarifier sa vision de vie',
  '["Écouter ses signaux intuitifs", "Distinguer mental et intuition", "Définir sa vision"]'::jsonb,
  false,
  6
),
(
  7,
  'Transcendance & Unité',
  'transcendance-unite',
  'S''ouvrir à la dimension spirituelle et au sentiment d''unité',
  '["Explorer la dimension transcendante", "Pratiquer la présence", "Cultiver la gratitude"]'::jsonb,
  false,
  7
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MODULES (1 par niveau pour démo)
-- ============================================================================

-- Module Niveau 1
INSERT INTO modules (id, level_id, slug, title, summary, is_free, order_index) VALUES
(
  '00000000-0000-0000-0001-000000000001',
  1,
  'n1-alphabetisation-emotionnelle',
  'Alphabétisation émotionnelle',
  'Apprends à identifier, nommer et accueillir tes émotions de base. Un premier pas essentiel vers la régulation émotionnelle.',
  true,
  1
);

-- Étapes du module N1
INSERT INTO module_steps (module_id, step_kind, order_index, content) VALUES
(
  '00000000-0000-0000-0001-000000000001',
  'opening',
  1,
  '{
    "title": "Bienvenue dans ton parcours d''ancrage",
    "description": "Les émotions sont comme des messagers : elles nous informent de nos besoins. En apprenant à les reconnaître, tu poses les fondations de ton bien-être.",
    "promise": "À la fin de ce module, tu sauras identifier tes 4 émotions de base et comprendre leurs messages.",
    "duration_minutes": 2
  }'::jsonb
),
(
  '00000000-0000-0000-0001-000000000001',
  'knowledge',
  2,
  '{
    "title": "Les 4 émotions fondamentales",
    "description": "Découvre les 4 familles d''émotions et leurs fonctions protectrices.",
    "media_url": "/audios/n1-alphabétisation.mp3",
    "media_type": "audio",
    "duration_minutes": 8,
    "key_points": [
      "La peur nous protège du danger (réel ou perçu)",
      "La colère défend nos limites et notre intégrité",
      "La tristesse nous aide à lâcher prise et à nous adapter",
      "La joie renforce ce qui est bon pour nous"
    ]
  }'::jsonb
),
(
  '00000000-0000-0000-0001-000000000001',
  'experience',
  3,
  '{
    "title": "Scan corporel des émotions",
    "description": "Pratique guidée pour ressentir les émotions dans ton corps.",
    "media_url": "/practices/n1-scan-emotionnel.mp3",
    "media_type": "audio",
    "duration_minutes": 10,
    "instructions": "Installe-toi confortablement, ferme les yeux si tu le souhaites, et laisse-toi guider."
  }'::jsonb
),
(
  '00000000-0000-0000-0001-000000000001',
  'integration',
  4,
  '{
    "title": "Journal émotionnel",
    "description": "Intègre cette pratique en écrivant ton expérience.",
    "journal_prompts": [
      "Quelle émotion as-tu ressentie le plus clairement aujourd''hui ?",
      "Où l''as-tu sentie dans ton corps ?",
      "Quel message ou besoin cette émotion t''apportait-elle ?"
    ],
    "quiz": {
      "questions": [
        {
          "question": "La peur est une émotion...",
          "options": ["À éviter à tout prix", "Qui nous protège", "Signe de faiblesse"],
          "correct": 1
        },
        {
          "question": "Quand je ressens de la colère, c''est souvent que...",
          "options": ["Une de mes limites a été franchie", "Je suis une mauvaise personne", "Je dois me calmer immédiatement"],
          "correct": 0
        }
      ]
    },
    "ritual": "Chaque soir cette semaine, prends 2 minutes pour identifier l''émotion principale de ta journée."
  }'::jsonb
),
(
  '00000000-0000-0000-0001-000000000001',
  'expansion',
  5,
  '{
    "title": "Félicitations ! 🎉",
    "description": "Tu as posé la première pierre de ton ancrage émotionnel.",
    "badge_code": "ANCRE_POSEE",
    "micro_challenge": {
      "title": "Défi 7 jours : Check-in émotionnel",
      "description": "Chaque jour, identifie et nomme 1 émotion que tu ressens. Note-la dans ton journal.",
      "duration_days": 7
    },
    "next_steps": [
      "Explore le module suivant",
      "Partage ton expérience dans la Communauté",
      "Continue ton journal émotionnel"
    ]
  }'::jsonb
);

-- Module Niveau 2
INSERT INTO modules (id, level_id, slug, title, summary, is_free, order_index) VALUES
(
  '00000000-0000-0000-0002-000000000001',
  2,
  'n2-roue-emotions-besoins',
  'La roue des émotions et besoins',
  'Découvre la connexion profonde entre tes émotions et tes besoins non satisfaits. Apprends à traduire chaque émotion en besoin.',
  true,
  1
);

-- Étapes du module N2
INSERT INTO module_steps (module_id, step_kind, order_index, content) VALUES
(
  '00000000-0000-0000-0002-000000000001',
  'opening',
  1,
  '{
    "title": "Derrière chaque émotion, un besoin",
    "description": "Les émotions ne sont pas le problème. Elles pointent vers ce qui compte vraiment pour toi : tes besoins.",
    "promise": "À la fin de ce module, tu sauras identifier le besoin caché derrière chacune de tes émotions.",
    "duration_minutes": 2
  }'::jsonb
),
(
  '00000000-0000-0000-0002-000000000001',
  'knowledge',
  2,
  '{
    "title": "La carte émotions → besoins",
    "description": "Comprends la logique universelle qui relie émotions et besoins fondamentaux.",
    "media_url": "/videos/n2-emotions-besoins.mp4",
    "media_type": "video",
    "duration_minutes": 10,
    "key_points": [
      "Toute émotion désagréable = besoin non satisfait",
      "Toute émotion agréable = besoin satisfait",
      "Il existe 9 besoins universels (sécurité, appartenance, autonomie...)"
    ]
  }'::jsonb
),
(
  '00000000-0000-0000-0002-000000000001',
  'experience',
  3,
  '{
    "title": "Exercice : De l''émotion au besoin",
    "description": "Pratique guidée pour traduire tes émotions en besoins clairs.",
    "media_url": "/practices/n2-emotion-besoin.mp3",
    "media_type": "audio",
    "duration_minutes": 12,
    "instructions": "Pense à une situation récente qui t''a ému(e). Suis le guide pour identifier le besoin sous-jacent."
  }'::jsonb
),
(
  '00000000-0000-0000-0002-000000000001',
  'integration',
  4,
  '{
    "title": "Carte personnelle émotions-besoins",
    "description": "Crée ta propre carte de connexion entre tes émotions fréquentes et tes besoins.",
    "journal_prompts": [
      "Quelles sont les 3 émotions que je ressens le plus souvent ?",
      "Pour chacune, quel besoin essaie de se faire entendre ?",
      "Comment puis-je nourrir ces besoins cette semaine ?"
    ],
    "quiz": {
      "questions": [
        {
          "question": "Si je ressens de la frustration, c''est souvent un besoin de...",
          "options": ["Autonomie ou efficacité", "Solitude absolue", "Perfection"],
          "correct": 0
        }
      ]
    },
    "ritual": "Chaque jour, transforme 1 émotion en besoin : ''Je ressens [émotion] parce que j''ai besoin de [besoin]''."
  }'::jsonb
),
(
  '00000000-0000-0000-0002-000000000001',
  'expansion',
  5,
  '{
    "title": "Tu es maintenant explorateur d''émotions ! 🧭",
    "description": "Tu sais naviguer entre émotions et besoins. C''est un superpouvoir de régulation.",
    "badge_code": "EXPLORATEUR_EMOTIONS",
    "micro_challenge": {
      "title": "Défi 7 jours : Journal émotions-besoins",
      "description": "Chaque jour, note 1 émotion et le besoin qu''elle révèle. Trouve 1 action pour nourrir ce besoin.",
      "duration_days": 7
    },
    "next_steps": [
      "Découvre les niveaux premium (N3-N7)",
      "Partage ta carte émotions-besoins en communauté",
      "Continue ton journal quotidien"
    ]
  }'::jsonb
);

-- Modules Niveaux 3-7 (placeholders pour structure)
INSERT INTO modules (id, level_id, slug, title, summary, is_free, order_index) VALUES
(
  '00000000-0000-0000-0003-000000000001',
  3,
  'n3-identifier-schemas',
  'Identifier tes schémas répétitifs',
  'Découvre les patterns automatiques qui gouvernent tes réactions et décisions.',
  false,
  1
),
(
  '00000000-0000-0000-0004-000000000001',
  4,
  'n4-communication-authentique',
  'Communication authentique',
  'Apprends à exprimer tes besoins et limites avec clarté et compassion.',
  false,
  1
),
(
  '00000000-0000-0000-0005-000000000001',
  5,
  'n5-ecriture-creative',
  'Écriture créative libératrice',
  'Utilise l''écriture comme outil d''exploration et de libération émotionnelle.',
  false,
  1
),
(
  '00000000-0000-0000-0006-000000000001',
  6,
  'n6-meditation-intuitive',
  'Méditation intuitive',
  'Développe ton écoute intérieure et apprends à distinguer mental et intuition.',
  false,
  1
),
(
  '00000000-0000-0000-0007-000000000001',
  7,
  'n7-pratique-presence',
  'Pratique de la présence',
  'Cultive un état de présence profonde et de connexion au moment présent.',
  false,
  1
);

-- Étapes des modules N3-N7 (structure minimale pour éviter erreurs)
DO $$
DECLARE
  module_ids uuid[] := ARRAY[
    '00000000-0000-0000-0003-000000000001'::uuid,
    '00000000-0000-0000-0004-000000000001'::uuid,
    '00000000-0000-0000-0005-000000000001'::uuid,
    '00000000-0000-0000-0006-000000000001'::uuid,
    '00000000-0000-0000-0007-000000000001'::uuid
  ];
  step_kinds text[] := ARRAY['opening', 'knowledge', 'experience', 'integration', 'expansion'];
  m_id uuid;
  s_kind text;
  s_order int;
BEGIN
  FOREACH m_id IN ARRAY module_ids LOOP
    s_order := 1;
    FOREACH s_kind IN ARRAY step_kinds LOOP
      INSERT INTO module_steps (module_id, step_kind, order_index, content)
      VALUES (
        m_id,
        s_kind,
        s_order,
        json_build_object(
          'title', 'Étape ' || s_order || ' - ' || s_kind,
          'description', 'Contenu à venir pour cette étape premium.',
          'is_placeholder', true
        )::jsonb
      );
      s_order := s_order + 1;
    END LOOP;
  END LOOP;
END $$;

-- ============================================================================
-- BADGES
-- ============================================================================

INSERT INTO badges (id, code, title, description, icon, criteria, order_index) VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'ANCRE_POSEE',
  'Ancre posée',
  'Tu as terminé le niveau 1 et posé les fondations de ton ancrage émotionnel.',
  '⚓',
  '{"level_id": 1, "completion": 100}'::jsonb,
  1
),
(
  '10000000-0000-0000-0000-000000000002',
  'EXPLORATEUR_EMOTIONS',
  'Explorateur d''émotions',
  'Tu as terminé le niveau 2 et créé au moins 3 entrées dans ton journal.',
  '🧭',
  '{"level_id": 2, "completion": 100, "journal_entries": 3}'::jsonb,
  2
),
(
  '10000000-0000-0000-0000-000000000003',
  'LIBERATEUR_SCHEMAS',
  'Libérateur de schémas',
  'Tu as identifié et transformé un schéma limitant majeur.',
  '🔓',
  '{"level_id": 3, "completion": 100}'::jsonb,
  3
),
(
  '10000000-0000-0000-0000-000000000004',
  'COMMUNICATEUR_AUTHENTIQUE',
  'Communicateur authentique',
  'Tu as appris à exprimer tes besoins et limites avec clarté.',
  '💬',
  '{"level_id": 4, "completion": 100}'::jsonb,
  4
),
(
  '10000000-0000-0000-0000-000000000005',
  'CREATEUR_LIBRE',
  'Créateur libre',
  'Tu as libéré ta créativité sans jugement ni attente.',
  '🎨',
  '{"level_id": 5, "completion": 100}'::jsonb,
  5
),
(
  '10000000-0000-0000-0000-000000000006',
  'INTUITIF_CLAIR',
  'Intuitif clair',
  'Tu sais distinguer mental et intuition, et suivre ta voix intérieure.',
  '🔮',
  '{"level_id": 6, "completion": 100}'::jsonb,
  6
),
(
  '10000000-0000-0000-0000-000000000007',
  'MAITRE_PRESENCE',
  'Maître de présence',
  'Tu incarnes la présence et la connexion profonde au moment.',
  '✨',
  '{"level_id": 7, "completion": 100}'::jsonb,
  7
)
ON CONFLICT (code) DO NOTHING;