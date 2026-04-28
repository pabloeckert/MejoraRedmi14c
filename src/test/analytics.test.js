import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from '../hooks/useAnalytics';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    clear: vi.fn(() => { store = {}; }),
    removeItem: vi.fn(key => { delete store[key]; }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useAnalytics', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('initializes with default stats', () => {
    const { result } = renderHook(() => useAnalytics());
    expect(result.current.stats.scriptsGenerated).toBe(0);
    expect(result.current.stats.totalSessions).toBe(0);
    expect(result.current.stats.modulesUsed).toEqual({});
  });

  it('tracks script generation', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackScriptGeneration(['backup', 'performance']);
    });

    expect(result.current.stats.scriptsGenerated).toBe(1);
    expect(result.current.stats.modulesUsed.backup).toBe(1);
    expect(result.current.stats.modulesUsed.performance).toBe(1);
  });

  it('increments script count on multiple generations', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackScriptGeneration(['backup']);
      result.current.trackScriptGeneration(['backup', 'debloat']);
    });

    expect(result.current.stats.scriptsGenerated).toBe(2);
    expect(result.current.stats.modulesUsed.backup).toBe(2);
    expect(result.current.stats.modulesUsed.debloat).toBe(1);
  });

  it('tracks sessions', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackSession();
    });

    expect(result.current.stats.totalSessions).toBe(1);
  });

  it('gets top modules sorted by usage', () => {
    const { result } = renderHook(() => useAnalytics());

    act(() => {
      result.current.trackScriptGeneration(['backup']);
      result.current.trackScriptGeneration(['backup']);
      result.current.trackScriptGeneration(['performance']);
    });

    const top = result.current.getTopModules();
    expect(top[0]).toEqual({ id: 'backup', count: 2 });
    expect(top[1]).toEqual({ id: 'performance', count: 1 });
  });
});
