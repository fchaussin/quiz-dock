import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi, renderApp } from '../test/harness';

describe('Garde de route', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('redirige vers /login si non connecté', async () => {
    mockApi([]);
    renderApp('/quizzes');
    // la garde renvoie vers la connexion (champ propre à la page de login)
    expect(await screen.findByLabelText('Votre nom')).toBeInTheDocument();
    expect(screen.queryByText('Mes quiz')).not.toBeInTheDocument();
  });
});

describe('document title', () => {
  it('reads "<page> · <app>" from the matched route', async () => {
    localStorage.setItem('live.localUser', 'Marc');
    mockApi([{ method: 'GET', path: '/quizzes', body: [] }]);
    renderApp('/quizzes');
    await waitFor(() => expect(document.title).toBe('Mes quiz · QuizDock'));
    localStorage.clear();
  });
});
