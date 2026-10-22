import type { Config } from "jest";
import nextJest from "next/jest.js";

// next/jest wires up SWC transforms, CSS/font mocks and next.config loading.
const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
};

export default createJestConfig(config);
