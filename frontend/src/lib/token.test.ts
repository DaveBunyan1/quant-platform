import { describe, it, expect, beforeEach } from 'vitest';
import { tokenStore } from './token';

describe('tokenStore', () => {
  beforeEach(() => {
    tokenStore.clear();
  });

  it('starts empty', () => {
    expect(tokenStore.get()).toBeNull();
  });

  it('stores and retrieves a token', () => {
    tokenStore.set('abc123');
    expect(tokenStore.get()).toBe('abc123');
  });

  it('clears the token', () => {
    tokenStore.set('abc123');
    tokenStore.clear();
    expect(tokenStore.get()).toBeNull();
  });

  it('allows setting null', () => {
    tokenStore.set('abc123');
    tokenStore.set(null);
    expect(tokenStore.get()).toBeNull();
  });
});
