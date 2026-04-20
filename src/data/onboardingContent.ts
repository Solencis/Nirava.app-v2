export interface OnboardingSlide {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  icon?: string;
  gradient: string;
  textColor: string;
  ctaText?: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Bienvenue sur Nirava',
    subtitle: 'Version prototype en accès limité',
    description: 'Nirava est en cours de construction. Cette version prototype te donne un avant-goût de l\'aventure. Certaines fonctionnalités sont encore en développement — la version complète arrive en 2026.',
    icon: '🚀',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
    textColor: 'text-emerald-900',
    ctaText: 'Commencer l\'aventure'
  },
  {
    id: 2,
    title: 'L\'École de la Conscience',
    subtitle: '7 modules pour explorer ton monde intérieur',
    description: 'Des enseignements audio guidés, des exercices pratiques et un espace pour poser tes mots. Chaque module est une porte vers toi-même. Les premiers sont entièrement gratuits.',
    icon: '📚',
    gradient: 'from-teal-400 via-cyan-400 to-sky-400',
    textColor: 'text-teal-900',
    ctaText: 'Explorer les modules'
  },
  {
    id: 3,
    title: 'Ton Journal Quotidien',
    subtitle: 'Le centre de ta transformation',
    description: 'Note tes ressentis, explore tes émotions, célèbre tes petites victoires. C\'est dans ces rituels quotidiens que la vraie transformation s\'opère. Reviens chaque jour.',
    icon: '✨',
    gradient: 'from-amber-400 via-orange-400 to-rose-400',
    textColor: 'text-amber-900',
    ctaText: 'Découvrir mon journal'
  },
  {
    id: 4,
    title: 'Progresse et Célèbre',
    subtitle: 'Chaque pas compte, chaque jour est une victoire',
    description: 'Accumule de l\'expérience, débloque des succès, monte de niveau. Au-delà des chiffres, c\'est ton évolution intérieure que nous célébrons. Avance à ton propre rythme.',
    icon: '⭐',
    gradient: 'from-sky-400 via-blue-400 to-cyan-500',
    textColor: 'text-sky-900',
    ctaText: 'Voir ma progression'
  },
  {
    id: 5,
    title: 'Une Communauté Bienveillante',
    subtitle: 'Tu n\'es pas seul(e) sur ce chemin',
    description: 'Partage tes découvertes, lis les témoignages d\'autres voyageurs, trouve du soutien dans les moments difficiles. Ici, chacun avance dans le respect et la bienveillance.',
    icon: '🌍',
    gradient: 'from-green-400 via-emerald-400 to-teal-400',
    textColor: 'text-green-900',
    ctaText: 'Rejoindre la communauté'
  },
  {
    id: 6,
    title: 'Prêt(e) à commencer ?',
    subtitle: 'Crée ton espace personnel et sauvegarde ton voyage',
    description: 'Un compte gratuit t\'ouvre l\'accès aux premiers modules et garde toute ta progression en mémoire. Quand tu le souhaiteras, tu pourras débloquer l\'intégralité du parcours.',
    icon: '🔑',
    gradient: 'from-rose-400 via-pink-400 to-fuchsia-400',
    textColor: 'text-rose-900',
    ctaText: null
  }
];
