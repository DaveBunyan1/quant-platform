import { describe, it, expect } from 'vitest';
import { loginSchema, registerSchema } from '../schemas/auth.schemas';

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      username: 'user@example.com',
      password: 'secret',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty email', () => {
    const result = loginSchema.safeParse({
      username: '',
      password: 'secret',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/email is required/i);
    }
  });

  it('rejects invalid email format', () => {
    const result = loginSchema.safeParse({
      username: 'not-an-email',
      password: 'secret',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/valid email/i);
    }
  });

  it('rejects password shorter than minimum', () => {
    const result = loginSchema.safeParse({
      username: 'user@example.com',
      password: 'abc',
    });
    expect(result.success).toBe(false);
  });
});

describe('registerSchema', () => {
  const valid = {
    email: 'user@example.com',
    username: 'dave',
    password: 'secret',
    confirmPassword: 'secret',
  };

  it('accepts valid registration data', () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects mismatched passwords', () => {
    const result = registerSchema.safeParse({
      ...valid,
      confirmPassword: 'different',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmIssue = result.error.issues.find((i) => i.path.includes('confirmPassword'));
      expect(confirmIssue?.message).toMatch(/do not match/i);
    }
  });

  it('rejects missing username', () => {
    const result = registerSchema.safeParse({
      ...valid,
      username: '',
    });
    expect(result.success).toBe(false);
  });
});
