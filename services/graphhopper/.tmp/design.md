# GraphHopper設定修正 設計書

## 問題の分析

現在のエラー「At least one initial statement under 'speed' is required」は、GraphHopperのカスタムモデル設定に関する問題です。

### 原因
1. GraphHopper 9.1では、カスタムモデルを使用する際に`weighting`プロパティが必須
2. `custom_model_files`の代わりに`custom_model`を直接指定する必要がある可能性
3. プロファイル設定でvehicleタイプの指定が不足している

## 解決方針

### 方針1: シンプルな設定で動作確認
1. まず最小限の設定（config-simple.yml）で動作確認
2. weightingをcustomではなくfastestやshortestに設定
3. カスタムモデルを使用しない基本的な設定から始める

### 方針2: カスタムモデルの正しい実装
1. プロファイルにvehicleタイプを明示的に指定
2. カスタムモデルをインラインで定義
3. 必要なencoded_valuesを正しく設定

## 実装手順

1. **基本設定ファイルの作成**
   - 最小限の設定でcarプロファイルを動作させる
   - weightingはshortestまたはfastestを使用

2. **カスタムモデル対応設定の作成**
   - vehicleタイプを明示的に指定
   - カスタムモデルをインラインで記述
   - 必要なencoded_valuesを追加

3. **動作確認**
   - モックサーバーを停止
   - 実際のGraphHopperで動作確認
   - エラーログの確認と修正

## 期待される結果
- GraphHopperが正常に起動
- carプロファイルでルート検索が可能
- エラーなしでAPIレスポンスが返される