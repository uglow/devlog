/*
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

export default {
  // The test environment that will be used for testing
  testEnvironment: 'node',

  // See https://jestjs.io/docs/ecmascript-modules
  transform: {},

  // All imported modules in your tests should be mocked automatically
  automock: false,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  reporters: ['default'],

  collectCoverageFrom: ['src/**/*.js', '!src/logger.js'],
  coverageReporters: ['json-summary', 'lcov', 'text', 'html'],
  coverageDirectory: '<rootDir>/reports/coverage',
  coverageThreshold: {
    global: {
      statements: 95,
      branches: 50,
      functions: 95,
      lines: 95,
    },
  },

  moduleDirectories: ['node_modules'],
};
