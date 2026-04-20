import { create } from 'zustand';
import { fr } from './fr';
import { es } from './es';
import type { Translations } from './fr';

export type Language = 'fr' | 'es';

interface I18nState {
  lang: Language;
  t: Translations;
  setLang: (lang: Language) => void;
}

const getInitialLang = (): Language => {
  const stored = localStorage.getItem('nirava.lang');
  if (stored === 'es' || stored === 'fr') return stored;
  return 'fr';
};

const translations: Record<Language, Translations> = { fr, es };

export const useI18n = create<I18nState>((set) => ({
  lang: getInitialLang(),
  t: translations[getInitialLang()],
  setLang: (lang: Language) => {
    localStorage.setItem('nirava.lang', lang);
    set({ lang, t: translations[lang] });
  },
}));

export { fr, es };
export type { Translations };
