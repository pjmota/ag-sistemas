/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mapeia CSS Modules para evitar erros em testes
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
    // Mapeia arquivos de estilo simples
    '^.+\\.(css|sass|scss)$': '<rootDir>/test/__mocks__/styleMock.js',
  },
  collectCoverageFrom: [
    'src/components/forms/**/*.{ts,tsx}',
    'src/components/ui/**/*.{ts,tsx}',
    'src/components/admin/**/*.{ts,tsx}',
    'src/components/auth/**/*.{ts,tsx}',
    'src/components/modules/**/*.{ts,tsx}',
    'src/functions/**/*.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75,
    },
  },
};
module.exports = config;