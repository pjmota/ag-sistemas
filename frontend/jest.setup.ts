import '@testing-library/jest-dom';

// Mock para window.alert no ambiente jsdom
// Evita erros "Not implemented: window.alert" durante testes
Object.defineProperty(globalThis, 'alert', {
  writable: true,
  value: jest.fn(),
});