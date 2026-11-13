module.exports = {
  preset: 'jest-expo',
  // Los módulos de dominio están fuera de native/, pero Babel usa el runtime
  // instalado por esta app. No depender de node_modules del directorio padre.
  modulePaths: ['<rootDir>/node_modules'],
  testMatch: [
    '<rootDir>/tests/**/*.test.ts',
    '<rootDir>/tests/**/*.test.tsx',
    '<rootDir>/src/**/*.test.ts',
    '<rootDir>/src/**/*.test.tsx',
  ],
  clearMocks: true,
};
