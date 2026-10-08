"use client";
import { createContext, useContext } from "react";
import type { Topic } from "../lib/topics";
const ContentContext = createContext<Topic[]>([]);
const CountContext = createContext(0);
export function ContentProvider({
  topics,
  count,
  children,
}: {
  topics: Topic[];
  count: number;
  children: React.ReactNode;
}) {
  return (
    <ContentContext.Provider value={topics}>
      <CountContext.Provider value={count}>{children}</CountContext.Provider>
    </ContentContext.Provider>
  );
}
export function useTopics() {
  return useContext(ContentContext);
}

export function usePublishedCount() {
  return useContext(CountContext);
}
