/** @type {import('jest').Config} */
module.exports = {
  roots: ["<rootDir>/src"],
  testEnvironment: "jest-environment-jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/test/setup-tests.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|sass|scss)$": "identity-obj-proxy",
    "\\.(svg|png|jpg|jpeg|gif|webp)$": "<rootDir>/src/test/file-mock.cjs",
  },
  transform: {
    "^.+\\.(t|j)sx?$": [
      "@swc/jest",
      {
        jsc: {
          parser: {
            syntax: "typescript",
            tsx: true,
          },
          transform: {
            react: {
              runtime: "automatic",
            },
          },
        },
        module: {
          type: "commonjs",
        },
      },
    ],
  },
  collectCoverageFrom: ["src/lib/**/*.{ts,tsx}", "!src/**/*.d.ts"],
  coverageDirectory: "<rootDir>/coverage/jest",
  coverageReporters: ["text", "lcov", "json-summary"],
  coverageThreshold: {
    "./src/lib/utils.ts": {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
