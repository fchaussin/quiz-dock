import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mockApi } from '../test/harness';
import { JoinAddressPicker } from './join-address-picker';

const renderPicker = (current: string, onChange = vi.fn()) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={qc}>
      <JoinAddressPicker current={current} onChange={onChange} />
    </QueryClientProvider>,
  );
  return onChange;
};

describe('JoinAddressPicker', () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it('offers the public URL, the LAN addresses and this page; prefers a LAN address over localhost', async () => {
    mockApi([
      {
        method: 'GET',
        path: '/games/join-addresses',
        body: { publicUrl: null, lanIps: ['192.168.1.103'], lanSource: 'detected' },
      },
    ]);
    const onChange = renderPicker(window.location.origin);
    // jsdom's origin is http://localhost → the LAN address is proposed automatically.
    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith(
        `http://192.168.1.103${window.location.port ? `:${window.location.port}` : ''}`,
      ),
    );
    const select = (await screen.findByLabelText('Adresse pour rejoindre')) as HTMLSelectElement;
    const port = window.location.port ? `:${window.location.port}` : '';
    expect([...select.options].map((o) => o.value)).toEqual([
      `http://192.168.1.103${port}`,
      window.location.origin,
      '__custom__',
    ]);
  });

  it('lets the host type any address and remembers the session’s choice', async () => {
    mockApi([{ method: 'GET', path: '/games/join-addresses', body: { publicUrl: null, lan: [] } }]);
    const onChange = renderPicker('http://quiz.example.org');
    const select = (await screen.findByLabelText('Adresse pour rejoindre')) as HTMLSelectElement;
    expect(select.value).toBe('__custom__'); // not among the candidates → custom
    fireEvent.change(screen.getByLabelText('Autre adresse…'), {
      target: { value: '10.0.0.7:18081' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Appliquer' }));
    expect(onChange).toHaveBeenCalledWith('10.0.0.7:18081');
    await waitFor(() =>
      expect(localStorage.getItem('live.joinBaseUrl')).toBe('http://quiz.example.org'),
    );
  });
});
