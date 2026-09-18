import { fireEvent, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi, renderApp } from '../test/harness';

describe('LoginPage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('connecte en mode local et redirige vers le tableau de bord', async () => {
    mockApi([
      {
        method: 'GET',
        path: '/me',
        body: { id: 'u1', displayName: 'Marie', email: null, role: 'host' },
      },
      { method: 'GET', path: '/quizzes', body: [] },
    ]);
    renderApp('/login');

    const input = await screen.findByLabelText('Votre nom');
    fireEvent.change(input, { target: { value: 'Marie' } });
    fireEvent.click(screen.getByText('Continuer'));

    // l'identité locale est mémorisée
    expect(localStorage.getItem('live.localUser')).toBe('Marie');
    // navigation effective vers le tableau de bord (rendu après login)
    expect(await screen.findByText('Mes quiz')).toBeInTheDocument();
  });

  it('shows the seat holder and refuses a second host (player role) without navigating', async () => {
    mockApi([
      { method: 'GET', path: '/auth/host-seat', body: { holder: 'Alice' } },
      {
        method: 'GET',
        path: '/me',
        body: { id: 'u2', displayName: 'Bob', email: null, role: 'player' },
      },
    ]);
    renderApp('/login');

    expect(await screen.findByRole('status')).toHaveTextContent('Alice');
    fireEvent.change(await screen.findByLabelText('Votre nom'), { target: { value: 'Bob' } });
    fireEvent.click(screen.getByText('Continuer'));

    expect(await screen.findByRole('alert')).toHaveTextContent('déjà pris');
    expect(screen.queryByRole('heading', { name: 'Mes quiz' })).not.toBeInTheDocument();
    // Identité non conservée : pas de nav hôte, pas d'accès au tableau de bord.
    expect(localStorage.getItem('live.localUser')).toBeNull();
    expect(screen.queryByText('Se déconnecter')).not.toBeInTheDocument();
  });
});
