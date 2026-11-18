import { MockCleverProvider } from "./mockClever";

export * from "./mockClever";
export * from "./seed";
export * from "./types";

let provider: MockCleverProvider | null = null;

/** The app's roster source. Replace with a real Clever/Google client later. */
export function getRosterProvider(): MockCleverProvider {
  provider ??= new MockCleverProvider();
  return provider;
}
