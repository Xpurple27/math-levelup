export type View =
  | "dashboard"
  | "learn"
  | "practice"
  | "tryout"
  | "progress"
  | "exam"
  | "result";
export type User = {
  id: string;
  name: string;
  email: string;
  grade: string;
  goal: number;
};
export type Result = {
  score: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
};
export type Q = {
  id: string;
  topic: string;
  section: string;
  difficulty: string;
  instruction?: string;
  stimulus?: string;
  media?: {
    id: string;
    role: string;
    url: string;
    alt: string;
    kind?: string;
  }[];
  stem: string;
  options: string[];
  correct?: number;
  hint?: string;
  explanation?: import("@/lib/content").Question["explanation"];
};
export type Attempt = {
  id: string;
  kind: string;
  topic: string | null;
  started: number;
  deadline: number | null;
  serverNow: number;
  status: string;
  questions: Q[];
  answers: Record<string, number>;
  feedback: Record<
    string,
    { tries: number; done: boolean; correct: boolean; selected: number }
  >;
  result: Result | null;
};
export type History = {
  id: string;
  kind: string;
  topic: string | null;
  started: number;
  result: Result;
};

export type Auth = "login" | "register" | "confirmation" | null;
export type ActionReply = { attempt?: Attempt; confirmationRequired?: boolean };
export type Topic = (typeof import("@/lib/topics").topics)[number];
