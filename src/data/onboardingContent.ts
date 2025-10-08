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
    title: 'Bienvenue chez toi',
    subtitle: 'Un espace pour grandir en conscience',
    description: 'Nirava t\'invite à un voyage intérieur. Pas à pas, module après module, découvre comment respirer pleinement, accueillir tes émotions et transformer tes habitudes. Ici, tu avances à ton rythme, en douceur.',
    icon: '🌱',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
    textColor: 'text-emerald-900',
    ctaText: 'Commencer le voyage'
  },
  {
    id: 2,
    title: 'L\'École de la Conscience',
    subtitle: '7 modules pour explorer ton monde intérieur',
    description: 'Chaque module est une porte vers toi-même : des enseignements audio guidés, des exercices pratiques et un espace pour poser tes mots. Les premiers modules sont gratuits — tout commence ici, maintenant.',
    icon: '📚',
    gradient: 'from-violet-400 via-purple-400 to-fuchsia-400',
    textColor: 'text-violet-900',
    ctaText: 'Explorer les modules'
  },
  {
    id: 3,
    title: 'Ton Journal Quotidien',
    subtitle: 'Le tableau de bord de ta transformation',
    description: 'Chaque jour, reviens ici. Le journal est ton espace d\'ancrage : note tes ressentis, explore tes émotions, célèbre tes petites victoires. C\'est dans ces rituels quotidiens que la magie opère.',
    icon: '✨',
    gradient: 'from-amber-400 via-orange-400 to-rose-400',
    textColor: 'text-amber-900',
    ctaText: 'Découvrir mon journal'
  },
  {
    id: 4,
    title: 'Progresse & Célèbre',
    subtitle: 'Chaque pas compte, chaque jour est une victoire',
    description: 'Accumule de l\'expérience, débloque des succès, monte de niveau. Mais au-delà des chiffres, c\'est ton évolution intérieure que nous célébrons. Avance à ton rythme — il n\'y a aucune urgence.',
    icon: '⭐',
    gradient: 'from-blue-400 via-indigo-400 to-purple-400',
    textColor: 'text-blue-900',
    ctaText: 'Voir ma progression'
  },
  {
    id: 5,
    title: 'Une Communauté Bienveillante',
    subtitle: 'Tu n\'es pas seul(e) sur ce chemin',
    description: 'Partage tes découvertes, lis les témoignages d\'autres voyageurs, trouve du soutien dans les moments difficiles. Ici, chacun avance à son rythme, dans le respect et la bienveillance.',
    icon: '🌍',
    gradient: 'from-green-400 via-emerald-400 to-teal-400',
    textColor: 'text-green-900',
    ctaText: 'Rejoindre la communauté'
  },
  {
    id: 6,
    title: 'Prêt(e) à commencer ?',
    subtitle: 'Crée ton espace personnel pour sauvegarder ton voyage',
    description: 'Un compte gratuit te permet d\'accéder aux premiers modules et de garder une trace de toute ta progression. Quand tu seras prêt(e), tu pourras débloquer l\'intégralité du parcours.',
    icon: '🔑',
    gradient: 'from-rose-400 via-pink-400 to-fuchsia-400',
    textColor: 'text-rose-900',
    ctaText: null
  }
];
