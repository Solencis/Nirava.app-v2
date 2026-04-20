import type { Language } from '../i18n';

export interface OnboardingSlide {
  id: number;
  title: string;
  subtitle?: string;
  description: string;
  icon?: string;
  gradient: string;
  textColor: string;
  ctaText?: string | null;
}

const slidesFr: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Bienvenue sur Nirava',
    subtitle: 'Version prototype en accès limité',
    description: 'Nirava est en cours de construction. Cette version prototype te donne un avant-goût de l\'aventure. Certaines fonctionnalités sont encore en développement — la version complète arrive en 2026.',
    icon: '🚀',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
    textColor: 'text-emerald-900',
    ctaText: 'Commencer l\'aventure',
  },
  {
    id: 2,
    title: 'L\'École de la Conscience',
    subtitle: '7 modules pour explorer ton monde intérieur',
    description: 'Des enseignements audio guidés, des exercices pratiques et un espace pour poser tes mots. Chaque module est une porte vers toi-même. Les premiers sont entièrement gratuits.',
    icon: '📚',
    gradient: 'from-teal-400 via-cyan-400 to-sky-400',
    textColor: 'text-teal-900',
    ctaText: 'Explorer les modules',
  },
  {
    id: 3,
    title: 'Ton Journal Quotidien',
    subtitle: 'Le centre de ta transformation',
    description: 'Note tes ressentis, explore tes émotions, célèbre tes petites victoires. C\'est dans ces rituels quotidiens que la vraie transformation s\'opère. Reviens chaque jour.',
    icon: '✨',
    gradient: 'from-amber-400 via-orange-400 to-rose-400',
    textColor: 'text-amber-900',
    ctaText: 'Découvrir mon journal',
  },
  {
    id: 4,
    title: 'Progresse et Célèbre',
    subtitle: 'Chaque pas compte, chaque jour est une victoire',
    description: 'Accumule de l\'expérience, débloque des succès, monte de niveau. Au-delà des chiffres, c\'est ton évolution intérieure que nous célébrons. Avance à ton propre rythme.',
    icon: '⭐',
    gradient: 'from-sky-400 via-blue-400 to-cyan-500',
    textColor: 'text-sky-900',
    ctaText: 'Voir ma progression',
  },
  {
    id: 5,
    title: 'Une Communauté Bienveillante',
    subtitle: 'Tu n\'es pas seul(e) sur ce chemin',
    description: 'Partage tes découvertes, lis les témoignages d\'autres voyageurs, trouve du soutien dans les moments difficiles. Ici, chacun avance dans le respect et la bienveillance.',
    icon: '🌍',
    gradient: 'from-green-400 via-emerald-400 to-teal-400',
    textColor: 'text-green-900',
    ctaText: 'Rejoindre la communauté',
  },
  {
    id: 6,
    title: 'Prêt(e) à commencer ?',
    subtitle: 'Crée ton espace personnel et sauvegarde ton voyage',
    description: 'Un compte gratuit t\'ouvre l\'accès aux premiers modules et garde toute ta progression en mémoire. Quand tu le souhaiteras, tu pourras débloquer l\'intégralité du parcours.',
    icon: '🔑',
    gradient: 'from-rose-400 via-pink-400 to-fuchsia-400',
    textColor: 'text-rose-900',
    ctaText: null,
  },
];

const slidesEs: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Bienvenido a Nirava',
    subtitle: 'Versión prototipo con acceso limitado',
    description: 'Nirava está en construcción. Esta versión prototipo te da un adelanto de la aventura. Algunas funcionalidades aún están en desarrollo — la versión completa llega en 2026.',
    icon: '🚀',
    gradient: 'from-emerald-400 via-teal-400 to-cyan-400',
    textColor: 'text-emerald-900',
    ctaText: 'Comenzar la aventura',
  },
  {
    id: 2,
    title: 'La Escuela de la Consciencia',
    subtitle: '7 módulos para explorar tu mundo interior',
    description: 'Enseñanzas de audio guiadas, ejercicios prácticos y un espacio para poner en palabras tus pensamientos. Cada módulo es una puerta hacia ti mismo. Los primeros son completamente gratuitos.',
    icon: '📚',
    gradient: 'from-teal-400 via-cyan-400 to-sky-400',
    textColor: 'text-teal-900',
    ctaText: 'Explorar los módulos',
  },
  {
    id: 3,
    title: 'Tu Diario Cotidiano',
    subtitle: 'El centro de tu transformación',
    description: 'Anota tus sensaciones, explora tus emociones, celebra tus pequeñas victorias. Es en estos rituales cotidianos donde la verdadera transformación ocurre. Vuelve cada día.',
    icon: '✨',
    gradient: 'from-amber-400 via-orange-400 to-rose-400',
    textColor: 'text-amber-900',
    ctaText: 'Descubrir mi diario',
  },
  {
    id: 4,
    title: 'Progresa y Celebra',
    subtitle: 'Cada paso cuenta, cada día es una victoria',
    description: 'Acumula experiencia, desbloquea logros, sube de nivel. Más allá de los números, es tu evolución interior lo que celebramos. Avanza a tu propio ritmo.',
    icon: '⭐',
    gradient: 'from-sky-400 via-blue-400 to-cyan-500',
    textColor: 'text-sky-900',
    ctaText: 'Ver mi progreso',
  },
  {
    id: 5,
    title: 'Una Comunidad Amable',
    subtitle: 'No estás solo/a en este camino',
    description: 'Comparte tus descubrimientos, lee los testimonios de otros viajeros, encuentra apoyo en los momentos difíciles. Aquí, cada uno avanza con respeto y amabilidad.',
    icon: '🌍',
    gradient: 'from-green-400 via-emerald-400 to-teal-400',
    textColor: 'text-green-900',
    ctaText: 'Unirse a la comunidad',
  },
  {
    id: 6,
    title: '¿Listo/a para comenzar?',
    subtitle: 'Crea tu espacio personal y guarda tu viaje',
    description: 'Una cuenta gratuita te abre el acceso a los primeros módulos y guarda todo tu progreso. Cuando lo desees, podrás desbloquear el recorrido completo.',
    icon: '🔑',
    gradient: 'from-rose-400 via-pink-400 to-fuchsia-400',
    textColor: 'text-rose-900',
    ctaText: null,
  },
];

export function getOnboardingSlides(lang: Language): OnboardingSlide[] {
  return lang === 'es' ? slidesEs : slidesFr;
}

export const onboardingSlides = slidesFr;
