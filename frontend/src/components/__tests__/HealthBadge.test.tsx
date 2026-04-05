import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthBadge } from '../HealthBadge';

describe('HealthBadge — testes unitários', () => {
  test('renderiza Unknown quando health é undefined', () => {
    render(<HealthBadge />);
    expect(screen.getByText('Unknown')).toBeInTheDocument();
    expect(screen.getByText('Unknown').className).toContain('slate-400');
  });

  test('renderiza OK sem latência', () => {
    render(<HealthBadge health="ok" />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  test('renderiza OK com latência', () => {
    render(<HealthBadge health="ok" latencyMs={120} />);
    expect(screen.getByText('OK 120ms')).toBeInTheDocument();
  });

  test('renderiza Warning sem latência', () => {
    render(<HealthBadge health="warning" />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });

  test('renderiza Warning com latência', () => {
    render(<HealthBadge health="warning" latencyMs={55} />);
    expect(screen.getByText('Warning 55ms')).toBeInTheDocument();
  });

  test('renderiza Error', () => {
    render(<HealthBadge health="error" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  test('valores desconhecidos renderizam como Error', () => {
    render(<HealthBadge health="unknown" />);
    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
