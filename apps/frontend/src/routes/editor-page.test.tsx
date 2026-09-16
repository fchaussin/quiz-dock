import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi, renderApp, setMarkdownField } from '../test/harness';

vi.mock('../game/game-client', () => ({
  createSession: vi.fn().mockResolvedValue({ pin: '482913' }),
}));

const detail = (over: Record<string, unknown> = {}) => ({
  id: 'q1',
  ownerId: 'o',
  title: 'Mon quiz',
  description: null,
  coverMediaId: null,
  status: 'draft',
  visibility: 'private',
  language: 'fr',
  questionCount: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  archivedAt: null,
  questions: [
    {
      id: 'qq',
      quizId: 'q1',
      orderIndex: 0,
      type: 'single_choice',
      prompt: 'Capitale de la France ?',
      mediaId: null,
      timeLimitS: 20,
      pointsMode: 'standard',
      numericValue: null,
      numericTolerance: null,
      options: [],
      acceptedAnswers: [],
    },
  ],
  slides: [],
  ...over,
});

describe('EditorPage', () => {
  const q = (id: string, prompt: string, orderIndex: number) => ({
    id,
    quizId: 'q1',
    orderIndex,
    type: 'single_choice',
    prompt,
    mediaId: null,
    timeLimitS: 20,
    pointsMode: 'standard',
    numericValue: null,
    numericTolerance: null,
    options: [],
    acceptedAnswers: [],
  });
  beforeEach(() => localStorage.setItem('live.localUser', 'Marc'));
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('affiche le quiz, ses métadonnées et ses questions', async () => {
    mockApi([{ method: 'GET', path: '/quizzes/q1', body: detail() }]);
    renderApp('/quizzes/q1');

    expect(await screen.findByText('Éditeur de quiz')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Mon quiz')).toBeInTheDocument();
    expect(screen.getByText('Capitale de la France ?')).toBeInTheDocument();
  });

  it('affiche les avis des joueurs (moyenne + commentaires) côté propriétaire', async () => {
    // Le handler feedback est listé AVANT /quizzes/q1 (le matcher `includes` prend
    // le premier qui correspond, et l'URL feedback contient aussi « /quizzes/q1 »).
    mockApi([
      {
        method: 'GET',
        path: '/quizzes/q1/feedback',
        body: {
          count: 2,
          average: 4.5,
          items: [
            { id: 'f1', rating: 5, comment: 'Génial', nickname: 'Zoé', createdAt: '2026-01-02' },
            { id: 'f2', rating: 4, comment: null, nickname: 'Tom', createdAt: '2026-01-01' },
          ],
        },
      },
      { method: 'GET', path: '/quizzes/q1', body: detail() },
    ]);
    renderApp('/quizzes/q1');

    expect(await screen.findByText('Avis des participants')).toBeInTheDocument();
    expect(await screen.findByText('4.5')).toBeInTheDocument();
    expect(screen.getByText('Génial')).toBeInTheDocument();
    expect(screen.getByText('Zoé')).toBeInTheDocument();
  });

  it('expose un lien Aperçu ouvrant le quiz dans un nouvel onglet', async () => {
    mockApi([{ method: 'GET', path: '/quizzes/q1', body: detail() }]);
    renderApp('/quizzes/q1');
    const link = await screen.findByRole('link', { name: /Aperçu/ });
    expect(link).toHaveAttribute('href', '/quizzes/q1/preview');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('publie le quiz (PATCH status) au clic', async () => {
    const fetchMock = mockApi([
      { method: 'GET', path: '/quizzes/q1', body: detail() },
      { method: 'PATCH', path: '/quizzes/q1/status', body: detail({ status: 'ready' }) },
    ]);
    renderApp('/quizzes/q1');

    fireEvent.click(await screen.findByText('Publier (prêt)'));
    await waitFor(() => {
      const patched = fetchMock.mock.calls.some(
        ([url, opts]) => String(url).includes('/quizzes/q1/status') && opts?.method === 'PATCH',
      );
      expect(patched).toBe(true);
    });
  });

  it('désactive la publication si aucune question', async () => {
    mockApi([
      {
        method: 'GET',
        path: '/quizzes/q1',
        body: detail({ questionCount: 0, questions: [] }),
      },
    ]);
    renderApp('/quizzes/q1');
    const publish = await screen.findByText('Publier (prêt)');
    expect(publish).toBeDisabled();
  });

  it('« Présenter » crée la partie et révèle les 3 accès (contrôle/projection/invitation)', async () => {
    mockApi([{ method: 'GET', path: '/quizzes/q1', body: detail({ status: 'ready' }) }]);
    renderApp('/quizzes/q1');

    fireEvent.click(await screen.findByRole('button', { name: /Présenter/ }));

    expect(await screen.findByText(/Session en cours/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /contrôle/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /projection/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /invitation/i })).toBeInTheDocument();
  });

  it('« Enregistrer » est inactif sans modification, actif dès qu’on édite', async () => {
    mockApi([{ method: 'GET', path: '/quizzes/q1', body: detail() }]);
    renderApp('/quizzes/q1');

    const save = await screen.findByRole('button', { name: /Enregistrer/ });
    expect(save).toBeDisabled();

    fireEvent.change(await screen.findByDisplayValue('Mon quiz'), {
      target: { value: 'Mon quiz révisé' },
    });
    await waitFor(() => expect(save).not.toBeDisabled());
  });

  it('supprimer le quiz demande confirmation (modal) avant le DELETE', async () => {
    const fetchMock = mockApi([
      { method: 'GET', path: '/quizzes/q1', body: detail() },
      { method: 'DELETE', path: '/quizzes/q1', body: {} },
    ]);
    renderApp('/quizzes/q1');

    const deleted = () =>
      fetchMock.mock.calls.some(
        ([url, opts]) =>
          String(url).includes('/quizzes/q1') && (opts as RequestInit)?.method === 'DELETE',
      );

    fireEvent.click(await screen.findByRole('button', { name: 'Supprimer le quiz' }));
    expect(deleted()).toBe(false); // la modal s'ouvre, rien n'est supprimé encore

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer' }));
    await waitFor(() => expect(deleted()).toBe(true));
  });

  it('reorders the sequence (↓ → PATCH items/reorder with the new order)', async () => {
    const fetchMock = mockApi([
      {
        method: 'GET',
        path: '/quizzes/q1',
        body: detail({
          questionCount: 2,
          questions: [q('a', 'Première', 0), q('b', 'Seconde', 1)],
        }),
      },
      { method: 'PATCH', path: '/quizzes/q1/items/reorder', body: [] },
    ]);
    renderApp('/quizzes/q1');

    const down = await screen.findAllByLabelText('Descendre');
    fireEvent.click(down[0]); // descend la 1re question
    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([url, opts]) => String(url).includes('/items/reorder') && opts?.method === 'PATCH',
      );
      expect(call).toBeTruthy();
      const items = JSON.parse(String((call![1] as RequestInit).body)).items;
      expect(items).toEqual([
        { kind: 'question', id: 'b' },
        { kind: 'question', id: 'a' },
      ]);
    });
  });

  it('lists slides in the sequence before their anchor question and moves them with it (#7)', async () => {
    const fetchMock = mockApi([
      {
        method: 'GET',
        path: '/quizzes/q1',
        body: detail({
          questionCount: 2,
          questions: [q('a', 'Première', 0), q('b', 'Seconde', 1)],
          slides: [
            {
              id: 's1',
              quizId: 'q1',
              beforeQuestionId: 'b',
              orderIndex: 0,
              title: 'Interlude',
              body: null,
              mediaId: null,
              displayDelayS: null,
            },
          ],
        }),
      },
      { method: 'PATCH', path: '/quizzes/q1/items/reorder', body: [] },
    ]);
    renderApp('/quizzes/q1');

    const rows = await screen.findAllByRole('listitem');
    expect(rows.map((r) => r.textContent)).toEqual([
      expect.stringContaining('Première'),
      expect.stringContaining('Interlude'),
      expect.stringContaining('Seconde'),
    ]);
    const up = screen.getAllByLabelText('Monter');
    fireEvent.click(up[1]); // the slide moves above « Première »
    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([url, opts]) => String(url).includes('/items/reorder') && opts?.method === 'PATCH',
      );
      expect(call).toBeTruthy();
      expect(JSON.parse(String((call![1] as RequestInit).body)).items).toEqual([
        { kind: 'slide', id: 's1' },
        { kind: 'question', id: 'a' },
        { kind: 'question', id: 'b' },
      ]);
    });
  });

  it('guards unsaved edits: leaving a dirty item form asks before discarding', async () => {
    mockApi([
      {
        method: 'GET',
        path: '/quizzes/q1',
        body: detail({
          questionCount: 2,
          questions: [q('a', 'Première', 0), q('b', 'Seconde', 1)],
        }),
      },
    ]);
    renderApp('/quizzes/q1');

    fireEvent.click((await screen.findAllByRole('button', { name: 'Éditer' }))[0]);
    // DOM order: the item form (main column) comes before the settings' own Save button.
    const save = (await screen.findAllByRole('button', { name: 'Enregistrer' }))[0];
    expect(save).toBeDisabled(); // nothing changed yet
    setMarkdownField('Énoncé', 'Première (modifiée)');
    expect(save).toBeEnabled();

    // Opening another item while dirty → confirm dialog, the form stays until confirmed.
    fireEvent.click(screen.getAllByRole('button', { name: 'Éditer' })[0]);
    // Two <dialog> exist (the form's own and the editor's); only the editor's is open.
    const openDialog = await waitFor(() => {
      const d = document.querySelector('dialog[open]');
      if (!d) throw new Error('no open dialog');
      return d as HTMLElement;
    });
    expect(openDialog.textContent).toContain('Abandonner les modifications ?');
    fireEvent.click(within(openDialog).getByRole('button', { name: 'Abandonner' }));
    await waitFor(() => expect(screen.getByLabelText('Énoncé').textContent).toContain('Seconde'));
  });
});
