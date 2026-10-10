import Levelup from "@/components/levelup";
import { ContentProvider } from "@/components/content-context";
import { publicTopics, publishedQuestions } from "@/features/content/runtime";
import { getUser } from "@/lib/store";
import { cookie } from "@/features/http";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function StudentAppPage() {
  const token = (await cookies()).get(cookie)?.value;
  const user = await getUser(token);
  if (!user) redirect("/login");

  let topics: Awaited<ReturnType<typeof publicTopics>> = [];
  let count = 0;
  try {
    topics = await publicTopics();
    count = (await publishedQuestions()).length;
  } catch {
    // The student shell remains available while content infrastructure is checked.
  }

  return (
    <ContentProvider topics={topics} count={count}>
      <Levelup />
    </ContentProvider>
  );
}
