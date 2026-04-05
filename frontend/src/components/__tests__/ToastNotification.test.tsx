import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToastNotification } from '../ToastNotification';

describe('ToastNotification — testes unitários', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('renderiza mensagem de erro', () => {
    render(<ToastNotification message="Algo deu errado" onClose={vi.fn()} />);
    expect(screen.getByText('Algo deu errado')).toBeInTheDocument();
  });

  test('renderiza botão de fechar', () => {
    render(<ToastNotification message="Erro" onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  test('botão fechar chama onClose imediatamente', () => {
    const onClose = vi.fn();
    render(<ToastNotification message="Erro" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Fechar' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('auto-dismiss após durationMs padrão de 5000ms', () => {
    const onClose = vi.fn();
    render(<ToastNotification message="Erro" onClose={onClose} />);

    vi.advanceTimersByTime(5000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('auto-dismiss com durationMs customizado', () => {
    const onClose = vi.fn();
    render(<ToastNotification message="Erro" onClose={onClose} durationMs={7000} />);

    vi.advanceTimersByTime(7000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('estilo de borda vermelha presente', () => {
    render(<ToastNotification message="Erro" onClose={vi.fn()} />);
    const div = screen.getByText('Erro').parentElement;
    expect(div?.className).toContain('border-red-500/70');
    expect(div?.className).toContain('bg-red-500/10');
  });

  test('posicionamento fixed bottom-4 right-4', () => {
    render(<ToastNotification message="Erro" onClose={vi.fn()} />);
    const div = screen.getByText('Erro').parentElement;
    expect(div?.className).toContain('fixed');
    expect(div?.className).toContain('bottom-4');
    expect(div?.className).toContain('right-4');
  });
});
