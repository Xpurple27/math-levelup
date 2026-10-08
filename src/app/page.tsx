import Levelup from "@/components/levelup";
import { ContentProvider } from "@/components/content-context";
import { publicTopics, publishedQuestions } from "@/features/content/runtime";
export const dynamic = "force-dynamic";
export default async function Page() {
  let topics: Awaited<ReturnType<typeof publicTopics>> = [],
    count = 0;
  try {
    topics = await publicTopics();
    count = (await publishedQuestions()).length;
  } catch {
    /* Auth and the empty workspace remain usable while the operator applies SQL. */
  }
  return (
    <ContentProvider topics={topics} count={count}>
      <Levelup />
    </ContentProvider>
  );
}
