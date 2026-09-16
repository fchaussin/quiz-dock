import '@testing-library/jest-dom/vitest';
import '../i18n'; // init i18n synchrone — t() renvoie le texte FR réel dans les tests

// jsdom n'implémente pas scrollTo ; TanStack Router l'appelle (scroll restoration).
window.scrollTo = () => undefined;

// jsdom has no matchMedia; the editor picks its wide (inline form) layout from it.
window.matchMedia ??= (query: string) =>
  ({
    matches: query.includes('min-width'),
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  }) as MediaQueryList;
