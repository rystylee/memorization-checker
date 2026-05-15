# MemorizationChecker Web App 開発計画

## プロジェクト概要

### 目的
2つのテキスト入力（AとB）の一致度をチェックするWebアプリケーション。テキストAを参照元、テキストBを比較対象として、どの程度の文章が一致しているかを定量的に評価する。

### ユースケース
- 著作物の記憶・再現度チェック
- テキストの類似性評価
- 引用元の検証

### 技術的背景
[Alignment-Whack-a-Mole-Code](https://github.com/rystylee/Alignment-Whack-a-Mole-Code)リポジトリのEvaluationアルゴリズムをベースに、Webアプリケーション向けにシンプル化した実装を行う。

---

## 技術スタック

### フロントエンド
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Runtime**: クライアントサイド処理（ブラウザ内で完結）

### デプロイ
- **Platform**: Vercel
- **CI/CD**: Vercel自動デプロイ

### 開発ツール
- **Package Manager**: npm / pnpm / yarn（プロジェクト初期化時に決定）
- **Linter**: ESLint（Next.jsデフォルト）
- **Formatter**: Prettier（推奨）

---

## プロジェクト構成

```
MemorizationChecker/
├── src/
│   ├── app/
│   │   ├── page.tsx              # メインページ（2つのテキスト入力UI）
│   │   ├── layout.tsx            # ルートレイアウト
│   │   ├── globals.css           # Tailwindグローバルスタイル
│   │   └── favicon.ico           # ファビコン
│   ├── lib/
│   │   ├── tokenizer.ts          # テキストトークン化ロジック
│   │   ├── matcher.ts            # k-gramマッチング（seed-and-extend）
│   │   ├── evaluator.ts          # 評価メトリクス計算
│   │   ├── highlighter.ts        # ハイライト処理ユーティリティ
│   │   └── types.ts              # 型定義
│   └── components/
│       ├── TextInput.tsx         # テキスト入力コンポーネント
│       ├── ResultDisplay.tsx     # 結果表示コンポーネント
│       ├── HighlightedText.tsx   # 一致部分ハイライト表示
│       ├── MetricsCard.tsx       # メトリクス表示カード
│       └── Header.tsx            # ヘッダーコンポーネント
├── docs/
│   ├── development-plan.md       # 本ドキュメント
│   └── algorithm-spec.md         # アルゴリズム仕様書
├── public/
│   └── ...                       # 静的ファイル
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

---

## 実装する機能

### 1. コアアルゴリズム（`src/lib/`）

#### 1.1 トークン化（`src/lib/tokenizer.ts`）
```typescript
function tokenize(text: string): string[]
```
- 入力テキストを単語単位に分割
- 小文字化
- 英数字を含むトークンのみ抽出
- 句読点などの記号を除去

**実装方針**:
- 正規表現ベースのシンプルな実装
- Python版のNLTK WordPunctTokenizerと同等の動作

#### 1.2 k-gramマッチング（`src/lib/matcher.ts`）
```typescript
interface Match {
  bookStart: number;
  bookEnd: number;
  genStart: number;
  genEnd: number;
  length: number;
  text: string;
}

function findMatches(
  bookTokens: string[],
  genTokens: string[],
  k: number = 5
): Match[]
```
- k-gram（デフォルト5単語）のインデックスを構築
- Seed-and-Extendアルゴリズムで一致箇所を検出
- 前後に拡張して最大一致スパンを取得

**主要関数**:
- `buildKGramIndex()`: k-gramインデックス構築
- `extendMatch()`: 一致スパンの前後拡張
- `mergeOverlappingMatches()`: 重複スパンのマージ

#### 1.3 評価メトリクス（`src/lib/evaluator.ts`）
```typescript
interface EvaluationResult {
  coverageScore: number;        // カバレッジ率（0-1）
  longestMatchLength: number;   // 最長一致スパン長（単語数）
  longestMatchText: string;     // 最長一致テキスト
  totalMatches: number;         // 一致スパン数
  matches: Match[];             // 全一致スパンのリスト
}

function evaluate(
  referenceText: string,
  comparisonText: string,
  k: number = 5
): EvaluationResult
```

**計算する指標**:
1. **カバレッジスコア**: 参照テキストのうち、何%がカバーされているか
2. **最長一致スパン**: 最も長い連続一致の単語数
3. **一致スパン数**: k単語以上の一致が何箇所あるか
4. **一致詳細リスト**: 各一致の位置・長さ・テキスト

#### 1.4 ハイライト処理（`src/lib/highlighter.ts`）
```typescript
interface HighlightSegment {
  text: string;
  isMatch: boolean;
  matchLength?: number;
}

function generateHighlights(
  text: string,
  matches: Match[]
): HighlightSegment[]
```
- テキストを一致部分と非一致部分に分割
- React表示用のセグメント配列を生成

---

### 2. UIコンポーネント（`src/components/`）

#### 2.1 src/components/TextInput.tsx
```typescript
interface TextInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  highlights?: HighlightSegment[];
}
```
- テキストエリア（大きめのサイズ）
- リアルタイム入力対応
- オプション: ハイライト表示オーバーレイ

#### 2.2 src/components/ResultDisplay.tsx
```typescript
interface ResultDisplayProps {
  result: EvaluationResult | null;
  isLoading?: boolean;
}
```
- 評価結果のサマリー表示
- メトリクスカードのグリッドレイアウト
- ローディング状態の表示

#### 2.3 src/components/HighlightedText.tsx
```typescript
interface HighlightedTextProps {
  segments: HighlightSegment[];
  colorScheme?: 'reference' | 'comparison';
}
```
- セグメント配列をもとにハイライト表示
- 一致部分を背景色で強調
- 長さに応じた色の濃淡（オプション）

#### 2.4 src/components/MetricsCard.tsx
```typescript
interface MetricsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
}
```
- 個別メトリクスの表示カード
- アイコン + 数値 + 説明のレイアウト

#### 2.5 src/components/Header.tsx
- アプリケーションタイトル
- 簡単な使い方説明
- GitHubリンク（オプション）

---

### 3. メインページ（`src/app/page.tsx`）

#### レイアウト構成
```
+------------------------------------------+
| Header                                   |
+------------------------------------------+
| [TextInput A]        | [TextInput B]     |
| (参照テキスト)        | (比較テキスト)      |
|                      |                   |
|                      |                   |
+------------------------------------------+
| ResultDisplay                            |
| - Coverage Score                         |
| - Longest Match                          |
| - Total Matches                          |
+------------------------------------------+
| HighlightedText (参照)                   |
+------------------------------------------+
| HighlightedText (比較)                   |
+------------------------------------------+
```

#### 状態管理
```typescript
const [referenceText, setReferenceText] = useState('');
const [comparisonText, setComparisonText] = useState('');
const [result, setResult] = useState<EvaluationResult | null>(null);
const [isProcessing, setIsProcessing] = useState(false);
```

#### リアルタイム評価
- `useEffect`で入力変更を監視
- debounce処理（500ms程度）で過剰な計算を防止
- Web Worker（オプション）で重い処理をバックグラウンド化

---

## 実装手順

### Phase 1: プロジェクトセットアップ
1. Next.jsプロジェクト初期化
   ```bash
   npx create-next-app@latest memorization-checker \
     --typescript \
     --tailwind \
     --app \
     --src-dir
   ```
2. 必要な依存関係インストール（追加が必要なら）
3. ESLint/Prettier設定

### Phase 2: コアアルゴリズム実装
1. `src/lib/types.ts` - 型定義
2. `src/lib/tokenizer.ts` - トークン化
3. `src/lib/matcher.ts` - マッチング
4. `src/lib/evaluator.ts` - 評価関数
5. `src/lib/highlighter.ts` - ハイライト処理

**テスト方針**:
- 小さなサンプルテキストで動作確認
- コンソールログで中間結果を確認
- 元のPython実装と結果を比較

### Phase 3: UIコンポーネント実装
1. `src/components/MetricsCard.tsx` - 基本カード
2. `src/components/TextInput.tsx` - テキスト入力
3. `src/components/HighlightedText.tsx` - ハイライト表示
4. `src/components/ResultDisplay.tsx` - 結果表示
5. `src/components/Header.tsx` - ヘッダー

### Phase 4: メインページ統合
1. `src/app/page.tsx` - レイアウト構築
2. 状態管理ロジック
3. リアルタイム評価の実装
4. debounce処理の追加

### Phase 5: スタイリング＆UX改善
1. Tailwind CSSでデザイン調整
2. レスポンシブ対応（モバイル/タブレット/デスクトップ）
3. ローディング表示
4. エラーハンドリング
5. 空状態の表示

### Phase 6: 最適化
1. 大規模テキストでのパフォーマンステスト
2. メモ化（`useMemo`）の適用
3. Web Worker化（必要に応じて）
4. バンドルサイズ最適化

### Phase 7: デプロイ
1. Vercel連携
2. 環境変数設定（必要なら）
3. 本番ビルドテスト
4. デプロイ＆動作確認

---

## パフォーマンス考慮事項

### クライアントサイド処理の制約
- ブラウザメモリ制限: 大規模テキスト（数MB以上）は注意
- UIブロッキング: 計算中もUIを応答可能に保つ

### 最適化手法
1. **debounce**: 入力変更から500ms後に評価開始
2. **useMemo**: トークン化結果をキャッシュ
3. **Web Worker**: 重い計算をバックグラウンドスレッドで実行
4. **仮想スクロール**: 非常に長いハイライトテキストの表示

### 目標パフォーマンス
- 小規模（1,000単語以下）: <100ms
- 中規模（10,000単語）: <1秒
- 大規模（100,000単語）: <10秒（Web Worker使用）

---

## デプロイ手順（Vercel）

### 初回デプロイ
1. GitHubリポジトリ作成＆プッシュ
2. Vercelアカウント連携
3. プロジェクトインポート
4. 自動デプロイ

### 設定
- **Framework Preset**: Next.js（自動検出）
- **Build Command**: `npm run build`（デフォルト）
- **Output Directory**: `.next`（デフォルト）
- **環境変数**: なし（クライアントサイドのみの場合）

### 継続的デプロイ
- `main`ブランチへのプッシュで自動デプロイ
- プレビューデプロイ（PRごと）

---

## 今後の拡張案

### 機能追加
- ファイルアップロード（.txt, .md対応）
- 結果のエクスポート（JSON/CSV）
- 履歴保存（LocalStorage）
- 複数比較モード（1つの参照 vs 複数の比較）
- パラメータ調整UI（kの値変更）

### アルゴリズム改善
- フル版の4メトリクス対応
- Instruction trimming対応
- 異なる言語対応（日本語分かち書きなど）

### UI/UX改善
- ダークモード対応
- 一致箇所へのジャンプ機能
- 統計グラフ表示（Chart.js等）
- 比較結果のシェア機能

---

## 参考資料

- [Alignment-Whack-a-Mole-Code](https://github.com/rystylee/Alignment-Whack-a-Mole-Code)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)

---

**作成日**: 2026-05-15
**更新日**: 2026-05-15 (src/ディレクトリ構成に更新)
