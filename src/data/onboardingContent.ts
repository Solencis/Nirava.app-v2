export interface OnboardingSlide {
  id: number;
  title: string;
  description: string;
  icon?: string;
  image?: string;
  ctaText?: string;
}

export const onboardingSlides: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Bienvenue sur Nirava',
    description: 'Avance pas à pas vers plus de clarté et de sérénité. Nirava te guide à travers 7 modules pour respirer, comprendre tes émotions et ancrer de nouvelles habitudes.',
    icon: '🌱',
    ctaText: 'Découvrir'
  },
  {
    id: 2,
    title: 'Modules & Parcours',
    description: 'Chaque module t\'invite à une introspection : une vidéo/audio, un journal guidé et un exercice pratique. Les 2–3 premiers sont gratuits pour te lancer.',
    icon: '🎓',
    ctaText: 'Suivant'
  },
  {
    id: 3,
    title: 'Progression & Gamification',
    description: 'Suis ta progression, débloque des succès et avance à ton rythme. Nirava s\'adapte à ton évolution.',
    icon: '⭐',
    ctaText: 'Suivant'
  },
  {
    id: 4,
    title: 'Communauté',
    description: 'Partage ton expérience dans un espace bienveillant. Tu n\'es pas seul — la communauté t\'accompagne.',
    icon: '🌍',
    ctaText: 'Suivant'
  },
  {
    id: 5,
    title: 'Crée ton espace personnel',
    description: 'Pour sauvegarder ta progression, rejoins la communauté Nirava. Ton compte te donne accès aux modules gratuits et te permet de débloquer les suivants quand tu veux.',
    icon: '🔑',
    ctaText: null
  }
];
