import { PageHeading } from "@/components/layout/page-heading";
import { SetupForm } from "@/components/adventure/setup-form";
export const metadata = { title: "冒険の条件" };
export default function SetupPage() {
  return (
    <>
      <PageHeading eyebrow="冒険の準備" title="今日の気分で、出かけよう。">
        行き先はまだ決めなくて大丈夫。時間と気分を選びましょう。
      </PageHeading>
      <SetupForm />
    </>
  );
}
