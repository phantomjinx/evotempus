const path = require('path');

module.exports = {
  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  moduleNameMapper: {
    '\\.(css|less|scss)$': path.resolve(__dirname, './src/__mocks__/styleMock.js'),
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      path.resolve(__dirname, './src/__mocks__/fileMock.js'),
    '@evotempus/api': path.resolve(__dirname, './src/api'),
    '@evotempus/assets': path.resolve(__dirname, './src/assets'),
    '@evotempus/components': path.resolve(__dirname, './src/components'),
    '@evotempus/layout': path.resolve(__dirname, './src/layout'),
    '@evotempus/types': path.resolve(__dirname, './src/types'),
    '@evotempus/services': path.resolve(__dirname, './src/services'),
    '@evotempus/utils': path.resolve(__dirname, './src/utils'),
  },

  // A preset that is used as a base for Jest's configuration
  preset: 'ts-jest',

  roots: ['<rootDir>'],

  // The path to a module that runs some code to configure or set up the testing framework before each test
  //setupFilesAfterEnv: [path.resolve(__dirname, './setupTests.ts')],

  // The test environment that will be used for testing. The default environment in Jest is a Node.js environment.
  // If you are building a web app, you can use a browser-like environment through jsdom instead.
  testEnvironment: 'jsdom',

  testPathIgnorePatterns: [
    "/node_modules/",
    "/src/.*/support.test.ts" // do not scan support src files for test coverage
  ],

  transform: {
    "\\.[jt]sx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
};
