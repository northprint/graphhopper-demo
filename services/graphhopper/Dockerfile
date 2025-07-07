FROM openjdk:17-slim

WORKDIR /graphhopper

# GraphHopperをダウンロード
RUN apt-get update && \
    apt-get install -y curl && \
    curl -L -o graphhopper.jar \
    https://repo1.maven.org/maven2/com/graphhopper/graphhopper-web/9.1/graphhopper-web-9.1.jar && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# 設定ファイルとカスタムモデルをコピー
COPY config.yml /graphhopper/config.yml
COPY custom_models /graphhopper/custom_models

# ヘルスチェック用のエントリポイントスクリプト
COPY entrypoint.sh /graphhopper/entrypoint.sh
RUN chmod +x /graphhopper/entrypoint.sh

# ポート公開
EXPOSE 8989

# メモリ設定
ENV JAVA_OPTS="-Xmx2g -Xms1g"

# GraphHopperを起動
ENTRYPOINT ["/graphhopper/entrypoint.sh"]