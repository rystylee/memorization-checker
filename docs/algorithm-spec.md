# アルゴリズム仕様書

## 概要

本ドキュメントは、[Alignment-Whack-a-Mole-Code](https://github.com/rystylee/Alignment-Whack-a-Mole-Code)リポジトリのEvaluationアルゴリズムを、TypeScript/JavaScriptに移植するための技術仕様書である。

---

## 目的

著作物のテキストと、それを記憶している可能性のある生成テキストを比較し、どの程度の「逐語的な記憶（verbatim recall）」が存在するかを定量化する。

---

## アルゴリズムの全体像

### 処理フロー

```
入力: 参照テキスト（book）、比較テキスト（generation）
  ↓
1. トークン化（Tokenization）
  ↓
2. k-gramインデックス構築（k-gram Indexing）
  ↓
3. Seed-and-Extendマッチング（Matching）
  ↓
4. 評価メトリクス計算（Evaluation）
  ↓
出力: 一致度スコア、一致スパンリスト
```

---

## 1. トークン化（Tokenization）

### 目的
テキストを単語レベルのトークン配列に変換する。

### 元実装（Python）
```python
from nltk.tokenize import wordpunct_tokenize
import re

def tok_words(text):
    tokens = wordpunct_tokenize(text.lower())
    return [t for t in tokens if re.search(r"[A-Za-z0-9]", t)]
```

### 動作
1. テキストを小文字化
2. 単語と句読点で分割（`WordPunctTokenizer`）
3. 英数字を含むトークンのみ保持（記号だけのトークンを除外）

### TypeScript実装例
```typescript
function tokenize(text: string): string[] {
  // 小文字化
  const lower = text.toLowerCase();

  // 単語境界で分割（WordPunctTokenizerに近い動作）
  // \b\w+\b で単語を抽出
  const tokens = lower.match(/\b\w+\b/g) || [];

  // 英数字を含むもののみフィルタ
  return tokens.filter(token => /[a-z0-9]/i.test(token));
}
```

### 注意点
- NLTK `WordPunctTokenizer`は単語と句読点を分離する
- JavaScriptの正規表現 `/\b\w+\b/g` はほぼ同等の動作
- アポストロフィ（`don't` → `don`, `t`）などの扱いに注意

---

## 2. k-gramインデックス構築

### 目的
参照テキストから、k個の連続トークン（k-gram）の出現位置を高速検索できるインデックスを作成する。

### パラメータ
- **k**: k-gramの長さ（デフォルト: 5単語）

### データ構造
```typescript
type KGramIndex = Map<string, number[]>;
// キー: k-gramを連結した文字列
// 値: そのk-gramが出現する開始位置のリスト
```

### TypeScript実装例
```typescript
function buildKGramIndex(tokens: string[], k: number = 5): KGramIndex {
  const index = new Map<string, number[]>();

  for (let i = 0; i <= tokens.length - k; i++) {
    // k個のトークンを取得
    const kgram = tokens.slice(i, i + k);
    const key = kgram.join(' '); // スペース区切りで連結

    if (!index.has(key)) {
      index.set(key, []);
    }
    index.get(key)!.push(i);
  }

  return index;
}
```

### 例
```
tokens = ["the", "quick", "brown", "fox", "jumps", "over", "the", "lazy"]
k = 3

インデックス:
"the quick brown" → [0]
"quick brown fox" → [1]
"brown fox jumps" → [2]
"fox jumps over" → [3]
"jumps over the" → [4]
"over the lazy" → [5]
```

---

## 3. Seed-and-Extendマッチング

### 目的
k-gramを「シード（種）」として、前後に一致を拡張し、最大長の連続一致スパンを検出する。

### アルゴリズム

#### 3.1 シード検出
```typescript
function findSeeds(
  bookTokens: string[],
  genTokens: string[],
  bookIndex: KGramIndex,
  k: number
): Array<{bookPos: number, genPos: number}> {
  const seeds: Array<{bookPos: number, genPos: number}> = [];

  for (let genPos = 0; genPos <= genTokens.length - k; genPos++) {
    const kgram = genTokens.slice(genPos, genPos + k).join(' ');
    const bookPositions = bookIndex.get(kgram) || [];

    for (const bookPos of bookPositions) {
      seeds.push({ bookPos, genPos });
    }
  }

  return seeds;
}
```

#### 3.2 拡張（Extend）
各シードから前後に一致を拡張する。

```typescript
function extendMatch(
  bookTokens: string[],
  genTokens: string[],
  bookSeed: number,
  genSeed: number,
  k: number
): Match {
  let bookStart = bookSeed;
  let genStart = genSeed;
  let bookEnd = bookSeed + k;
  let genEnd = genSeed + k;

  // 後方に拡張
  while (
    bookEnd < bookTokens.length &&
    genEnd < genTokens.length &&
    bookTokens[bookEnd] === genTokens[genEnd]
  ) {
    bookEnd++;
    genEnd++;
  }

  // 前方に拡張
  while (
    bookStart > 0 &&
    genStart > 0 &&
    bookTokens[bookStart - 1] === genTokens[genStart - 1]
  ) {
    bookStart--;
    genStart--;
  }

  return {
    bookStart,
    bookEnd,
    genStart,
    genEnd,
    length: bookEnd - bookStart
  };
}
```

#### 3.3 重複除去
同じ領域をカバーする複数のマッチをマージする。

```typescript
function mergeOverlappingMatches(matches: Match[]): Match[] {
  if (matches.length === 0) return [];

  // 開始位置でソート
  const sorted = matches.sort((a, b) => a.bookStart - b.bookStart);
  const merged: Match[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    // 重複チェック
    if (current.bookStart <= last.bookEnd) {
      // マージ: 終端を拡張
      if (current.bookEnd > last.bookEnd) {
        last.bookEnd = current.bookEnd;
        last.genEnd = current.genEnd;
        last.length = last.bookEnd - last.bookStart;
      }
    } else {
      // 重複なし: 新規追加
      merged.push(current);
    }
  }

  return merged;
}
```

---

## 4. 評価メトリクス

### メトリクス1: カバレッジスコア（Coverage Score）

#### 定義
参照テキストの全単語のうち、何%が一致スパンでカバーされているか。

#### 計算方法
```typescript
function calculateCoverage(
  bookTokens: string[],
  matches: Match[]
): number {
  const covered = new Set<number>();

  for (const match of matches) {
    for (let i = match.bookStart; i < match.bookEnd; i++) {
      covered.add(i);
    }
  }

  return covered.size / bookTokens.length;
}
```

#### 出力
- 0.0 ～ 1.0 の範囲
- 例: 0.45 = 45%のカバレッジ

---

### メトリクス2: 最長一致スパン（Longest Match Span）

#### 定義
単一の連続一致スパンとして最も長いもの。

#### 計算方法
```typescript
function findLongestMatch(matches: Match[]): Match | null {
  if (matches.length === 0) return null;

  return matches.reduce((longest, current) =>
    current.length > longest.length ? current : longest
  );
}
```

#### 出力
- 単語数（例: 75単語）
- テキスト（該当部分の文字列）

---

### メトリクス3: 一致スパン数（Match Count）

#### 定義
k単語以上の一致スパンがいくつ存在するか。

#### 計算方法
```typescript
function countMatches(
  matches: Match[],
  threshold: number = 5
): number {
  return matches.filter(m => m.length >= threshold).length;
}
```

---

### メトリクス4: 非重複スパン選択（Optional）

元実装の「Regurgitated Spans Count」に対応。長いスパンを優先し、重複しないスパンを貪欲法で選択する。

#### アルゴリズム
```typescript
function selectNonOverlappingSpans(
  matches: Match[],
  threshold: number = 20
): Match[] {
  // 長さで降順ソート
  const sorted = matches
    .filter(m => m.length >= threshold)
    .sort((a, b) => b.length - a.length);

  const selected: Match[] = [];

  for (const candidate of sorted) {
    // 既に選択されたスパンと重複しないかチェック
    const overlaps = selected.some(s =>
      !(candidate.bookEnd <= s.bookStart || candidate.bookStart >= s.bookEnd)
    );

    if (!overlaps) {
      selected.push(candidate);
    }
  }

  return selected;
}
```

---

## 5. テキスト抽出

### 目的
トークン位置から元のテキストを復元する。

### 課題
トークン化で情報が失われる（空白、句読点の位置など）ため、完全な復元は困難。

### 簡易実装
```typescript
function extractText(
  tokens: string[],
  start: number,
  end: number
): string {
  return tokens.slice(start, end).join(' ');
}
```

### 改善案（元テキストを保持する場合）
トークン化時に各トークンの元テキストでの位置（character offset）を記録しておく。

```typescript
interface Token {
  text: string;
  charStart: number;
  charEnd: number;
}

function extractOriginalText(
  originalText: string,
  tokens: Token[],
  start: number,
  end: number
): string {
  const charStart = tokens[start].charStart;
  const charEnd = tokens[end - 1].charEnd;
  return originalText.substring(charStart, charEnd);
}
```

---

## 6. 完全な評価フロー

### 統合関数
```typescript
interface EvaluationResult {
  coverageScore: number;
  longestMatchLength: number;
  longestMatchText: string;
  totalMatches: number;
  matches: Match[];
}

function evaluate(
  referenceText: string,
  comparisonText: string,
  k: number = 5
): EvaluationResult {
  // 1. トークン化
  const bookTokens = tokenize(referenceText);
  const genTokens = tokenize(comparisonText);

  // 2. インデックス構築
  const bookIndex = buildKGramIndex(bookTokens, k);

  // 3. シード検出
  const seeds = findSeeds(bookTokens, genTokens, bookIndex, k);

  // 4. 拡張
  const rawMatches = seeds.map(seed =>
    extendMatch(bookTokens, genTokens, seed.bookPos, seed.genPos, k)
  );

  // 5. マージ
  const matches = mergeOverlappingMatches(rawMatches);

  // 6. メトリクス計算
  const coverageScore = calculateCoverage(bookTokens, matches);
  const longestMatch = findLongestMatch(matches);
  const totalMatches = countMatches(matches, k);

  return {
    coverageScore,
    longestMatchLength: longestMatch?.length || 0,
    longestMatchText: longestMatch
      ? extractText(bookTokens, longestMatch.bookStart, longestMatch.bookEnd)
      : '',
    totalMatches,
    matches
  };
}
```

---

## 7. パフォーマンス最適化

### 時間計算量
- トークン化: O(n)（n = テキスト長）
- インデックス構築: O(m)（m = book単語数）
- シード検出: O(g)（g = generation単語数）
- 拡張: O(s × L)（s = シード数、L = 平均拡張長）
- 全体: O(n + m + g + s × L)

### 空間計算量
- トークン配列: O(m + g)
- k-gramインデックス: O(m)
- 全体: O(m + g)

### 最適化手法

#### 1. インデックスキャッシュ
参照テキストが固定の場合、インデックスを再利用。

```typescript
let cachedBookTokens: string[] | null = null;
let cachedBookIndex: KGramIndex | null = null;
let cachedBookText: string | null = null;

function evaluateWithCache(
  referenceText: string,
  comparisonText: string,
  k: number = 5
): EvaluationResult {
  if (referenceText !== cachedBookText) {
    cachedBookTokens = tokenize(referenceText);
    cachedBookIndex = buildKGramIndex(cachedBookTokens, k);
    cachedBookText = referenceText;
  }

  // 以下、通常の評価処理
  // ...
}
```

#### 2. Early Exit
比較テキストがk単語未満の場合、処理をスキップ。

```typescript
if (genTokens.length < k) {
  return {
    coverageScore: 0,
    longestMatchLength: 0,
    longestMatchText: '',
    totalMatches: 0,
    matches: []
  };
}
```

#### 3. Web Worker化
重い計算をバックグラウンドスレッドで実行。

```typescript
// worker.ts
self.onmessage = (e) => {
  const { referenceText, comparisonText, k } = e.data;
  const result = evaluate(referenceText, comparisonText, k);
  self.postMessage(result);
};

// main.ts
const worker = new Worker('worker.ts');
worker.postMessage({ referenceText, comparisonText, k: 5 });
worker.onmessage = (e) => {
  const result = e.data;
  // 結果を表示
};
```

---

## 8. 元実装との相違点

### 簡略化した点
1. **Instruction Trimming**: 元実装ではプロンプトテキストとの重複を除去する機能があるが、シンプル版では省略
2. **複数生成対応**: 元実装は複数の生成テキストをまとめて評価するが、シンプル版では1対1比較
3. **BMC@k計算**: 元実装の「Book Memorization Coverage」は全書籍を対象とするが、シンプル版は入力テキストのみ
4. **区間演算**: 元実装は複雑な区間減算を行うが、シンプル版は基本的なマージのみ

### 保持した点
- k-gram + Seed-and-Extendの核心アルゴリズム
- トークン化の基本ロジック
- 評価メトリクスの概念

---

## 9. テストケース

### テストケース1: 完全一致
```typescript
const ref = "The quick brown fox jumps over the lazy dog";
const cmp = "The quick brown fox jumps over the lazy dog";

// 期待結果:
// coverageScore: 1.0 (100%)
// longestMatchLength: 9 (全単語)
// totalMatches: 1
```

### テストケース2: 部分一致
```typescript
const ref = "The quick brown fox jumps over the lazy dog";
const cmp = "The quick brown fox runs away";

// 期待結果:
// coverageScore: 0.44 (4/9 = 44%)
// longestMatchLength: 4 ("the quick brown fox")
// totalMatches: 0 (k=5未満)
```

### テストケース3: 複数スパン
```typescript
const ref = "The quick brown fox jumps over the lazy dog and the cat sleeps";
const cmp = "The quick brown fox is here and the cat sleeps soundly";

// 期待結果:
// 2つの一致スパン: "the quick brown fox" と "and the cat sleeps"
// coverageScore: 0.58 (7/12)
// longestMatchLength: 5 ("and the cat sleeps")
```

### テストケース4: 一致なし
```typescript
const ref = "Hello world";
const cmp = "Goodbye universe";

// 期待結果:
// coverageScore: 0.0
// longestMatchLength: 0
// totalMatches: 0
```

---

## 10. 実装チェックリスト

- [ ] `tokenize()`: 正しく単語分割できるか
- [ ] `buildKGramIndex()`: インデックスが正しく構築されるか
- [ ] `findSeeds()`: k-gramマッチが検出されるか
- [ ] `extendMatch()`: 前後に正しく拡張されるか
- [ ] `mergeOverlappingMatches()`: 重複が正しくマージされるか
- [ ] `calculateCoverage()`: カバレッジが正しく計算されるか
- [ ] `findLongestMatch()`: 最長スパンが正しく選択されるか
- [ ] `countMatches()`: スパン数が正しくカウントされるか
- [ ] テストケースがすべてパスするか
- [ ] 大規模テキスト（10,000単語以上）で動作するか

---

## 11. 参考: 元実装の主要部分（Python）

### トークン化
```python
def tok_words(text):
    return [t for t in wordpunct_tokenize(text.lower()) if re.search(r"[A-Za-z0-9]", t)]
```

### k-gramインデックス構築
```python
def build_index(tokens, k=5):
    index = defaultdict(list)
    for i in range(len(tokens) - k + 1):
        kgram = tuple(tokens[i:i+k])
        index[kgram].append(i)
    return index
```

### マッチング（簡略版）
```python
def match_against_book(book_tokens, gen_tokens, k=5):
    book_index = build_index(book_tokens, k)
    matches = []

    for gen_start in range(len(gen_tokens) - k + 1):
        kgram = tuple(gen_tokens[gen_start:gen_start+k])
        if kgram in book_index:
            for book_start in book_index[kgram]:
                # Extend forward
                book_end = book_start + k
                gen_end = gen_start + k
                while (book_end < len(book_tokens) and
                       gen_end < len(gen_tokens) and
                       book_tokens[book_end] == gen_tokens[gen_end]):
                    book_end += 1
                    gen_end += 1

                # Extend backward
                while (book_start > 0 and gen_start > 0 and
                       book_tokens[book_start-1] == gen_tokens[gen_start-1]):
                    book_start -= 1
                    gen_start -= 1

                matches.append((book_start, book_end, gen_start, gen_end))

    return matches
```

---

## まとめ

本仕様書に基づき、TypeScript/JavaScriptでアルゴリズムを実装することで、ブラウザ上で動作するテキスト一致度チェッカーを構築できる。核心は**k-gram + Seed-and-Extend**であり、これを正確に実装すれば元のPython実装と同等の結果が得られる。

---

**作成日**: 2026-05-15
**更新日**: 2026-05-15
**参照元**: [Alignment-Whack-a-Mole-Code](https://github.com/rystylee/Alignment-Whack-a-Mole-Code)
