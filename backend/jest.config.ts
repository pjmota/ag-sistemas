import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'text-summary', 'lcov'],
  coverageThreshold:
    process.env.DISABLE_COVERAGE_THRESHOLD === '1'
      ? undefined
      : {
          global: {
            branches: 75,
            functions: 75,
            lines: 75,
            statements: 75,
          },
        },
  testPathIgnorePatterns:
    process.env.SKIP_E2E === '1' ? ['/app\\.e2e\\.spec\\.ts$'] : [],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;