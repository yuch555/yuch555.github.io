#!/bin/sh
# dist/ をさくらのレンタルサーバへ rsync する。
# 使い方: SAKURA_USER=xxx SAKURA_HOST=xxx.sakura.ne.jp SAKURA_DIR=www/ npm run deploy
set -eu

: "${SAKURA_USER:?SAKURA_USER を設定してください}"
: "${SAKURA_HOST:?SAKURA_HOST を設定してください}"
: "${SAKURA_DIR:?SAKURA_DIR を設定してください(例: www/)}"

[ -d dist ] || { echo "dist/ がありません。先に npm run build を実行してください" >&2; exit 1; }

# 確認用に、まず変更内容だけ表示する
rsync -avzn --delete dist/ "${SAKURA_USER}@${SAKURA_HOST}:${SAKURA_DIR}"
printf '上の内容で反映します。よろしいですか? [y/N] '
read -r answer
[ "$answer" = "y" ] || { echo "中止しました"; exit 1; }

rsync -avz --delete dist/ "${SAKURA_USER}@${SAKURA_HOST}:${SAKURA_DIR}"
