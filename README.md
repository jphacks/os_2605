# 謎の目的地ナビ

**時間は決める。行き先は決めない。**

乗り物・片道の時間・ジャンルを選び、到着するまで行き先を知らずに冒険するスマートフォン向けWebアプリです。JPHACKS 2026に向けて開発しています。

詳細は[開発仕様書](SPEC.md)、開発時のルールは[AGENTS.md](AGENTS.md)を参照してください。

## 現在できること

- トップ画面から条件入力画面へ移動する。
- バイク／自動車、30・60・90・120分、6種類のジャンルを選択する。
- ナビ画面と到着画面のレイアウトを確認する。

条件入力からデモの目的地と経路を準備し、所要時間・距離を確認できます。**すべての登録地点・デモ経路は検証用の架空データ／模式図です。実走行には使えません。** 矢印ナビ・地図UI・音声案内・到着判定は未実装です。準備したAdventurePlanとRouteはReact Contextのメモリだけで保持し、画面遷移で維持、再読み込み・破棄操作で終了します。ブラウザの保存領域には書き込みません。

## 使用技術・開発環境

- Node.js 24.x（`.nvmrc`参照）とnpm 11.x
- Next.js 16 / App Router、React、TypeScript
- Tailwind CSS 4 / PostCSS、ESLint 9
- Git / GitHub

この開発環境ではTurbopackの内部プロセスがポート制限により起動できないため、開発・ビルドにはNext.jsが提供するWebpackオプションを使用しています。

依存関係の解決結果は`package-lock.json`で共有します。デモでは外部APIもデータベースも使用しません。live用のサーバーアダプターはGoogle Routes APIを呼び出します。現在の架空地点はlive取得を拒否します。

## 環境構築・起動

```sh
git clone https://github.com/jphacks/os_2605.git
cd os_2605
# nvmを使用している場合
nvm install
nvm use
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。nvmを使用しない場合はNode.js 24.xを別途インストールしてください。ロックファイルと厳密に同じ依存関係を再現する場合は`npm ci`を使用できます。

### 環境変数

初期画面の起動には環境変数の設定は不要です。live APIを設定する際は、次のコマンドでローカル設定ファイルを作成し、必要な値を手元で設定します。

```sh
cp .env.example .env.local
```

| 変数名 | 用途 | 現在の利用状況 |
| --- | --- | --- |
| `GOOGLE_MAPS_API_KEY` | サーバー側の経路API呼び出し用 | live経路取得で使用（サーバーのみ） |
| `NEXT_PUBLIC_APP_URL` | アプリの公開URL設定用 | 未使用・要否は連携実装時に確定 |

値をREADMEやソースコードに書かないでください。`NEXT_PUBLIC_`付き変数はブラウザに公開されるため、秘密情報を設定しません。`.env.example`には名前と空値のみを記載します。

## 確認・ビルド

```sh
npm run lint
npm run typecheck
npm run build
# ビルド済みアプリの起動
npm start
```

`typecheck`はNext.jsのルート型を生成してからTypeScriptを検査します。`npm test`はVitestで`tests/`配下のユニットテストを実行します。目的地選択ロジック（ジャンル・乗り物・片道時間±15分の境界・候補0/1/複数件・seed再現・不正な設定値・登録データの形式）と経路取得・APIのテストを実行します。ナビ・到着判定のテストは後続Issueで追加します。

### 画面の確認手順

| URL | 確認内容 |
| --- | --- |
| `/` | 製品名と説明、「冒険を始める」から`/setup`への遷移 |
| `/setup` | 自動車・90分・絶景を選択→経路準備→準備完了・時間・距離→冒険開始。バイクでもデモを確認可能 |
| `/adventure` | 準備した経路の時間・距離、模式図の注意表示、破棄操作。再読み込み後は未準備表示 |
| `/arrived` | 到着画面のプレビュー表示、実績がない旨、トップへ戻る操作 |

PCとスマートフォン幅（320px・390px）で確認してください。キーボードのTab・矢印キーでも条件選択とリンクを操作できること、横スクロールが出ないことを確認します。実機のiOS Safari・Android Chromeでの確認はリリース前に別途必要です。

## ディレクトリ構成

```text
app/                    # 4画面と共通レイアウト
components/layout/      # ページ見出し
components/ui/          # 共通リンク
components/adventure/   # 条件入力UI
features/adventure/     # 選択肢の定義
lib/location/           # GPS／デモ共通のLocationProviderインターフェース
types/                  # 仕様書に対応する基本型
.github/                # Issue・PRテンプレート
```

`app/api/`に経路取得・冒険準備のRoute Handlers、`lib/routing/`にプロバイダーとGoogle形式の変換、`features/adventure/route-planner.ts`に経路時間による選択、`data/demoRoutes.json`に模式図データを配置しています。

## 目的地データ（検証用）

`data/spots.json`は**開発確認用の架空データ**（名称は「検証用スポット」）です。実在の観光地・座標ではなく、名称・座標・アクセス条件を確認できていない場所は登録していません。`demoDurations`の所要時間は固定出発地点（`config/origins.ts`）に対するデモ用の仮定値で、直線距離からの計算でも実際の道路の経路情報でもありません。`supportedVehicles`もデータ上の想定で、実道路の通行安全性を保証しません。実在の場所を登録するには、名称・座標・営業時間・通行条件を確認したデータへ差し替えてください。出発地点は`demo`（固定地点）のみ対応し、`live`（GPS）は未実装です。

## 今後の実装

1. 実在の目的地データ・アクセス条件の確認とlive経路取得の実API検証
2. 通常／デモで共通利用するナビゲーションエンジンと到着判定
3. デモ位置情報再生、GPS取得、音声案内
4. 冒険／ルート確認モードの切り替えと地図描画
5. 目的地公開と90秒デモの統合

通常／デモの違いはLocationProviderに閉じ込め、案内ロジックは共通化します。表示モードは進行状態から分離します。経路準備まで実装済みで、ナビゲーション処理は後続Issueで実装します。

## GitHub運用

- Issueに「何を（概要・実装内容）」「なぜ（背景・目的）」「完了条件」を記載する。
- 最新のmainを基準に`feat/issue-番号-内容`などのブランチを作成する。
- mainへ直接pushせず、レビュー可能な単位でコミット・PRを作成する。
- PRに関連Issue、変更理由、確認結果、レビュー手順を記載する。
- `.env`、APIキー、秘密鍵、個人情報をコミットしない。追加ファイルと差分を確認する。
- 環境構築や環境変数を変更したらREADMEと`.env.example`も更新する。
- PRはレビュー後にマージする。自動でmainにマージしない。

## 依存関係の既知の課題

ESLintプラグインの互換性に合わせてESLint 9を固定しています。ESLint 10への更新は関連プラグインの対応確認後に行います。2026-10-17の`npm audit`ではLintツールの`braces`依存に起因するhighが5件報告されています。Next.js 14への強制ダウングレードは行わず、上流の修正を追跡します。本番依存のみの監査（`npm audit --omit=dev`）は0件ですが、全体監査は未解消です。

## 経路取得（開発計画上のIssue #4）

### APIと共通データ

`POST /api/routes`は登録済みIDの目的地に対する経路を取得します。任意URLは受け付けず、座標・車両・モードをサーバーで検証します。

```json
{
  "origin": { "lat": 35, "lng": 135.75 },
  "destinationId": "spot-001",
  "vehicleType": "car",
  "mode": "demo"
}
```

レスポンスは`routeId`と共通Route（`id`, `origin`, `destination`, `durationSeconds`, `distanceMeters`, `geometry`, `steps`, `provider`, `mode`, `geometryKind`, `mapCompatibility`）。geometryは緯度経度の配列で、GeoJSONへの変換時は`[lng, lat]`順にします。RouteStepは区間始点`location`、終点`endLocation`、区間の距離・時間、出発地から案内地点までの累積距離`distanceFromOriginMeters`を保持します。Googleの未知のmaneuverは`OTHER`で保持し、直進と誤認しません。後続ナビは未対応maneuverを安全に扱う必要があります。

`POST /api/adventures`は`{ "mode": "demo", "settings": { "origin": { "lat": 35, "lng": 135.75 }, "vehicleType": "car", "durationMinutes": 90, "category": "scenery" } }`を受け、`{ "plan": AdventurePlan }`を返します。ジャンル・車両・アクセス条件で候補を絞り、シャッフル後最大5件を逐次評価します。登録済み仮定時間では足切りせず、取得した経路時間の±15分（境界含む）に合う候補からランダム選択してRouteを関連付けます。全候補探索ではないため、候補が多い場合は条件を満たす地点を見落とす場合があります。条件を変更して再試行できます。Issue #3の既存`selectDestination`は互換性のため維持し、画面では新しい経路評価処理を使用します。

両APIは成功・失敗とも`Cache-Control: no-store`。失敗は`{ "error": { "code": "NO_DURATION_MATCH", "message": "…" } }`で、コードと利用者向け文言を分離します。入力不正400、未登録／経路なし404、未対応車両／条件不一致／不正データ422、認証・利用上限・通信・タイムアウト503など。外部レスポンス本文・キー・内部例外は返さず、live失敗時にデモへ自動切り替えしません。

### デモデータとliveの境界

DemoRoutingProviderはローカルJSONだけを使います。originとdestinationの一致を確認し、別の出発地に経路を付け替えません。`provider: demo-schematic`, `geometryKind: schematic`, `mapCompatibility: schematic-only`を明示します。折れ線・距離・所要時間・案内は動作検証用の仮定値で、道路データから取得したものではありません。将来の地図機能でも実道路に沿うルートとして重ね描きしないでください。

現在の`spots.json`はすべて架空データです。live APIに送るには、実在の名称・座標・営業時間・アクセス・通行条件を確認し、`liveRoutingVerified: true`を設定した登録データへの置換が必要です。既存の`accessVerified`はデモ上の仮定であり、単独ではliveを許可しません。現在の登録データでliveを要求すると`UNVERIFIED_DESTINATION`になります。画面は明示的にdemoだけを使用します。

### 外部APIの選定と利用制約（2026-10-17確認）

Google Routes API Compute Routesを選択しました。自動車用経路、Polyline、ステップごとの距離・時間・案内を同じAPIから取得できるためです。サーバーから固定HTTPSエンドポイントへ`DRIVE`・`TRAFFIC_UNAWARE`・代替経路なしで要求し、タイムアウトは8秒。渋滞を反映するETAではありません。認証はサーバー専用`GOOGLE_MAPS_API_KEY`を`X-Goog-Api-Key`ヘッダーで送り、ブラウザには公開しません。APIキーにはRoutes API制限・サーバー側の適切な利用元制限を設定してください。

FieldMaskは`routes.duration`, `routes.distanceMeters`, `routes.polyline.encodedPolyline`, `routes.legs.steps.distanceMeters`, `routes.legs.steps.staticDuration`, `routes.legs.steps.startLocation`, `routes.legs.steps.endLocation`, `routes.legs.steps.navigationInstruction`だけです。Google形式はアダプターで共通型へ変換し、欠損・負数・不正座標・不正Polyline・案内不足・累積距離や合計値の不整合を拒否します。ステップの接続・形状の始終点も検証し、要求地点から緯度経度で0.02度を超えて離れたスナップ結果は安全のため拒否します。

- [認証・セットアップ](https://developers.google.com/maps/documentation/routes/get-api-key): Google Cloudで請求とRoutes APIを有効化する必要があります。
- [対応地域](https://developers.google.com/maps/documentation/routes/coverage)・[二輪車の対応国](https://developers.google.com/maps/documentation/routes/coverage-two-wheeled): 日本の二輪車経路は対象に含まれません。この実装はliveのmotorcycleをAPI呼び出し前に拒否し、車用経路へ切り替えません。排気量別通行規制は未実装。carも経路結果だけで安全を保証しません。
- [料金・クォータ](https://developers.google.com/maps/documentation/routes/usage-and-billing)・[公式料金表](https://developers.google.com/maps/billing-and-pricing/pricing): Compute Routesはリクエスト単位の従量課金で、利用機能によりSKUが変わります。課金額は契約地域・利用量・最新の料金表で確認してください。今回の基本経路はEssentials相当を想定しますが、実請求は未検証です。候補評価上限はアプリ全体の利用上限ではありません。公開前にCloud Consoleで日次クォータを設定してください。
- [レスポンス仕様](https://developers.google.com/maps/documentation/routes/reference/rest/v2/TopLevel/computeRoutes)・[FieldMask](https://developers.google.com/maps/documentation/routes/choose_fields)を参照して実装しています。
- [ポリシー](https://developers.google.com/maps/documentation/routes/policies)・[サービス固有規約19項](https://cloud.google.com/maps-platform/terms/maps-service-terms): 経路データの保存制限を踏まえ、liveのレスポンスはリクエスト処理と画面のメモリに限り保持します。sessionStorage/localStorage・ファイル・DB・サービスワーカーのキャッシュへ保存しません。ローカルデモJSONとGoogleの取得データは分離しています。
- 同ポリシーに従い、Googleの経路を地図に描画する場合は**Googleマップ**を使用します。地図なしの表示でもGoogle Mapsの帰属を表示します。`mapCompatibility: google-maps`を後続Issue #6で尊重してください。MapLibre採用時は利用規約が互換の別プロバイダーが必要です。公開live機能の導入前に、Googleの要件を満たす利用規約・プライバシーポリシーの公開と帰属表示を整備してください。EEA契約では別規約を確認してください。

実APIキー・確認済み実地点を使った疎通および実道路上の検証は未実施です。APIリクエストとエラー処理は合成レスポンスによるテストで確認します。GPS追跡、矢印更新、地図UI、音声、到着判定、目的地公開、自動デモ再生は今回の対象外です。

### 追加テストと手動確認

`npm test`で従来の目的地選択に加え、デモ再現性・全模式図の整合性、Google変換・Polyline・案内順序・単位、不正データ、認証・上限・通信・タイムアウト、車両制限、時間の±15分境界、候補再選択・呼び出し上限、Route Handlersの入力／出力を確認します。

`npm run dev`後、`/setup`で自動車・90分・絶景→「目的地と経路を準備」→準備完了→「冒険開始」で時間・距離が維持されることを確認します。名称・座標・案内文は画面へ表示しません。`/adventure`を再読み込みすると未準備に戻ります。バイクでもdemoを確認でき、live APIは拒否します。スマートフォン実機での確認は未実施です。
