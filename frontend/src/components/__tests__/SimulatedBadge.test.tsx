import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulatedBadge } from '../SimulatedBadge';

describe('SimulatedBadge — testes unitários', () => {
  test('renderiza span com texto Simulated', () => {
    render(<SimulatedBadge />);
    expect(screen.getByText('Simulated')).toBeInTheDocument();
  });

  test('span possui classes de estilo amber', () => {
    render(<SimulatedBadge />);
    const span = screen.getByText('Simulated');
    expect(span.className).toContain('border-amber-400/70');
    expect(span.className).toContain('text-amber-300');
    expect(span.className).toContain('bg-amber-500/10');
  });

  test('span é um elemento <span>', () => {
    render(<SimulatedBadge />);
    const span = screen.getByText('Simulated');
    expect(span.tagName).toBe('SPAN');
  });

  test('span possui classes font-mono e text-xs', () => {
    render(<SimulatedBadge />);
    const span = screen.getByText('Simulated');
    expect(span.className).toContain('font-mono');
    expect(span.className).toContain('text-xs');
  });
});
