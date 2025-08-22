module.exports = {
  // Ambiente de teste
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Arquivos de teste
  testMatch: ['**/__tests__/**/*.test.ts', '**/?(*.)+(spec|test).ts'],

  // Cobertura de código
  collectCoverageFrom: [
    'api/**/*.ts',
    '!api/**/*.d.ts',
    '!api/index.ts', // Arquivo de entrada
    '!api/types/**', // Definições de tipos
  ],

  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Setup
  setupFilesAfterEnv: ['<rootDir>/api/__tests__/setup.ts'],

  // Transformações
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },

  // Módulos
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/api/$1',
  },

  // Timeout para testes assíncronos
  testTimeout: 10000,

  // Variáveis de ambiente para testes
  setupFiles: ['<rootDir>/api/__tests__/env-setup.ts'],
};
