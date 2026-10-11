import { LearningBuilder } from "@/components/admin/learning-builder";
import { LearningPublishWorkflow } from "@/components/admin/learning-publish-workflow";

export default function Page() {
  return (
    <>
      <LearningPublishWorkflow />
      <LearningBuilder />
    </>
  );
}
