import { fireEvent, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi, renderApp } from '../test/harness';

describe('SeatStatus (topbar, local mode)', () => {
  beforeEach(() => localStorage.setItem('live.localUser', 'Marc'));
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('counts down the holder’s seat and renews it for the same duration', async () => {
    const claimedAt = new Date(Date.now() - 30 * 60_000).toISOString();
    const expiresAt = new Date(Date.now() + 90 * 60_000).toISOString(); // chosen: 2 h
    const fetchMock = mockApi([
      {
        method: 'POST',
        path: '/auth/host-seat/claim',
        body: { holder: 'Marc', expiresAt, claimedAt },
      },
      { method: 'GET', path: '/auth/host-seat', body: { holder: 'Marc', expiresAt, claimedAt } },
      { method: 'GET', path: '/quizzes', body: [] },
    ]);
    renderApp('/dashboard');
    expect(await screen.findByText(/Siège hôte · 1 h 30 min restantes/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Renouveler/ }));
    await waitFor(() => {
      const call = fetchMock.mock.calls.find(
        ([url, opts]) => String(url).includes('/auth/host-seat/claim') && opts?.method === 'POST',
      );
      expect(call).toBeDefined();
      expect(JSON.parse(String(call?.[1]?.body))).toEqual({ expiresInMinutes: 120 });
    });
  });

  it('says nothing about expiry when the seat has none, and nothing at all for a non-holder', async () => {
    mockApi([
      {
        method: 'GET',
        path: '/auth/host-seat',
        body: { holder: 'Marc', expiresAt: null, claimedAt: null },
      },
      { method: 'GET', path: '/quizzes', body: [] },
    ]);
    renderApp('/dashboard');
    expect(await screen.findByText(/sans expiration/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Renouveler/ })).toBeNull();
  });
});
