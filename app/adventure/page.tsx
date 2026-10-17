import { PageHeading } from "@/components/layout/page-heading";
import { RouteReady } from "@/components/adventure/route-ready";
export const metadata = { title: "経路の準備" };
export default function AdventurePage() {
  return <><PageHeading eyebrow="経路情報" title="次の道が、冒険になる。">この画面では準備した経路情報を確認できます。実走行の案内は行いません。</PageHeading><RouteReady /></>;
}
