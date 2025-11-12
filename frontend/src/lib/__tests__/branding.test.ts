import { afterEach, beforeEach, describe, expect, test } from '@jest/globals';

describe('branding.logoSrcList', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  test('sem NEXT_PUBLIC_LOGO_FILE retorna apenas formatos padrão', async () => {
    delete process.env.NEXT_PUBLIC_LOGO_FILE;
    const { logoSrcList } = await import('@/lib/branding');
    expect(logoSrcList).toEqual([
      '/branding/logo.png',
      '/branding/logo.svg',
      '/branding/logo.webp',
      '/branding/logo.jpg',
      '/branding/logo.jpeg',
    ]);
  });

  test('com NEXT_PUBLIC_LOGO_FILE inclui arquivo configurado no início', async () => {
    process.env.NEXT_PUBLIC_LOGO_FILE = 'custom.png';
    const { logoSrcList } = await import('@/lib/branding');
    expect(logoSrcList[0]).toBe('/branding/custom.png');
    expect(logoSrcList.slice(1)).toEqual([
      '/branding/logo.png',
      '/branding/logo.svg',
      '/branding/logo.webp',
      '/branding/logo.jpg',
      '/branding/logo.jpeg',
    ]);
  });
});