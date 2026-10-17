import { PageHeading } from "@/components/layout/page-heading";
import { ActionLink } from "@/components/ui/action-link";
export const metadata = { title: "ナビ画面のプレビュー" };
export default function AdventurePage() {
  return (
    <>
      <PageHeading eyebrow="画面プレビュー" title="次の道が、冒険になる。">
        ナビゲーションは準備中です。冒険は開始されていません。
      </PageHeading>
      <section
        aria-label="ナビゲーションの表示予定領域"
        className="max-w-2xl rounded-3xl border border-[#cbd4ba] bg-white p-6 text-center sm:p-10"
      >
        <p className="text-xs font-bold tracking-widest text-[#667944]">
          冒険モード
        </p>
        <div className="my-8 flex min-h-40 items-center justify-center rounded-2xl bg-[#f0f3e8] text-sm text-[#546757]">
          進行方向の表示領域
        </div>
        <h2 className="text-xl font-bold">案内はまだありません</h2>
        <p className="my-4 text-sm">残り時間：未取得</p>
        <p className="text-sm text-[#546757]">目的地：未決定</p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            disabled
            className="min-h-12 rounded-xl border border-[#cbd4ba] px-4 py-3 text-sm text-[#546757]"
          >
            ルートを確認（準備中）
          </button>
          <button
            disabled
            className="min-h-12 rounded-xl border border-[#cbd4ba] px-4 py-3 text-sm text-[#546757]"
          >
            冒険を中断（準備中）
          </button>
        </div>
      </section>
      <div className="mt-6">
        <ActionLink href="/setup">条件入力へ戻る</ActionLink>
      </div>
    </>
  );
}
