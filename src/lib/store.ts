import "server-only";
import { onlineBackend } from "./backend";
import type { Question } from "./content";
import type { Mastery } from "./scoring";
export type { User, Attempt } from "./store-types";
import type { Attempt } from "./store-types";
async function adapter() {
  return onlineBackend() ? import("./store-supabase") : import("./store-local");
}
export async function getUser(token?: string) {
  return (await adapter()).getUser(token);
}
export async function register(
  email: string,
  name: string,
  password: string,
  grade: string,
  goal: number,
  origin: string,
) {
  if (onlineBackend())
    return (await import("./store-supabase")).register(
      email,
      name,
      password,
      grade,
      goal,
      origin,
    );
  const local = await import("./store-local");
  return {
    user: local.createUser(email, name, password, grade, goal),
    confirmationRequired: false,
  };
}
export async function authenticate(email: string, password: string) {
  return (await adapter()).authenticate(email, password);
}
export async function newSession(userId: string) {
  return onlineBackend()
    ? null
    : (await import("./store-local")).newSession(userId);
}
export async function logout(token: string) {
  return (await adapter()).logout(token);
}
export async function getAttempt(id: string, userId: string) {
  // Both adapters use UUID identities; malformed input must not become a Postgres storage error.
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(id)
  )
    return null;
  return (await adapter()).getAttempt(id, userId);
}
export async function activeAttempt(
  userId: string,
  kind: string,
  topic: string | null,
) {
  return (await adapter()).activeAttempt(userId, kind, topic);
}
export async function createAttempt(
  userId: string,
  kind: string,
  topic: string | null,
  questions: Question[],
) {
  return (await adapter()).createAttempt(userId, kind, topic, questions);
}
export async function saveAttempt(a: Attempt) {
  return (await adapter()).saveAttempt(a);
}
export async function getMastery(userId: string) {
  return (await adapter()).getMastery(userId);
}
export async function finalize(
  a: Attempt,
  result: Attempt["result"],
  masteries: Mastery[],
  old: Mastery[],
) {
  if (onlineBackend())
    return (await import("./store-supabase")).finalize(
      a,
      result,
      masteries,
      old,
    );
  return (await import("./store-local")).finalize(a, result, masteries, old);
}
export async function progress(userId: string) {
  return (await adapter()).progress(userId);
}

export async function seenQuestionIds(userId: string) {
  return (await adapter()).seenQuestionIds(userId);
}
