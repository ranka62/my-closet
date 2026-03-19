# MyCloset デプロイ手順

このアプリケーションを本番環境（サービスとして公開）するためのデプロイ手順です。
推奨プラットフォームは **Vercel** と **Vercel Postgres** です。

## 1. データベースの変更 (SQLite から PostgreSQL へ)

ローカル開発ではSQLiteを使用していますが、Vercel上ではデータを永続化するためにPostgreSQLが必要です。

1. `prisma/schema.prisma` を開き、`datasource` を変更します：

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. `prisma.config.ts` を削除するか、以下のように設定を残します（Vercelでは通常不要です）。

3. Vercelのダッシュボードで新しいプロジェクトを作成し、GitHubリポジトリと連携します。
4. Vercelの「Storage」タブから「Postgres」データベースを作成し、プロジェクトに接続します。
   （これにより `DATABASE_URL` などの環境変数が自動的に設定されます）

## 2. 環境変数の設定

Vercelのプロジェクト設定（Settings > Environment Variables）で以下の変数を追加します：

- `NEXTAUTH_URL`: `https://あなたのドメイン.vercel.app` (本番環境のURL)
- `NEXTAUTH_SECRET`: 任意のランダムな文字列（例: `openssl rand -base64 32` で生成）
- `GEMINI_API_KEY`: Google AI Studioで取得したGemini APIのキー

## 3. ビルドコマンドの設定

Vercelのビルド設定で、デプロイ時にデータベースのマイグレーションが実行されるようにします。

- Build Command: `npx prisma generate && npx prisma db push && next build`

## 4. デプロイの実行

設定が完了したら、Vercelでデプロイを実行します。デプロイ完了後、発行されたURLにアクセスして動作を確認してください。

## （オプション）画像ストレージについて

現在、画像のアップロードはBase64形式でデータベースに直接保存される実装になっています。
より本格的な運用を行う場合は、**Vercel Blob** や **AWS S3**、**Cloudinary** などの外部ストレージサービスを導入し、画像URLのみをDBに保存する設計に変更することをおすすめします。
