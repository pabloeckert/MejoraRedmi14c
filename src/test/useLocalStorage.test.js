import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '../hooks/useLocalStorage';

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns initial value when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('returns stored value when available', () => {
    localStorage.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorage('test-key', 'default'));
    expect(result.current[0]).toBe('stored');
  });

  it('persists value to localStorage on update', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'));

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('test-key'))).toBe('updated');
  });

  it('works with complex values (objects)', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', { a: 1 }));

    act(() => {
      result.current[1]({ a: 2, b: 3 });
    });

    expect(result.current[0]).toEqual({ a: 2, b: 3 });
    expect(JSON.parse(localStorage.getItem('test-key'))).toEqual({ a: 2, b: 3 });
  });

  it('works with booleans', () => {
    const { result } = renderHook(() => useLocalStorage('test-key', true));

    act(() => {
      result.current[1](false);
    });

    expect(result.current[0]).toBe(false);
    expect(JSON.parse(localStorage.getItem('test-key'))).toBe(false);
  });

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem('test-key', 'not-valid-json{{{');
    const { result } = renderHook(() => useLocalStorage('test-key', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });
});
