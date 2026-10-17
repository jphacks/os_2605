import { ActionLink } from "@/components/ui/action-link";
export default function HomePage() {
  return (
    <>
      <section className="grid items-center gap-8 py-8 sm:grid-cols-[1.3fr_1fr] sm:py-16">
        <div>
          <p className="mb-6 text-xs font-bold tracking-[0.2em] text-[#667944]">
            いつもの道から、知らない景色へ。
          </p>
          <h1 className="text-4xl leading-[1.5] font-bold tracking-tight sm:text-5xl">
            時間は決める。
            <br />
            行き先は決めない。
          </h1>
          <p className="my-7 max-w-md text-sm leading-8 text-[#546757]">
            バイクでも、車でも。
            <br />
            時間と気分を選んだら、まだ知らない場所へ。
            <br />
            到着するまで行き先が秘密の、小さな冒険。
          </p>
          <ActionLink href="/setup">冒険を始める</ActionLink>
          <p className="mt-3 text-xs text-[#546757]">
          現在は条件の選択・保存まで体験できます。
          </p>
        </div>
        <div
          aria-hidden="true"
          className="relative flex aspect-square items-center justify-center rounded-full border border-[#cbd4ba] bg-[#e7ecd9]"
        >
          <div className="absolute inset-7 rounded-full border border-dashed border-[#a9ba92]" />
          <div className="absolute inset-14 rounded-full border border-[#cbd4ba]" />
          <span className="absolute top-9 text-xs tracking-widest text-[#667944]">
            まだ知らない場所
          </span>
          <span className="text-[120px] leading-none text-[#355c3e]">↗</span>
          <span className="absolute bottom-10 rounded-full bg-[#f5f5ed] px-5 py-2 text-xs">
            目的地は、お楽しみ。
          </span>
        </div>
      </section>
      <section
        aria-label="冒険の流れ"
        className="grid gap-5 border-t border-[#d8dece] py-8 sm:grid-cols-3"
      >
        {[
          [
            "01",
            "時間と気分を選ぶ",
            "片道の時間と、出会いたい景色を選びます。",
          ],
          ["02", "案内に身をまかせる", "行き先を知らないまま、次の道へ。"],
          ["03", "到着して、発見する", "たどり着いた場所が、今回の目的地。"],
        ].map(([n, t, d]) => (
          <div key={n}>
            <p className="text-xs text-[#667944]">{n}</p>
            <h2 className="my-3 font-bold">{t}</h2>
            <p className="text-sm leading-6 text-[#546757]">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}
