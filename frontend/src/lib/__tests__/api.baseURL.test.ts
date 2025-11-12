import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

// Vamos validar o baseURL configurado no axios instance exportado por @/lib/api

const ORIGINAL_ENV = process.env;
let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
  // JSDOM já usa http://localhost por padrão
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  process.env = ORIGINAL_ENV;
  // Nada a restaurar para location
  warnSpy?.mockRestore();
});

describe('api baseURL resolution', () => {
  test('corrige porta 3000 para 3001 em localhost', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3000/api';
    jest.isolateModules(() => {
      const { api } = require('@/lib/api');
      expect(api.defaults.baseURL).toBe('http://localhost:3001/api');
    });
  });

  test('usa fallback padrão quando NEXT_PUBLIC_API_URL é inválido', () => {
    process.env.NEXT_PUBLIC_API_URL = 'http://invalid:^';
    jest.isolateModules(() => {
      const { api } = require('@/lib/api');
      expect(api.defaults.baseURL).toBe('http://localhost:3001');
    });
  });

  test('usa padrão localhost:3001 quando NEXT_PUBLIC_API_URL não está definido', () => {
    delete process.env.NEXT_PUBLIC_API_URL;
    jest.isolateModules(() => {
      const { api } = require('@/lib/api');
      expect(api.defaults.baseURL).toBe('http://localhost:3001');
    });
  });
});