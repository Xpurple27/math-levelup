// Public classification labels only; teaching material lives in normalized learning tables.
export type Topic = {
  id: string;
  name: string;
  domain: string;
  section: string;
  sections?: string[];
  concept: string;
  recognize: string;
  firstStep: string;
  example: string;
  solution: string;
  mistake: string;
};
export const topics: Topic[] = [];
