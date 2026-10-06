import type { Question } from "./content";
export type User = {
  id: string;
  email: string;
  name: string;
  goal: number;
  grade: string;
};
export type Attempt = {
  revision: number;
  id: string;
  user_id: string;
  kind: string;
  topic: string | null;
  started: number;
  deadline: number | null;
  snapshot: Question[];
  answers: Record<string, number>;
  feedback: Record<
    string,
    { tries: number; done: boolean; correct: boolean; selected: number }
  >;
  credits: Record<string, number>;
  status: string;
  result: ReturnType<typeof import("./scoring").grade> | null;
};
