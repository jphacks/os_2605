# リポジトリの作業ルール

## GitHub運用

- `main` へ直接pushしない。機能・修正ごとに作業ブランチを作り、Pull Requestで変更を提案する。
- Issueごとに最新のmainからブランチを作成する。既存コードと設定を確認してから必要な変更だけを行う。
- ブランチ名は `feat/内容`、`fix/内容`、`docs/内容`、`chore/内容` など、目的が分かるものにする。
- 大きな変更はレビュー可能な単位に分割し、1つのPRで扱う目的を絞る。
- Issueには「何を」「なぜ」「完了条件」を記載する。PRには関連Issue、変更内容、確認結果を記載する。
- 作業開始時にブランチと差分を確認し、既存の未コミット変更やステージ済み変更を勝手に取り消したり、別目的のコミットに混ぜたりしない。

## 秘密情報

- `.env`、APIキー、秘密鍵、個人情報をコミットしない。コード・テストデータ・ログ・画像にも含めない。
- `.env.example` は変数名と空値または明らかなダミー値だけを記載する。
- コミット前に対象差分と追加ファイルを確認する。`.gitignore`だけで秘密情報の混入を防げると考えない。

## ドキュメントと確認

- 環境構築方法や環境変数を追加・変更したら、READMEも同じPRで更新する。
- READMEには環境構築手順、必要な環境変数名と用途を記載し、実際の値は記載しない。
- 未実装・未検証の手順は、その状態を明記する。
- 変更に応じた確認を行い、PRに結果と未確認事項を記載する。

## 実装範囲とレビュー

- 仕様書とIssueにない機能を勝手に追加しない。未実装機能は利用者に分かるように表示する。
- 実装後に `npm run lint`、`npm run typecheck`、`npm run build` を実行し、変更に応じた動作確認・テストを行う。
- 確認できなかった項目は理由を記載する。
- PRのマージはレビュー後に行い、明示的な指示なしにマージしない。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
