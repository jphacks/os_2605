import { PageHeading } from "@/components/layout/page-heading";
import { DestinationFlow } from "@/components/adventure/destination-flow";
export const metadata = { title: "目的地を決める" };
export default function DestinationPage() {
  return (
    <>
      <PageHeading eyebrow="目的地の決定" title="行き先は、おまかせで。">
        選んだ条件に合う目的地を、アプリが決めます。
      </PageHeading>
      <DestinationFlow />
    </>
  );
}
