import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Markdown } from './markdown';

describe('Markdown — block profile', () => {
  it('renders bold, italic, lists, links and code', () => {
    const { container } = render(
      <Markdown>
        {'Un **gras** et _italique_\n\n- a\n- b\n\n[lien](https://x.test) `code`'}
      </Markdown>,
    );
    expect(container.querySelector('strong')?.textContent).toBe('gras');
    expect(container.querySelector('em')?.textContent).toBe('italique');
    expect(container.querySelectorAll('ul > li')).toHaveLength(2);
    expect(container.querySelector('code')?.textContent).toBe('code');
    const a = container.querySelector('a');
    expect(a?.getAttribute('href')).toBe('https://x.test');
    expect(a?.getAttribute('target')).toBe('_blank');
    expect(a?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('unwraps elements outside the allowlist (headings, images) and keeps their text', () => {
    const { container } = render(<Markdown>{'# Titre\n\n![alt](https://x.test/i.png)'}</Markdown>);
    expect(container.querySelector('h1')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.textContent).toContain('Titre');
  });

  it('drops raw HTML and neutralises javascript: URLs', () => {
    const { container } = render(
      <Markdown>{'<script>alert(1)</script><b>x</b> [j](javascript:alert(1))'}</Markdown>,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).not.toContain('alert');
    expect(container.querySelector('a')?.getAttribute('href') ?? '').not.toContain('javascript:');
  });

  it('renders nothing for an empty or null value', () => {
    expect(render(<Markdown>{null}</Markdown>).container.innerHTML).toBe('');
    expect(render(<Markdown>{''}</Markdown>).container.innerHTML).toBe('');
  });
});

describe('Markdown — inline profile', () => {
  it('keeps bold/italic/code, strips paragraphs, lists and links', () => {
    const { container } = render(
      <Markdown profile="inline">{'**A** _b_ `c` [l](https://x.test)\n\n- item'}</Markdown>,
    );
    expect(container.firstElementChild?.tagName).toBe('SPAN');
    expect(container.querySelector('strong')?.textContent).toBe('A');
    expect(container.querySelector('em')?.textContent).toBe('b');
    expect(container.querySelector('code')?.textContent).toBe('c');
    expect(container.querySelector('p')).toBeNull();
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('ul')).toBeNull();
    expect(container.textContent).toContain('l');
    expect(container.textContent).toContain('item');
  });
});
