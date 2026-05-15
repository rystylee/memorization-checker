# Memorization Checker

逐語的な記憶再現（verbatim recall）を定量化するWebアプリケーション。2つのテキストを比較して、どれだけ正確に再現されているかを評価します。

## 特徴

- 📊 **リアルタイム評価** - テキスト入力後、自動的に類似度を計算
- 🌏 **多言語対応** - 英語と日本語を自動検出
- ⚡ **高速処理** - 5000文字のテキストを数ミリ秒で処理
- 🎨 **ビジュアル表示** - 一致箇所をハイライトで視覚化
- 📱 **レスポンシブデザイン** - モバイルからデスクトップまで対応
- 🌓 **ダークモード対応**

## アルゴリズム

**K-gram Seed-and-Extend** 方式を採用：

1. **トークン化** - テキストを単語（英語）または文字（日本語）に分割
2. **K-gramインデックス構築** - 参照テキストから5-gramのハッシュマップを作成
3. **シード検出** - 比較テキストで一致するk-gramを検出
4. **拡張** - 一致箇所を前後に拡張
5. **マージ** - 重複する一致をマージ
6. **評価** - カバレッジスコア、最長一致などを計算

## 使い方

### 開発サーバーの起動

```bash
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### テキストの比較

1. **左側（Reference Text）** に参照テキスト（元のテキスト）を入力
2. **右側（Comparison Text）** に比較テキスト（再現されたテキスト）を入力
3. 自動的に評価が実行され、結果が表示されます

### 評価指標

- **Coverage Score** - 参照テキストの何%が比較テキストに含まれているか
- **Total Matches** - k個以上の単語/文字で一致した箇所の数
- **Longest Match** - 最も長く連続して一致した単語/文字数
- **ハイライト表示** - 一致箇所が色付けされて表示

## テストの実行

```bash
# 英語アルゴリズムのテスト
npx tsx __tests__/test-algorithm.ts

# 日本語（羅生門）のテスト
npx tsx __tests__/test-rashomon.ts

# ハイライト機能のテスト
npx tsx __tests__/test-highlight.ts
```

## プロジェクト構成

```
memorization-checker/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx           # メインページ
│   │   └── globals.css        # グローバルスタイル
│   ├── components/            # Reactコンポーネント
│   │   ├── Header.tsx         # ヘッダー
│   │   ├── TextInput.tsx      # テキスト入力エリア
│   │   ├── ResultDisplay.tsx  # 結果表示
│   │   ├── HighlightedText.tsx # ハイライト表示
│   │   └── MetricsCard.tsx    # メトリクスカード
│   └── lib/                   # コアアルゴリズム
│       ├── types.ts           # 型定義
│       ├── tokenizer.ts       # トークナイザー
│       ├── matcher.ts         # マッチングアルゴリズム
│       ├── evaluator.ts       # 評価関数
│       └── highlighter.ts     # ハイライト生成
├── __tests__/                 # テストファイル
├── 羅生門/                    # サンプルデータ
│   ├── 羅生門_原文.txt
│   └── 羅生門_生成文.txt
└── docs/                      # ドキュメント
    ├── algorithm-spec.md      # アルゴリズム仕様
    └── development-plan.md    # 開発計画
```

## 技術スタック

- **フレームワーク** - Next.js 16 (App Router)
- **言語** - TypeScript 5
- **スタイリング** - Tailwind CSS 4
- **パッケージマネージャー** - pnpm
- **ランタイム** - 完全にクライアントサイド（ブラウザ内処理）

## パフォーマンス

- 小テキスト（<1,000文字）: <100ms
- 中テキスト（~5,000文字）: <10ms
- 大テキスト（>10,000文字）: 要Web Worker対応（今後の拡張）

## 今後の拡張予定

- [ ] ファイルアップロード機能（.txt, .md）
- [ ] 結果のエクスポート（JSON, CSV）
- [ ] ローカルストレージによる履歴保存
- [ ] k パラメータの調整UI
- [ ] Web Worker による大規模テキスト対応
- [ ] 統計グラフ・チャート表示
- [ ] より高度な形態素解析（日本語）

## ライセンス

MIT

## 貢献

プルリクエストを歓迎します！

## 参考

このプロジェクトは、Python の "Alignment-Whack-a-Mole" アルゴリズムを TypeScript/Next.js で再実装したものです。
