import { MockClassLinkProvider } from "./mockClassLink";
import { MockCleverProvider } from "./mockClever";
import type { DemoRoster, RosterProvider } from "./types";

export * from "./classlinkSeed";
export * from "./manual";
export * from "./mockClassLink";
export * from "./mockClever";
export * from "./oneroster";
export * from "./seed";
export * from "./types";

/** Rostering systems a teacher can sign in with ("email" = typed-in rosters). */
export type RosterSource = "clever" | "google" | "classlink" | "email";

let clever: MockCleverProvider | null = null;
let classlink: MockClassLinkProvider | null = null;

/** The simulated Clever district (also used for the Google Classroom demo). */
export function getRosterProvider(): MockCleverProvider {
  clever ??= new MockCleverProvider();
  return clever;
}

export function getClassLinkProvider(): MockClassLinkProvider {
  classlink ??= new MockClassLinkProvider();
  return classlink;
}

/** The simulated rostering system behind a third-party sign-in. */
export function demoRosterFor(source: Exclude<RosterSource, "email">): RosterProvider & DemoRoster {
  return source === "classlink" ? getClassLinkProvider() : getRosterProvider();
}
