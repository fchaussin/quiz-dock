import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from './switch';

describe('Switch', () => {
  it('is a switch role reflecting its state, toggles on click, respects disabled', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Switch checked={false} onCheckedChange={onChange} aria-label="Halo" />,
    );
    const sw = screen.getByRole('switch', { name: 'Halo' });
    expect(sw).toHaveAttribute('aria-checked', 'false');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledWith(true);
    rerender(<Switch checked disabled onCheckedChange={onChange} aria-label="Halo" />);
    expect(sw).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(sw);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
