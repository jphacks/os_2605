import { PageHeading } from "@/components/layout/page-heading";
import { ActionLink } from "@/components/ui/action-link";
export const metadata = { title: "到着画面のプレビュー" };
export default function ArrivedPage() {
  return (
    <>
      <PageHeading eyebrow="到着画面のプレビュー" title="冒険達成！">
        到着時に表示する画面のレイアウトです。現在、到着した冒険や訪問実績はありません。
      </PageHeading>
      <section className="max-w-2xl rounded-3xl border border-[#cbd4ba] bg-white p-6 sm:p-10">
        <p className="text-xs text-[#667944]">今回の目的地</p>
        <h2 className="mt-3 text-2xl font-bold">目的地は未決定です</h2>
        <div className="my-6 flex aspect-video items-center justify-center rounded-2xl bg-[#e7ecd9] text-sm text-[#546757]">
          目的地写真の表示領域
        </div>
        <h3 className="font-bold">この場所の見どころ</h3>
        <p className="mt-3 text-sm leading-7 text-[#546757]">
          到着判定と目的地情報の取得を実装した後、ここに見どころを表示します。
        </p>
      </section>
      <div className="mt-6">
        <ActionLink href="/">トップへ戻る</ActionLink>
      </div>
    </>
  );
}
