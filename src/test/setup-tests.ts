import "@testing-library/jest-dom";
import { TextDecoder, TextEncoder } from "node:util";

global.TextEncoder = TextEncoder;
// @ts-expect-error
global.TextDecoder = TextDecoder;

// Provide mock environment variables for tests
process.env.DATABASE_URL =
	process.env.DATABASE_URL ?? "postgres://localhost:5432/test";
