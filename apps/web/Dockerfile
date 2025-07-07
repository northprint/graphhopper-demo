FROM node:20-slim AS builder

WORKDIR /app

# pnpmをインストール
RUN npm install -g pnpm@9

# ルートの依存関係をコピー
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

# 依存関係をインストール
RUN pnpm install --frozen-lockfile

# アプリケーションのソースをコピー
COPY apps/web ./apps/web

# 環境変数を設定（ビルド時）
ENV PUBLIC_GRAPHHOPPER_URL=https://22fxfc9i7z.ap-northeast-1.awsapprunner.com

# ビルド
RUN cd apps/web && pnpm build

# 実行用イメージ
FROM node:20-slim

WORKDIR /app

RUN npm install -g pnpm@9

# package.jsonを先にコピー（依存関係のインストールのため）
COPY --from=builder /app/apps/web/package.json ./

# 本番用依存関係をインストール（adapter-nodeを含む）
RUN pnpm add @sveltejs/adapter-node && pnpm install --prod

# ビルド済みファイルをコピー（ディレクトリ構造を保持）
COPY --from=builder /app/apps/web/build ./build
COPY --from=builder /app/apps/web/.svelte-kit ./.svelte-kit

# App Runner用にadapter-nodeが必要なため、ビルド済みファイルを確認
RUN ls -la build/ && ls -la .svelte-kit/

# ポート公開
EXPOSE 3000

# 環境変数でポートを設定
ENV PORT=3000
ENV HOST=0.0.0.0
ENV NODE_ENV=production
ENV PROTOCOL_HEADER=x-forwarded-proto
ENV HOST_HEADER=x-forwarded-host

# アプリケーションを起動
CMD ["node", "build/index.js"]