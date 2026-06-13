// npm install lucide-react recharts firebase
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Check,
  X,
  Home,
  ChevronRight,
  RefreshCw,
  BarChart2,
  BookOpen,
  User,
  ArrowRight,
  HelpCircle,
} from "lucide-react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

// ===================================================================
// Firebase設定（APIキー等は環境変数から読み込み。直書きは絶対に厳禁）
// ===================================================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// データ分離用のアプリ識別子（他問題集と混ざらないよう。後から一括書き換え可）
const APP_ID = "QuizApp_3_8_Merchandising_001";
const SOURCE_LABEL = "スマート問題集 3-8";

// Firebase初期化（多重初期化・設定欠如でクラッシュしないよう防衛的に）
let app = null;
let auth = null;
let db = null;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.warn("[Firebase] 初期化に失敗しました。LocalStorageフォールバックで動作します。", e);
}

// ===================================================================
// インラインSVG / テーブル図表コンポーネント群（外部画像URLは一切使用しない）
// ===================================================================

// 共通：ダークテーマ上で見やすい白背景カードにテーブル/SVGを描画
const FigCard = ({ children, title }) => (
  <div className="my-4 overflow-x-auto rounded-xl border border-slate-700 bg-white p-3 shadow-lg">
    {title ? (
      <div className="mb-2 text-center text-sm font-bold text-slate-800">{title}</div>
    ) : null}
    {children}
  </div>
);

// 相関係数テーブル（問題3：問題画面に表示する与条件）
const FigCorrelationTable = () => (
  <FigCard>
    <table className="w-full border-collapse text-sm text-slate-800">
      <thead>
        <tr>
          <th className="border border-slate-300 bg-orange-100 px-3 py-2 text-left">組み合わせ</th>
          <th className="border border-slate-300 bg-orange-100 px-3 py-2 text-center">相関係数</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-slate-300 px-3 py-2">商品Aの売上金額と商品Bの売上金額</td>
          <td className="border border-slate-300 px-3 py-2 text-center font-bold">0.3</td>
        </tr>
        <tr>
          <td className="border border-slate-300 px-3 py-2">商品Bの売上金額と商品Cの売上金額</td>
          <td className="border border-slate-300 px-3 py-2 text-center font-bold">0.5</td>
        </tr>
        <tr>
          <td className="border border-slate-300 px-3 py-2">商品Aの売上金額と商品Dの売上金額</td>
          <td className="border border-slate-300 px-3 py-2 text-center font-bold">-0.6</td>
        </tr>
      </tbody>
    </table>
  </FigCard>
);

// セット販売 価格・値入高テーブル（問題6：問題画面に表示する与条件）
const FigSetTableProblem = () => (
  <FigCard>
    <table className="w-full border-collapse text-sm text-slate-800">
      <thead>
        <tr>
          <th className="border border-slate-300 bg-orange-100 px-3 py-2"></th>
          <th className="border border-slate-300 bg-orange-100 px-3 py-2 text-center">スーツ</th>
          <th className="border border-slate-300 bg-orange-100 px-3 py-2 text-center">Yシャツ</th>
          <th className="border border-slate-300 bg-orange-100 px-3 py-2 text-center">ネクタイ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-slate-300 px-3 py-2 font-bold">販売価格</td>
          <td className="border border-slate-300 px-3 py-2 text-right">45,000 円</td>
          <td className="border border-slate-300 px-3 py-2 text-right">7,000 円</td>
          <td className="border border-slate-300 px-3 py-2 text-right">3,000 円</td>
        </tr>
        <tr>
          <td className="border border-slate-300 px-3 py-2 font-bold">値入高</td>
          <td className="border border-slate-300 px-3 py-2 text-right">10,000 円</td>
          <td className="border border-slate-300 px-3 py-2 text-right">3,000 円</td>
          <td className="border border-slate-300 px-3 py-2 text-right">2,000 円</td>
        </tr>
      </tbody>
    </table>
  </FigCard>
);

// セット販売 原価入りテーブル（問題6：解説画面）
const FigSetTableCost = () => (
  <FigCard>
    <table className="w-full border-collapse text-sm text-slate-800">
      <thead>
        <tr>
          <th className="border border-slate-300 bg-orange-100 px-3 py-2"></th>
          <th className="border border-slate-300 bg-orange-100 px-3 py-2 text-center">スーツ</th>
          <th className="border border-slate-300 bg-orange-100 px-3 py-2 text-center">Yシャツ</th>
          <th className="border border-slate-300 bg-orange-100 px-3 py-2 text-center">ネクタイ</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-slate-300 px-3 py-2 font-bold">販売価格</td>
          <td className="border border-slate-300 px-3 py-2 text-right">45,000 円</td>
          <td className="border border-slate-300 px-3 py-2 text-right">7,000 円</td>
          <td className="border border-slate-300 px-3 py-2 text-right">3,000 円</td>
        </tr>
        <tr>
          <td className="border border-slate-300 px-3 py-2 font-bold">値入高</td>
          <td className="border border-slate-300 px-3 py-2 text-right">10,000 円</td>
          <td className="border border-slate-300 px-3 py-2 text-right">3,000 円</td>
          <td className="border border-slate-300 px-3 py-2 text-right">2,000 円</td>
        </tr>
        <tr>
          <td className="border border-slate-300 bg-slate-100 px-3 py-2 font-bold">原価</td>
          <td className="border border-slate-300 bg-slate-100 px-3 py-2 text-right">35,000 円</td>
          <td className="border border-slate-300 bg-slate-100 px-3 py-2 text-right">4,000 円</td>
          <td className="border border-slate-300 bg-slate-100 px-3 py-2 text-right">1,000 円</td>
        </tr>
      </tbody>
    </table>
  </FigCard>
);

// ボックス図（問題6：解説画面）原価40,000 / 売価50,000 / 値入高10,000 ＝？%
const FigBoxDiagram = () => (
  <FigCard>
    <svg viewBox="0 0 400 320" className="mx-auto h-auto w-full max-w-md">
      <rect x="20" y="20" width="200" height="220" fill="none" stroke="#334155" strokeWidth="1.5" />
      <line x1="20" y1="240" x2="220" y2="240" stroke="#334155" strokeWidth="1.5" />
      <rect x="20" y="240" width="200" height="60" fill="none" stroke="#334155" strokeWidth="1.5" />
      <rect x="220" y="20" width="160" height="280" fill="none" stroke="#334155" strokeWidth="1.5" />
      <text x="120" y="120" textAnchor="middle" fontSize="14" fill="#0f172a">原価</text>
      <text x="120" y="142" textAnchor="middle" fontSize="14" fill="#0f172a">40,000 円</text>
      <text x="120" y="265" textAnchor="middle" fontSize="13" fill="#0f172a">値入高</text>
      <text x="120" y="283" textAnchor="middle" fontSize="13" fill="#0f172a">10,000 円</text>
      <text x="120" y="299" textAnchor="middle" fontSize="13" fill="#b91c1c">？ ％</text>
      <text x="300" y="150" textAnchor="middle" fontSize="14" fill="#0f172a">売価</text>
      <text x="300" y="172" textAnchor="middle" fontSize="14" fill="#0f172a">50,000 円</text>
    </svg>
  </FigCard>
);

// 商品ラインと商品アイテム概念図（問題2：解説画面）
const FigProductMix = () => (
  <FigCard title="商品ラインと商品アイテム（商品ミックス）">
    <svg viewBox="0 0 520 300" className="mx-auto h-auto w-full max-w-xl">
      <defs>
        <marker id="arrowR" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#1e3a8a" />
        </marker>
        <marker id="arrowD" markerWidth="10" markerHeight="10" refX="3" refY="8" orient="auto">
          <path d="M0,0 L6,0 L3,8 Z" fill="#1e3a8a" />
        </marker>
      </defs>
      <line x1="60" y1="40" x2="500" y2="40" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowR)" />
      <line x1="60" y1="40" x2="60" y2="280" stroke="#1e3a8a" strokeWidth="2" markerEnd="url(#arrowD)" />
      <rect x="180" y="22" width="170" height="20" fill="#bfdbfe" />
      <text x="265" y="37" textAnchor="middle" fontSize="13" fill="#0f172a" fontWeight="bold">商品ライン</text>
      <text x="75" y="34" fontSize="11" fill="#475569">狭い</text>
      <text x="470" y="34" fontSize="11" fill="#475569">広い</text>
      <text x="30" y="60" fontSize="11" fill="#475569">浅い</text>
      <text x="30" y="275" fontSize="11" fill="#475569">深い</text>
      <text x="22" y="170" fontSize="13" fill="#0f172a" fontWeight="bold" transform="rotate(-90 22 170)">商品アイテム</text>
      <rect x="80" y="55" width="110" height="22" fill="#eff6ff" stroke="#93c5fd" />
      <text x="135" y="71" textAnchor="middle" fontSize="12" fill="#0f172a">カジュアル用</text>
      <rect x="210" y="55" width="110" height="22" fill="#eff6ff" stroke="#93c5fd" />
      <text x="265" y="71" textAnchor="middle" fontSize="12" fill="#0f172a">ビジネス用</text>
      <rect x="340" y="55" width="110" height="22" fill="#eff6ff" stroke="#93c5fd" />
      <text x="395" y="71" textAnchor="middle" fontSize="12" fill="#0f172a">スポーツ用</text>
      <ellipse cx="135" cy="110" rx="40" ry="16" fill="#94a3b8" />
      <ellipse cx="265" cy="110" rx="40" ry="16" fill="#1f2937" />
      <ellipse cx="395" cy="110" rx="40" ry="16" fill="#a3e635" />
      <ellipse cx="395" cy="170" rx="40" ry="16" fill="#c084fc" />
      <ellipse cx="395" cy="230" rx="40" ry="16" fill="#e2e8f0" stroke="#94a3b8" />
    </svg>
  </FigCard>
);

// プライスライン・プライスポイント棒グラフ（問題5・問題7：解説画面）
const FigPriceBar = () => (
  <FigCard>
    <svg viewBox="0 0 560 320" className="mx-auto h-auto w-full max-w-xl">
      <defs>
        <marker id="pbUp" markerWidth="10" markerHeight="10" refX="3" refY="2" orient="auto">
          <path d="M0,8 L3,0 L6,8 Z" fill="#0f172a" />
        </marker>
        <marker id="pbRight" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#0f172a" />
        </marker>
        <marker id="ppArr" markerWidth="10" markerHeight="10" refX="7" refY="3" orient="auto">
          <path d="M0,0 L8,3 L0,6 Z" fill="#b91c1c" />
        </marker>
        <marker id="plArr" markerWidth="10" markerHeight="10" refX="3" refY="7" orient="auto">
          <path d="M0,0 L6,0 L3,8 Z" fill="#1e40af" />
        </marker>
      </defs>
      <line x1="70" y1="40" x2="70" y2="260" stroke="#0f172a" strokeWidth="2" markerEnd="url(#pbUp)" />
      <line x1="70" y1="260" x2="520" y2="260" stroke="#0f172a" strokeWidth="2" markerEnd="url(#pbRight)" />
      <text x="40" y="120" textAnchor="middle" fontSize="13" fill="#0f172a" fontWeight="bold" transform="rotate(-90 40 120)">販売数量</text>
      <rect x="95" y="140" width="70" height="120" fill="#fdf3d7" stroke="#d4a017" />
      <text x="130" y="200" textAnchor="middle" fontSize="13" fill="#0f172a">30着</text>
      <rect x="195" y="100" width="70" height="160" fill="#f5a623" stroke="#d4a017" />
      <text x="230" y="180" textAnchor="middle" fontSize="13" fill="#0f172a">40着</text>
      <rect x="295" y="180" width="70" height="80" fill="#fdf3d7" stroke="#d4a017" />
      <text x="330" y="225" textAnchor="middle" fontSize="13" fill="#0f172a">20着</text>
      <rect x="395" y="220" width="70" height="40" fill="#fdf3d7" stroke="#d4a017" />
      <text x="430" y="245" textAnchor="middle" fontSize="13" fill="#0f172a">10着</text>
      <rect x="80" y="268" width="400" height="26" rx="13" fill="none" stroke="#1e40af" />
      <text x="130" y="285" textAnchor="middle" fontSize="12" fill="#0f172a">1,000円</text>
      <text x="230" y="285" textAnchor="middle" fontSize="12" fill="#0f172a">2,000円</text>
      <text x="330" y="285" textAnchor="middle" fontSize="12" fill="#0f172a">3,000円</text>
      <text x="430" y="285" textAnchor="middle" fontSize="12" fill="#0f172a">5,000円</text>
      <text x="490" y="285" fontSize="12" fill="#0f172a">価格帯</text>
      <text x="360" y="70" fontSize="13" fill="#b91c1c" fontWeight="bold">プライスポイント</text>
      <line x1="355" y1="80" x2="265" y2="105" stroke="#b91c1c" strokeWidth="1.5" markerEnd="url(#ppArr)" />
      <text x="420" y="150" fontSize="13" fill="#1e40af" fontWeight="bold">プライスライン</text>
      <line x1="455" y1="160" x2="460" y2="265" stroke="#1e40af" strokeWidth="1.5" markerEnd="url(#plArr)" />
    </svg>
  </FigCard>
);

// 陳列の種類テーブル（問題9：解説画面）
const FigChinretsuTypes = () => (
  <FigCard>
    <table className="w-full border-collapse text-xs text-slate-800 md:text-sm">
      <thead>
        <tr>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">陳列の種類</th>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">概要</th>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">効果</th>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">適用商品</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-slate-300 px-2 py-2 font-bold">量感陳列</td>
          <td className="border border-slate-300 px-2 py-2">商品を豊富に並べて、ボリューム感を出す陳列方法</td>
          <td className="border border-slate-300 px-2 py-2">商品の豊富さを出すことで、購買意欲を高める</td>
          <td className="border border-slate-300 px-2 py-2">食料品や日用雑貨などの最寄品</td>
        </tr>
        <tr>
          <td className="border border-slate-300 px-2 py-2 font-bold">展示陳列</td>
          <td className="border border-slate-300 px-2 py-2">テーマを決めて商品を演出する陳列方法</td>
          <td className="border border-slate-300 px-2 py-2">顧客に新鮮な視点の提案を行うことで、購買意欲を高める</td>
          <td className="border border-slate-300 px-2 py-2">重点商品や、洋服などの買回品（例）例えば、季節に合わせた洋服のコーディネートを提案</td>
        </tr>
      </tbody>
    </table>
  </FigCard>
);

// 陳列方法テーブル（問題9：解説画面）
const FigChinretsuMethods = () => (
  <FigCard>
    <table className="w-full border-collapse text-xs text-slate-800 md:text-sm">
      <thead>
        <tr>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">陳列方法</th>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">概要</th>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">効果</th>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">適用商品</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-slate-300 px-2 py-2 font-bold">ゴンドラ陳列</td>
          <td className="border border-slate-300 px-2 py-2">ゴンドラに商品を並べる陳列</td>
          <td className="border border-slate-300 px-2 py-2">通常は、手前の方に商品が積みあがるように陳列する「前進立体陳列」にして、商品の豊富感を出す</td>
          <td className="border border-slate-300 px-2 py-2">スーパーマーケットなどで、定番品の陳列などに用いられる</td>
        </tr>
        <tr>
          <td className="border border-slate-300 px-2 py-2 font-bold">エンド陳列</td>
          <td className="border border-slate-300 px-2 py-2">ゴンドラの端である、ゴンドラエンドでの陳列</td>
          <td className="border border-slate-300 px-2 py-2">・ゴンドラエンドは、目立ちやすいためマグネットポイントとして活用することで、非計画購買の促進が可能 ・エンド陳列を活用し、主通路から副通路に顧客を誘導することが可能</td>
          <td className="border border-slate-300 px-2 py-2">特売品や目玉商品</td>
        </tr>
      </tbody>
    </table>
  </FigCard>
);

// 売場レイアウト図（問題9：解説画面）インラインSVG
const FigStoreLayout = () => (
  <FigCard title="◆陳列方法">
    <svg viewBox="0 0 1000 640" className="mx-auto h-auto w-full">
      <rect x="10" y="10" width="980" height="620" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" rx="8" />
      <rect x="90" y="100" width="800" height="490" fill="none" stroke="#1e3a8a" strokeWidth="2" />
      <circle cx="390" cy="135" r="28" fill="#b91c1c" />
      <text x="130" y="142" fontSize="20" fill="#0f172a">ジャンブル陳列</text>
      <line x1="350" y1="135" x2="360" y2="135" stroke="#0f172a" strokeWidth="2" />
      <rect x="450" y="115" width="170" height="40" fill="#fde047" stroke="#ca8a04" />
      <rect x="640" y="115" width="170" height="40" fill="#fde047" stroke="#ca8a04" />
      <text x="55" y="205" fontSize="18" fill="#1e3a8a">入口</text>
      <text x="55" y="495" fontSize="18" fill="#1e3a8a">出口</text>
      <rect x="830" y="115" width="55" height="160" fill="#dcfce7" stroke="#16a34a" />
      <text x="857" y="195" fontSize="16" fill="#0f172a" textAnchor="middle" transform="rotate(90 857 195)">マグネット</text>
      <rect x="840" y="290" width="45" height="200" fill="#fde047" stroke="#ca8a04" />
      <text x="450" y="215" fontSize="20" fill="#1e3a8a" fontWeight="bold">主通路</text>
      <rect x="150" y="250" width="50" height="160" fill="#fed7aa" stroke="#ea580c" />
      <text x="175" y="330" fontSize="16" fill="#0f172a" textAnchor="middle" transform="rotate(90 175 330)">レジ</text>
      <rect x="205" y="295" width="40" height="180" fill="#b91c1c" />
      <text x="225" y="385" fontSize="14" fill="#ffffff" textAnchor="middle" transform="rotate(90 225 385)">レジ前陳列</text>
      {[300, 565].map((gx, i) => (
        <g key={`g${i}`}>
          <rect x={gx} y="250" width="40" height="70" fill="#fed7aa" stroke="#ea580c" />
          <text x={gx + 20} y="290" fontSize="11" fill="#0f172a" textAnchor="middle">エンド</text>
          <rect x={gx + 40} y="250" width="130" height="35" fill="#fde047" stroke="#ca8a04" />
          <text x={gx + 105} y="272" fontSize="13" fill="#0f172a" textAnchor="middle">ゴンドラ</text>
          <rect x={gx + 40} y="285" width="130" height="35" fill="#fde047" stroke="#ca8a04" />
          <text x={gx + 105} y="307" fontSize="13" fill="#0f172a" textAnchor="middle">ゴンドラ</text>
          <rect x={gx + 170} y="250" width="40" height="70" fill="#fed7aa" stroke="#ea580c" />
          <text x={gx + 190} y="290" fontSize="11" fill="#0f172a" textAnchor="middle">エンド</text>
        </g>
      ))}
      <text x="450" y="370" fontSize="20" fill="#1e3a8a" fontWeight="bold">副通路</text>
      {[300, 565].map((gx, i) => (
        <g key={`h${i}`}>
          <rect x={gx} y="400" width="40" height="70" fill="#fed7aa" stroke="#ea580c" />
          <text x={gx + 20} y="440" fontSize="11" fill="#0f172a" textAnchor="middle">エンド</text>
          <rect x={gx + 40} y="400" width="130" height="35" fill="#fde047" stroke="#ca8a04" />
          <text x={gx + 105} y="422" fontSize="13" fill="#0f172a" textAnchor="middle">ゴンドラ</text>
          <rect x={gx + 40} y="435" width="130" height="35" fill="#fde047" stroke="#ca8a04" />
          <text x={gx + 105} y="457" fontSize="13" fill="#0f172a" textAnchor="middle">ゴンドラ</text>
          <rect x={gx + 170} y="400" width="40" height="70" fill="#fed7aa" stroke="#ea580c" />
          <text x={gx + 190} y="440" fontSize="11" fill="#0f172a" textAnchor="middle">エンド</text>
        </g>
      ))}
      <text x="420" y="510" fontSize="18" fill="#0f172a">島出し陳列</text>
      <rect x="560" y="495" width="55" height="22" fill="#b91c1c" />
      <rect x="120" y="555" width="240" height="35" fill="#fde047" stroke="#ca8a04" />
      <rect x="380" y="555" width="220" height="35" fill="#dbeafe" stroke="#3b82f6" />
      <text x="490" y="578" fontSize="16" fill="#0f172a" textAnchor="middle">ウォークインケース</text>
      <rect x="630" y="555" width="190" height="35" fill="#dcfce7" stroke="#16a34a" />
      <text x="725" y="578" fontSize="16" fill="#0f172a" textAnchor="middle">マグネット</text>
    </svg>
  </FigCard>
);

// ゴールデンゾーン図（問題11：解説画面）数値条件を漏れなくマッピング
const FigGoldenZone = () => (
  <FigCard title="◆陳列範囲">
    <svg viewBox="0 0 600 420" className="mx-auto h-auto w-full max-w-2xl">
      <defs>
        <marker id="gzUp" markerWidth="10" markerHeight="10" refX="3" refY="6" orient="auto"><path d="M0,8 L3,0 L6,8 Z" fill="#1e3a8a" /></marker>
        <marker id="gzDn" markerWidth="10" markerHeight="10" refX="3" refY="2" orient="auto"><path d="M0,0 L6,0 L3,8 Z" fill="#1e3a8a" /></marker>
        <marker id="gzUpR" markerWidth="10" markerHeight="10" refX="3" refY="6" orient="auto"><path d="M0,8 L3,0 L6,8 Z" fill="#b91c1c" /></marker>
        <marker id="gzDnR" markerWidth="10" markerHeight="10" refX="3" refY="2" orient="auto"><path d="M0,0 L6,0 L3,8 Z" fill="#b91c1c" /></marker>
      </defs>
      <rect x="10" y="10" width="580" height="400" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3" rx="8" />
      <rect x="360" y="60" width="60" height="330" fill="#0f172a" />
      <rect x="360" y="135" width="60" height="155" fill="#dbeafe" />
      <line x1="230" y1="60" x2="450" y2="60" stroke="#0f172a" strokeWidth="1.5" />
      <line x1="290" y1="135" x2="450" y2="135" stroke="#0f172a" strokeWidth="1.5" />
      <line x1="290" y1="290" x2="450" y2="290" stroke="#0f172a" strokeWidth="1.5" />
      <line x1="230" y1="330" x2="450" y2="330" stroke="#0f172a" strokeWidth="1.5" />
      <text x="455" y="65" fontSize="16" fill="#0f172a">210</text>
      <text x="455" y="140" fontSize="16" fill="#0f172a">130〜140</text>
      <text x="455" y="295" fontSize="16" fill="#0f172a">70〜80</text>
      <text x="455" y="335" fontSize="16" fill="#0f172a">60</text>
      <line x1="230" y1="60" x2="230" y2="330" stroke="#1e3a8a" strokeWidth="1.5" markerStart="url(#gzUp)" markerEnd="url(#gzDn)" />
      <text x="215" y="200" fontSize="15" fill="#1e3a8a" fontWeight="bold" textAnchor="middle" transform="rotate(-90 215 200)">有効陳列範囲</text>
      <line x1="290" y1="135" x2="290" y2="290" stroke="#b91c1c" strokeWidth="1.5" markerStart="url(#gzUpR)" markerEnd="url(#gzDnR)" />
      <text x="275" y="210" fontSize="15" fill="#b91c1c" fontWeight="bold" textAnchor="middle" transform="rotate(-90 275 210)">ゴールデンゾーン</text>
      <line x1="40" y1="390" x2="560" y2="390" stroke="#0f172a" strokeWidth="2" />
      <circle cx="110" cy="150" r="22" fill="#b08080" />
      <rect x="92" y="172" width="36" height="120" rx="14" fill="#b08080" />
      <rect x="96" y="285" width="12" height="100" fill="#b08080" />
      <rect x="112" y="285" width="12" height="100" fill="#b08080" />
    </svg>
  </FigCard>
);

// 陳列の方向図（問題11：解説画面）バーチカル/ホリゾンタル
const FigChinretsuDirection = () => (
  <FigCard title="◆陳列の方向">
    <svg viewBox="0 0 660 360" className="mx-auto h-auto w-full max-w-2xl">
      <rect x="10" y="10" width="640" height="340" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" rx="8" />
      <text x="170" y="45" fontSize="15" fill="#0f172a" textAnchor="middle">縦割り陳列（バーチカル陳列）</text>
      <text x="490" y="45" fontSize="15" fill="#0f172a" textAnchor="middle">横割り陳列（ホリゾンタル陳列）</text>
      {[0, 1, 2, 3, 4, 5].map((r) => (
        <g key={`v${r}`}>
          <line x1="40" y1={90 + r * 38} x2="300" y2={90 + r * 38} stroke="#fbbf24" strokeWidth="4" />
          {[0, 1, 2].map((c) => (
            <rect key={c} x={50 + c * 85} y={70 + r * 38} width="55" height="18"
              fill={`rgb(${200 - r * 30},${220 - r * 30},${255 - r * 25})`} stroke="#64748b" />
          ))}
        </g>
      ))}
      <rect x="44" y="62" width="70" height="240" fill="none" stroke="#dc2626" strokeWidth="3" />
      {[0, 1, 2, 3, 4, 5].map((r) => (
        <g key={`hz${r}`}>
          <line x1="360" y1={90 + r * 38} x2="620" y2={90 + r * 38} stroke="#fbbf24" strokeWidth="4" />
          {[0, 1, 2, 3, 4].map((c) => (
            <rect key={c} x={370 + c * 50} y={70 + r * 38} width="38" height="18"
              fill={`rgb(${210 - c * 35},${225 - c * 30},${255 - c * 20})`} stroke="#64748b" />
          ))}
        </g>
      ))}
      <rect x="364" y="62" width="252" height="64" fill="none" stroke="#dc2626" strokeWidth="3" />
    </svg>
  </FigCard>
);

// 客単価の構成要素テーブル（問題15：解説画面）
const FigKyakutankaTable = () => (
  <FigCard>
    <table className="w-full border-collapse text-xs text-slate-800 md:text-sm">
      <thead>
        <tr>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">構成要素</th>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">概要</th>
          <th className="border border-slate-300 bg-orange-100 px-2 py-2">各要素の値を上げる方法</th>
        </tr>
      </thead>
      <tbody>
        {[
          ["動線長", "客動線の長さのこと", "ゾーニングやレイアウトを工夫したり、マグネットポイントを設ける等"],
          ["立寄率", "それぞれの売場に立ち寄る率のこと", "ディスプレイや陳列を工夫する等"],
          ["視認率", "それぞれの商品を見てもらう率のこと", "陳列の工夫やPOPによって商品を見やすくし、商品の情報をわかりやすく伝達する等"],
          ["買上率", "商品を買ってもらう率のこと", "価格設定を工夫したり、POPでおすすめをしたり、デモ販売を行う等"],
          ["買上個数", "まとめて多くの商品を買ってもらうこと", "関連陳列を工夫したり、メニュー提案をしたり、セット販売にする等"],
          ["商品単価", "より高い商品を買ってもらうこと", "加工度を上げてより高い付加価値を提供する等。例）食品であれば、素材を加工して惣菜にする"],
        ].map((row, i) => (
          <tr key={i}>
            <td className="border border-slate-300 px-2 py-2 text-center font-bold">{row[0]}</td>
            <td className="border border-slate-300 px-2 py-2">{row[1]}</td>
            <td className="border border-slate-300 px-2 py-2">{row[2]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </FigCard>
);

// ISP・スペースマネジメント体系図（問題16：解説画面）構造樹状図SVG
const FigISPTree = () => {
  const Node = ({ x, y, w, h, fill, lines }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke="#64748b" strokeWidth="1.5" rx="4" />
      {lines.map((t, i) => (
        <text key={i} x={x + w / 2} y={y + 20 + i * 16} textAnchor="middle" fontSize="12" fill="#0f172a" fontWeight="bold">{t}</text>
      ))}
    </g>
  );
  return (
    <FigCard>
      <svg viewBox="0 0 740 560" className="mx-auto h-auto w-full">
        <polyline points="120,290 180,290 180,170 230,170" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        <polyline points="120,290 180,290 180,440 230,440" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        <polyline points="340,170 380,170 380,90 430,90" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        <polyline points="340,170 380,170 380,300 430,300" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        <polyline points="340,440 380,440 380,500 430,500" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        <polyline points="340,440 380,440 380,400 430,400" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="540" y1="92" x2="595" y2="56" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="540" y1="92" x2="595" y2="116" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="540" y1="92" x2="595" y2="176" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="540" y1="302" x2="595" y2="250" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="540" y1="302" x2="595" y2="320" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="540" y1="302" x2="595" y2="390" stroke="#94a3b8" strokeWidth="1.5" />
        <Node x={10} y={265} w={110} h={55} fill="#fed7aa" lines={["インストア", "マーチャン", "ダイジング"]} />
        <Node x={230} y={140} w={110} h={60} fill="#fef9c3" lines={["インストア", "プロモーション", "（ISP）"]} />
        <Node x={230} y={415} w={110} h={50} fill="#cffafe" lines={["スペース", "マネジメント"]} />
        <Node x={430} y={70} w={110} h={45} fill="#fef08a" lines={["価格主導型", "の活動"]} />
        <Node x={430} y={280} w={110} h={45} fill="#fef08a" lines={["非価格主導型", "の活動"]} />
        <Node x={430} y={385} w={110} h={45} fill="#cffafe" lines={["スペース", "アロケーション"]} />
        <Node x={430} y={485} w={110} h={40} fill="#cffafe" lines={["プラノグラム"]} />
        <text x="600" y="40" fontSize="12" fill="#0f172a">例）</text>
        <Node x={595} y={45} w={130} h={28} fill="#ffffff" lines={["特売や値引き"]} />
        <Node x={595} y={102} w={130} h={28} fill="#ffffff" lines={["ポイントカード"]} />
        <Node x={595} y={162} w={130} h={28} fill="#ffffff" lines={["クーポン"]} />
        <text x="600" y="232" fontSize="12" fill="#0f172a">例）</text>
        <Node x={595} y={236} w={130} h={28} fill="#ffffff" lines={["デモ販売"]} />
        <Node x={595} y={306} w={130} h={28} fill="#ffffff" lines={["サンプリング"]} />
        <Node x={595} y={368} w={130} h={44} fill="#ffffff" lines={["クロスマーチャン", "ダイジング"]} />
      </svg>
    </FigCard>
  );
};

// 数式表示用の分数コンポーネント
const Frac = ({ num, den }) => (
  <span className="mx-1 inline-flex flex-col items-center align-middle">
    <span className="border-b border-slate-700 px-2 text-center leading-tight">{num}</span>
    <span className="px-2 text-center leading-tight">{den}</span>
  </span>
);

// 交差比率の公式（問題20：解説画面）①〜④
const FigKousahiritsuFormula = () => (
  <div className="my-4 space-y-3 rounded-xl border border-slate-700 bg-white p-4 text-sm text-slate-800">
    <div className="flex flex-wrap items-center">
      <span className="font-bold">交差比率 ＝</span>
      <Frac num="粗利益" den="平均在庫高（売価）" />
      <span className="ml-2 text-slate-500">①</span>
    </div>
    <div className="flex flex-wrap items-center">
      <span className="font-bold">交差比率 ＝</span>
      <Frac num="粗利益" den="売上高" />
      <span className="mx-1">×</span>
      <Frac num="売上高" den="平均在庫高（売価）" />
    </div>
    <div className="flex flex-wrap items-center pl-20">
      <span>＝ 粗利益率 × 商品回転率（売価）</span>
      <span className="ml-2 text-slate-500">②</span>
    </div>
    <div className="flex flex-wrap items-center">
      <span className="font-bold">商品回転率（売価）＝</span>
      <Frac num="売上" den="平均在庫高（売価）" />
      <span className="ml-2 text-slate-500">③</span>
    </div>
    <div className="flex flex-wrap items-center">
      <span className="font-bold">商品回転率（原価）＝</span>
      <Frac num="売上原価" den="平均在庫高（原価）" />
      <span className="ml-2 text-slate-500">④</span>
    </div>
  </div>
);

// 在庫高予算の公式（問題21：解説画面）基準在庫法・百分率変異法
const FigBudgetFormula = () => (
  <div className="my-4 space-y-4 rounded-xl border border-slate-700 bg-white p-4 text-sm text-slate-800">
    <div className="font-bold text-slate-600">①基準在庫法（商品回転率が6回以下の商品向き）</div>
    <div className="flex flex-wrap items-center">
      <span>月初在庫高予算 ＝ 当月売上高予算 ＋ 安全在庫</span>
    </div>
    <div className="flex flex-wrap items-center">
      <span>月初在庫高予算 ＝ 当月売上高予算 ＋</span>
      <Frac num="年間売上高予算" den="年間予定商品回転率" />
      <span className="mx-1">−</span>
      <Frac num="年間売上高予算" den="12" />
    </div>
    <div className="font-bold text-slate-600">②百分率変異法（商品回転率が6回以上の商品向き）</div>
    <div className="flex flex-wrap items-center">
      <span>月初在庫高予算 ＝ 年間平均在庫高 ×</span>
      <Frac num="1" den="2" />
      <span>（1 ＋</span>
      <Frac num="当月売上高予算" den="月平均売上高" />
      <span>）</span>
    </div>
    <div className="flex flex-wrap items-center pl-24">
      <span>＝</span>
      <Frac num="年間売上高予算" den="年間予定商品回転率" />
      <span className="mx-1">×</span>
      <Frac num="1" den="2" />
      <span>（1 ＋</span>
      <Frac num="当月売上高予算" den="月平均売上高" />
      <span>）</span>
    </div>
  </div>
);

// 図表キー → コンポーネントのマップ
const FIGURES = {
  correlationTable: FigCorrelationTable,
  setTableProblem: FigSetTableProblem,
  setTableCost: FigSetTableCost,
  boxDiagram: FigBoxDiagram,
  productMix: FigProductMix,
  priceBar: FigPriceBar,
  chinretsuTypes: FigChinretsuTypes,
  chinretsuMethods: FigChinretsuMethods,
  storeLayout: FigStoreLayout,
  goldenZone: FigGoldenZone,
  chinretsuDirection: FigChinretsuDirection,
  kyakutankaTable: FigKyakutankaTable,
  ispTree: FigISPTree,
  kousahiritsuFormula: FigKousahiritsuFormula,
  budgetFormula: FigBudgetFormula,
};

// ===================================================================
// 問題データ（全22問・ノンカット収録）
//   category: "policy"（商品・売場政策 Q1-17） / "calc"（小売計数管理 Q18-22）
//   problemFig: 問題画面に表示する与条件図（解答情報を含まないニュートラルな図のみ）
//   figs: 解説画面でのみ表示する解説図
// ===================================================================
const QUESTIONS = [
  {
    id: 1,
    title: "マーチャンダイジング",
    category: "policy",
    question:
      "　マーチャンダイジングについて、文中の空欄A～Dに入る用語の組合せとして、最も適切なものを下記の解答群より選べ。\n　マーチャンダイジングは、「5つの適正」を実現していく活動とも呼ばれる。5つの適正とは、適正な商品またはサービスを、適正なＡで、適正な時期に、適正な数量を、適正なＢで販売するように計画し、実行していく活動である。また、5つの適正の実現にあたっては、Ｃ、仕入、価格設定、陳列、Ｄなどの活動を最適化する必要がある。\n\n〔解答群〕",
    choices: [
      "Ａ：方法　Ｂ：価格　Ｃ：品揃え　Ｄ：販売促進",
      "Ａ：方法　Ｂ：品質　Ｃ：顧客設定　Ｄ：宣伝活動",
      "Ａ：場所　Ｂ：価格　Ｃ：品揃え　Ｄ：販売促進",
      "Ａ：場所　Ｂ：品質　Ｃ：顧客設定　Ｄ：宣伝活動",
    ],
    answer: 2,
    kokoga:
      "　本問ではマーチャンダイジングの定義（5つの適正）や、活動の構成要素が問われています。\n　マーチャンダイジングとは、簡単にいえば、ターゲット顧客に、何を、いくらで、どのように提供するかを計画し、実行、管理していく活動です。マーチャンダイジングの定義や、活動の構成内容は次のようになります。\n●マーチャンダイジングの定義（5つの適正）\n　AMA（アメリカ・マーケティング協会）では、マーチャンダイジングの定義を「適正な商品またはサービスを、適正な場所で、適正な時期に、適正な数量を、適正な価格で、マーケティングすることに関する諸計画である」としています。これは、一般に5つの適正と呼ばれています。\n●マーチャンダイジングの構成要素\n　一般的にはマーチャンダイジングは、品揃えを中心とした活動との捉え方もありますが、5つの適正を実現していくためには、品揃え、仕入、価格設定、陳列、販売促進などの活動を最適化する必要があります。\n　各活動の詳細は、以降の問題で取り扱いますので、ここではマーチャンダイジングの定義と、活動の構成内容を押さえておきましょう。",
    kaisetsu:
      "Ａ：場所　Ｂ：価格\n　AMA（アメリカ・マーケティング協会）によるマーチャンダイジングの定義では、「商品またはサービス」「場所」「時期」「数量」「価格」の5つの適正に関する諸計画（活動）としています。よってここでは、それぞれ、「場所」「価格」を選択するのが適切です。\n\nＣ：品揃え\n　マーチャンダイジングは、充実した品揃えを実現し、販売するまでを中心とした活動です。顧客設定は含まれません。よってここでは、「品揃え」を選択するのが適切です。\n\nＤ：販売促進\n　販売促進には、広告、パブリシティ、セールスプロモーション、人的販売の活動が含まれます。宣伝活動も販売促進の一つではありますが、ここではより広い活動として「販売促進」を選択するのが適切です。\n以上より、Ａ：場所、Ｂ：価格、Ｃ：品揃え、Ｄ：販売促進となり、選択肢ウが正解です。",
    figs: [],
  },
  {
    id: 2,
    title: "品揃え",
    category: "policy",
    question: "　品揃えに関する記述として、最も不適切なものはどれか。",
    choices: [
      "経営資源の少ない中小小売店では、限定ライン戦略を取り、大型店との差別化を図るのが望ましい。",
      "商品アイテムを深くしすぎると、ストアコンセプトが不明確になりやすいので注意が必要である。",
      "百貨店などに代表される大型店では、フルライン戦略をとり、さまざまな品種を取り扱うことが多い。",
      "商品ミックスとは、扱う品種とアイテムをどのように揃えるかということである。",
    ],
    answer: 1,
    kokoga:
      "本問では品揃えについて問われています。\n\n●商品ミックス\n・商品ミックス：商品ラインと商品アイテムをどのように組み合わせて、品揃えするかということ。\n・商品ライン：同じカテゴリーや共通の特徴を持つ、一連の商品群（例：カジュアル用、ビジネス用、スポーツ用の靴など）\n・商品アイテム：商品ラインの中で、具体的な個々の商品のこと（例：スポーツ用の靴の中で、男性用、女性用、ウォーキング用、マラソン用など)\n\n●限定ライン戦略\n商品ラインの幅を狭く絞り込み、商品アイテムを深くし、特定の品種の品揃えを豊富にする戦略。　例）ダイハツ自動車：軽自動車に特化\n\n●フルライン戦略\n商品ラインの幅を広くする戦略。　例）トヨタ自動車：小型車～高級セダンまで幅広くラインアップ。\nラインの幅とアイテムの深さは、混乱しやすいので注意しましょう。",
    kaisetsu:
      "ア　○：\n　限定ライン戦略とは、商品ラインの幅を狭く絞り込み、特定の品種の品揃えを豊富にする戦略です。例えば、酒屋ならワインのみを専門に取り扱うようなイメージです。経営資源の限られている中小小売店が大型店に対抗していくためには、品揃えを特化して特色を打ち出すことが望ましいと言えます。よって記述は適切です。\n\nイ　×：\n　商品アイテムを深くすることで、専門性が増しストアコンセプトがより明確になります。ストアコンセプトが不明確になるのは、「商品ラインの幅」を広げた場合です。よって記述は不適切です。\n\nウ　○：\n　フルライン戦略とは、商品ラインが広く、商品アイテムも深く、品揃えをする戦略です。百貨店に代表される大型店は、経営資源も売場面積も豊富なことから、一般的にこの戦略をとります。これによって顧客の様々な買い物のニーズに対応でき、ワンストップショッピングの利便性を提供できます。よって記述は適切です。\n\nエ　○：\n　商品ミックスとは、商品ライン（扱う品種）と商品アイテム（扱う品目）をどのように揃えるかということです。よって記述は適切です。",
    figs: ["productMix"],
  },
  {
    id: 3,
    title: "データの相関関係",
    category: "policy",
    question:
      "商品A～Dの１年間における日別の売上金額について、２商品間の売上金額の相関係数を計算したところ、下表のようになった。これらの結果の解釈および相関係数の一般的な知識に関する記述として、最も適切なものを下記の解答群から選べ。",
    problemFig: "correlationTable",
    choices: [
      "相関係数は、－100から100までの範囲の値として計算される。",
      "相関係数がマイナスの場合は、相関が弱いと判断される。",
      "売上金額の相関関係の強さを見ると、商品Bは商品Aとの相関よりも、商品Cとの相関の方が強いと言える。",
      "商品Aと商品Dの相関関係をみると、どちらか一方の売上金額が増えても、もう一方の売上金額は影響を受けないと言える。",
    ],
    answer: 2,
    kokoga:
      "本問では相関係数についての知識を問われています。財務・会計の知識で回答できる問題ですが、運営管理での出題にも慣れておきましょう。\n相関係数とは、２つのデータの関係を示す指標です。－１～１までの値を採ります。相関係数が正の値であれば、２つのデータは同じ方向へ動く傾向をもつことを示し、負の値であると反対の方向に動く傾向をもつことを示します。\n相関関係の絶対値が大きいほど、動きの関係性は強くなります。相関係数が０のときには関係性がないことになります。一方のデータが不変で他方が変動するようなときに典型的に０となります。\nXとYの相関係数＝XとYの共分散／（Xの標準偏差×Yの標準偏差）となります。\n相関係数が－１～１までの値であること、および上記の式から、XとYの相関係数とYとZの相関係数を足し合わせてもXとZにならないことは直感的にわかります。（例えば0.6の相関係数と0.7の相関係数を足すと1.3となり1を超えてしまいます。また、分母が異なるため、足し算ができないこともわかります）",
    kaisetsu:
      "ア　×：　\n相関係数は－1～1の数値をとります。従って－100～100という記述は不適切です。\n\nイ　×：　\n相関係数がマイナスの場合は、相関が弱いのではなく、負の相関があることを示します。よって、不適切な記述です。ちなみに、相関の強さは相関係数の値がゼロに近づくほど弱いことを表し、１に近づくほど強いことを表します。\n\nウ　〇：　\n商品Bと商品Aの相関係数は0.3で、商品Bと商品Cの相関係数は0.5です。値（絶対値）が大きいほど相関が強いことを示しますので、適切な記述です。\n\nエ　×：　\n商品の売上金額に関連性がない場合、理論的には相関係数はゼロになります。商品Aと商品Dは負の相関係数ですので、商品Aの売上が増えると、商品Dの売上が減るといった関係にあります。従って、記述は不適切です。",
    figs: [],
  },
  {
    id: 4,
    title: "仕入",
    category: "policy",
    question: "　仕入の形態に関する記述として、最も適切なものはどれか。",
    choices: [
      "消化仕入れにおいては、売れ残り商品を返品することができるため、返品処理の会計システムが必要になる。",
      "消化仕入れにおいては、商品の入荷時点で仕入計上を行うと共に、必要に応じて買掛金の会計処理を行う。",
      "委託仕入れにおいては、売り手などから商品を仕入れた時点で、その商品の所有権は小売店側が持つことになる。",
      "消化仕入においては、在庫の資金負担や盗難リスクは、メーカーなどの納入業者が持つことになる。",
    ],
    answer: 3,
    kokoga:
      "　本問では仕入の形態について問われています。\n　仕入れの形態には次のようなものがあります。\n●買取仕入\n・概要：小売業が商品を買い取って仕入れる方法。\n・売れ残り商品のリスク負担：小売店。\n・適用：量販店など。\n●委託仕入れ\n・概要：メーカーなどの委託者が在庫の所有権を持ったまま、小売業が販売を行う方法。\n・売れ残り商品のリスク負担：委託者のメーカーや、個人の依頼者など。\n・適用：専門店における、ブランド中古品の委託販売など。\n・収入源：販売手数料を委託者から受取る。\n●消化仕入（売上仕入）\n・概要：店頭に商品を置き、売れた分を同時に仕入として計上する方法。\n・売れ残り商品のリスク負担：メーカーなどの納入業者。\n・適用：販売力を持った百貨店などの小売業。\n　消化仕入については過去に何度か出題されています。消化仕入では、販売と同時に、売上と仕入の処理を行う点がポイントになりますので、この点はしっかりと押さえておきましょう。",
    kaisetsu:
      "ア　×：\n　消化仕入においては、売れ残り商品をメーカーなどに返品することができます。しかし、消化仕入では財産の所有権はメーカー側にあるので、小売店側の資産としての返品処理は必要なく、複雑な会計処理は発生しません。このため、返品処理の会計システムは必要ありません。よって記述は不適切です。\n\nイ　×：\n　消化仕入においては、販売と同時に仕入計上を行います。また、このため入荷時点で買掛金が発生することはありません。よって記述は不適切です。\n\nウ　×：\n　委託仕入においては、メーカーなどの委託者が在庫の所有権を持ったまま、小売店が販売を行います。よって記述は不適切です。\n\nエ　○：\n　消化仕入れにおいては、販売と同時に仕入計上が行われますから、消費者が商品を購入するまでの間は、メーカーなどの納入業者側に商品の所有権があります。このため、在庫の資金負担や盗難などのリスク負担も納入業者側が持つことになります。よって記述は適切です。",
    figs: [],
  },
  {
    id: 5,
    title: "価格決定 1",
    category: "policy",
    question: "　小売業の価格決定に関する記述として、最も不適切なものはどれか。",
    choices: [
      "ある紳士服店のネクタイの売価（カッコ内は販売数）が、2,000円（35本）、5,000円（20本）、8,000円（8本）、10,000円（4本）であった場合、プライスポイントは5,000円である。",
      "EDLP政策を採用した場合は、オペレーションコストをいかに下げ、高回転で商品を販売できるかが、小売店の利益を大きく左右する。",
      "毎週特定の曜日に特売品を用意して低価格で販売することで集客し、特売以外の商品も購入してもらうことを意図した政策は、ロスリーダー政策にあたる。",
      "ある靴店で、5,000円で仕入れたジョギングシューズの、値入額を1,000円に設定した。この時のジョギングシューズの販売価格は6,000円である。",
    ],
    answer: 0,
    kokoga:
      "　本問では価格設定に関するキーワードの内容が問われています。\n　価格設定に関しては、次のようなキーワードがあります。\n●値入(マークアップ)\n　商品の販売価格を決定すること。つまり、商品の仕入価格に、どれだけ上乗せして販売価格にするかを決定すること。\n●値入率\n　仕入れ価格に上乗せする割合のこと。\n●ロスリーダー政策\n　目玉商品（ロスリーダー）の値入率を下げて安く販売し、その商品目当てに来店した顧客に、他の値入率の高い商品も購入してもらうことで、利益を確保する政策。\n●エブリデーロープライス政策（EDLP政策）\n　全体的に値入率を下げ、常に低価格で販売する政策\n●プライスライン\n　段階的な価格帯のこと。（例：Yシャツ　2,000円 , 3,000円 , 5,000円均一などの価格帯で設定）\n●プライスポイント\n　プライスラインの中で最も売れる価格帯のこと。\n　プライスラインとプライスポイントは混同しないように注意しましょう。",
    kaisetsu:
      "ア　×：\n　プライスポイントとは、プライスラインの中で最も売れる価格帯のことです。選択肢の例では、2,000円となります。よって記述は不適切です。\n\nイ　○：\n　EDLP政策（エブリデーロープライス政策）を採用する小売店では、全体的に商品の値入率（利益率）を下げ安価で販売します。一方で、オペレーションなどのコストを徹底的に削減し、かつ大量に販売することで利益を確保することを目指しています。よって記述は適切です。\n\nウ　○：\n　ロスリーダー政策では、目玉商品（ロスリーダー）の値入率を下げて、特売品として安く販売することで集客します。そして、その商品目当てに来店した顧客に、他の値入率の高い商品も購入してもらうことで、利益を確保します。よって記述は適切です。\n\nエ　○：\n　「販売価格 ＝ 仕入価格 ＋ 値入額 」となるので、選択肢の例では、販売価格は6,000円となります。よって記述は適切です。",
    figs: ["priceBar"],
  },
  {
    id: 6,
    title: "価格決定 2",
    category: "policy",
    question:
      "　ある紳士服店で、単品で商品を販売した場合の価格と値入高が次のようになっている。今、スーツ・Ｙシャツ・ネクタイの3点をセット販売したときの売価を50,000円で設定した。この場合の売価値入率として、最も適切なものを下記の解答群から選べ。\n\n〔解答群〕",
    problemFig: "setTableProblem",
    choices: ["10%", "15%", "20%", "25%", "30%"],
    answer: 2,
    kokoga:
      "　本問では売価と値入高から値入率を算出することが求められています。\n　値入率とは、仕入れ価格に上乗せする割合のことで、売価基準と原価基準の2つの表示方法があります。それぞれ次のように求めます。\n●売価基準の値入率\n売価値入率 ＝ 値入額 ÷ 売価\n例）100円で仕入れた商品を、125円で販売した場合は、25÷125で20％となる。\n●原価基準の値入率\n原価値入率 ＝ 値入額 ÷ 原価\n例）100円で仕入れた商品を、125円で販売した場合は、25÷100で25％となる。\n　値入率には売価基準と原価基準の2つがあります。分母の値が変わりますので、間違えないように注意しましょう。",
    kaisetsu:
      "正解：ウ　20％\n　それぞれの商品の原価を求めると次のようになり、その合計は40,000円となります。\n　セット販売の価格は、50,000円ですから、値入額は10,000円(＝ 50,000円 －40,000円）となり、上式にあてはめると20%（＝ 10,000円 ÷ 50,000円）となります。\n　なお、次のようにボックス図を利用して求めても良いでしょう。",
    figs: ["setTableCost", "boxDiagram"],
  },
  {
    id: 7,
    title: "価格決定 3",
    category: "policy",
    question:
      "　ある店舗のTシャツの売価は、1000円、2000円、3000円、5000円であり、それぞれの販売数量が、30点、40点、20点、10点であった。プライスラインとプライスポイントの組み合わせとして、最も適切なものを下記の解答群から選べ。\na　1000円、2000円、3000円、5000円\nb　4つ\nc　1000円\nd　2000円\ne　5000円\n\n〔解答群〕",
    choices: [
      "プライスライン：ａ、プライスポイント：ｃ",
      "プライスライン：ａ、プライスポイント：ｄ",
      "プライスライン：ｂ、プライスポイント：ｅ",
      "プライスライン：ｃ、プライスポイント：ｄ",
      "プライスライン：ｅ、プライスポイント：ｄ",
    ],
    answer: 1,
    kokoga:
      "　本問では、プライスラインとプライスポイントについて問われています。\n　プライスラインとは、企業経営理論で学んだように、段階的な価格帯の事を指します。たとえば、スーツやメガネなどでプライスラインを設定しているケースが見られます。\n　プライスポイントとは、プライスラインの中で最も売れる価格帯の事を指します。プライスポイントは「値ごろ」とも呼ばれます。\n　たとえば、Tシャツについて、1000円、2000円、3000円、5000円というプライスラインがあり、それぞれの販売数量が、30点、40点、20点、10点だった場合、プライスポイントは最もよく売れている価格帯である「2000円」となります。\n　プライスラインが1000円、2000円、3000円、5000円といった価格帯を指すこと、プライスポイントが最も売れる価格帯を指すことは押さえておきましょう。",
    kaisetsu:
      "正解：プライスライン：ａ、プライスポイント：ｄ\n\nａ　プライスライン：　Tシャツの売価である「1000円、2000円、3000円、5000円」は、段階的な価格帯といえます。よって、プライスラインです。\n\nｂ　いずれにも該当しない：　「4つ」プライスラインを形成する価格帯の数を表しています。よって、プライスラインにもプライスポイントにも該当しません。\n\nｃ　いずれにも該当しない：　「1000円」はプライスラインのうち最低価格帯を指していますが、最も売れる価格帯ではありません。よって、プライスラインにもプライスポイントにも該当しません。\n\nｄ　プライスポイント：　「2000円」はプライスラインのうち最も売れる価格帯です。よって、プライスポイントです。\n\nｅ　いずれにも該当しない：　「5000円」はプライスラインのうち最高価格帯を指していますが、最も売れる価格帯ではありません。よって、プライスラインにもプライスポイントにも該当しません。\n\n　よって正解はイです。",
    figs: ["priceBar"],
  },
  {
    id: 8,
    title: "陳列の原則",
    category: "policy",
    question:
      "　商品陳列の原則の説明として、最も適切なものの組合せを下記の解答群から選べ。\n<商品陳列の原則>\n　①:探しやすい陳列\n　②:見やすい陳列\n　③:選びやすい陳列\n　④:手に取りやすい陳列\n<陳列についての説明>\n　ａ:顧客が商品を触っても、崩れないように安定して配置すること。\n　ｂ:商品が顧客の目につきやすいように、陳列の高さや陳列の量などを工夫すること。\n　ｃ:顧客の立場から、どこに何があるかがすぐに分かるように工夫すること。\n　ｄ:顧客が一目で似たような商品を比較できるよう、同じ用途の商品をまとめること。\n〔解答群〕",
    choices: [
      "①とｂ　②とc",
      "①とｃ　④とａ",
      "②とｂ　③とｃ",
      "③とｄ　④とｂ",
      "④とａ　②とｃ",
    ],
    answer: 1,
    kokoga:
      "　本問では、商品の陳列の原則について問われています。\n　商品の陳列の原則としては、「探しやすいこと」「見やすいこと」「選びやすいこと」「手に取りやすいこと」の4つがあり、具体的には次のような内容になります。\n●探しやすい陳列\n　顧客の立場から探しやすいということ。そのために、商品のグルーピングやレイアウト、POPなどによって、どこに何があるかがすぐに分かるように工夫する。\n●見やすい陳列\n　商品が顧客の目につきやすいように、陳列の高さや陳列の量などを工夫すること。\n●選びやすい陳列\n　顧客が一目で似たような商品を比較できるように、同じ用途の商品をまとめて陳列すること。\n●手に取りやすい陳列\n　顧客が商品を手に取りやすい位置に配置したり、触っても崩れないように安定した陳列にすること。\n　実際のスーパーでは、陳列について、さまざまな工夫をしています。買い物に出かけた時に、上記のキーワードを思い浮かべながら観察してみると、より理解が深まるでしょう。",
    kaisetsu:
      "正解：イ　①とｃ、④とａ\n　商品の陳列の原則と、各原則の説明として、正しい組合せは次のようになります。\n①:探しやすい陳列 － ｃ:顧客の立場から、どこに何があるかがすぐに分かるように工夫すること。\n②:見やすい陳列 － ｂ:商品が顧客の目につきやすいように、陳列の高さや陳列の量などを工夫すること。\n③:選びやすい陳列 － ｄ:顧客が一目で似たような商品を比較できるように、同じ用途の商品をまとめること。\n④:手に取りやすい陳列 － ａ:顧客が商品を触っても、崩れないように安定して配置すること。",
    figs: [],
  },
  {
    id: 9,
    title: "陳列の種類と方法",
    category: "policy",
    question: "　陳列の種類と方法に関する記述として、最も不適切なものはどれか。",
    choices: [
      "展示陳列は、テーマを設定して小物などと商品を一緒に陳列することで、商品を演出する方法で、洋服のコーディネートの提案などに向いている。",
      "ゴンドラ陳列で用いられる前進立体陳列とは、一番手前に商品を積み重ねて陳列し、陳列しきれなくなったら、後ろ側に補充用の商品として置く陳列方法である。",
      "エンド陳列とは、ゴンドラエンドで行う陳列で、マグネットポイントとして利用することで、副通路への誘導が可能である。",
      "量感陳列は、商品の豊富さを顧客にアピールすることで購買意欲を高める効果があり、買回品の陳列によく用いられる。",
    ],
    answer: 3,
    kokoga:
      "　本問では、陳列の種類と方法について問われています。\n　陳列の種類や方法については、次のようなものがあります。\n●陳列の種類\n\n●陳列方法\n\n●陳列例\n\n　陳列の種類や方法については過去に多く出題されています。各陳列方法にどんな効果があり、どんな場面で用いられるのかについても、しっかり押さえておきましょう。",
    kaisetsu:
      "ア　○：　展示陳列は、テーマを決めて商品を演出する陳列方法です。展示に手間がかかりますが、選択肢の記述にあるような洋服のコーディネートの提案などに向いています。よって記述は適切です。\n\nイ　○：　前進立体陳列とは、手前の方に商品が積み上がるように陳列する方法です。これによって、商品の豊富感を出す効果があります。よって記述は適切です。\n\nウ　○：　ゴンドラエンドに、特売品や目玉商品を大量に陳列し、マグネットポイントとして利用することで、そこに通じる副通路に顧客を誘導することができます。よって記述は適切です。\n\nエ　×：　量感陳列により、商品の豊富さをアピールして購買意欲を高める、前半の記述は正しいです。しかし、この陳列が適用される主な商品は、食料品や日用雑貨などの最寄品です。よって記述は不適切です。",
    figs: ["chinretsuTypes", "chinretsuMethods", "storeLayout"],
  },
  {
    id: 10,
    title: "陳列方法",
    category: "policy",
    question: "　陳列方法に関する記述として、最も不適切なものはどれか。",
    choices: [
      "カットケース陳列は、陳列の手間がかからず、安さを訴求できることから、ディスカウントストアなどでよく用いられる。",
      "島出し陳列は、陳列に変化を与えることで売場に活気を出し、顧客に注目させることができる。",
      "レジ前陳列は、顧客の目につきやすく、衝動買いを促進することができるため、高利益率の商品が陳列されるケースがよく見受けられる。",
      "ジャンブル陳列は、高級腕時計や宝飾品など、高額商品のディスプレイでよく見受けられる。",
    ],
    answer: 3,
    kokoga:
      "　本問では、いくつかの陳列方法の内容が問われています。\n　前の問題で触れなかった陳列方法には次のようなものがあります。\n●陳列方法\n　陳列の種類は、いくつもあって覚えるのが大変かもしれませんが、いずれもスーパーやコンビニエンスストアなどでよく見かけるものです。買い物に出かけた時に、上記のキーワードを思い浮かべながら観察してみることで、知識の定着に役立つでしょう。",
    kaisetsu:
      "ア　○：　カットケース陳列は、商品が入っていたダンボール箱をカットしてそのまま陳列する方法です。このため、陳列の手間がかからず、ディスカウントストアなどでよく用いられます。よって記述は適切です。\n\nイ　○：　島出し陳列は、一部を通路側にはみ出して陳列する方法です。島出し陳列にすることで、陳列に変化を与えることで活気を出し、顧客に注目させることができます。よって記述は適切です。\n\nウ　○：　レジ前は必ず顧客が通過する場所です。また、レジ待ちや精算中は手持ちぶさたになるため、レジ周辺の商品は顧客の目に触れやすくなります。この結果、ついで買いや衝動買いを促進できます。また、こうした絶好の場所であることから、高利益率の商品が陳列されるケースがよく見受けられます。よって記述は適切です。\n\nエ　×：　ジャンブル陳列は、投げ込み陳列とも呼ばれ、カゴの中に商品が大量に投げ込まれている陳列方法です。投げ込まれたイメージから、お買い得で安いといった印象を顧客に与えることができます。よって、電池やガムなど単価の安い商品に適していますが、高額な商品の陳列には適していません。",
    figs: [],
  },
  {
    id: 11,
    title: "陳列の範囲",
    category: "policy",
    question: "陳列の範囲と方向に関する記述として、最も適切なものはどれか。",
    choices: [
      "有効陳列範囲とは、顧客の手に届く範囲を指し、一般的にゴールデンゾーンよりも広い。",
      "ゴールデンゾーンは、顧客が無理なく手に取ることができる範囲を指し、一般的に有効陳列範囲よりも広い。",
      "ホリゾンタル陳列は、同じ種類の商品を縦に並べる手法で、顧客はサイズや色の違いなどを立ち止まったまま縦方向に比較することができる。",
      "バーチカル陳列は、同じ種類の商品を横に並べる手法で、顧客はサイズや色の違いなどを同じ目線の高さで横方向に比較することができる。",
    ],
    answer: 0,
    kokoga:
      "　本問では、陳列範囲と方法について問われています。\n　陳列の範囲や方法については、次のようなポイントがあります。\n●有効陳列範囲\n　顧客の手に届く範囲のことで、一般的には床から60センチメートルの高さから、210センチメートルの間と言われています。基本的に、商品はこの有効陳列範囲の中に陳列する必要があります。\n●ゴールデンゾーン\n　最も手に取りやすい範囲のことで、一般的には、男性の場合は床から80～140センチメートル、女性の場合は床から70～130センチメートル程度と言われています。これは、目の高さから、立ったまま手を下ろしたときの指先ぐらいの範囲です。\n　ゴールデンゾーンにある商品は、無理なく手に取ることができるため、売れ筋の商品や、重点商品を配置するのが基本です。\n\n●陳列方向\n・縦割り陳列は、同じ種類の商品を縦に並べる方法です。\n・横割り陳列は、同じ種類の商品を横に並べる方法です。\n\n　通常、顧客が買い物をするときは、横方向に売場を歩きます。そして、欲しい種類の商品があると立ち止まり、サイズや色などの細かいアイテムを探します。このとき、縦割り陳列であれば、顧客は立ち止まったまま縦にアイテムを探すことができるため便利です。一方、横割り陳列の場合は、アイテムを探すために横に歩く必要があり不便です。以上のことから、陳列の方向は、縦割り陳列にするのが原則です。\n\nゴールデンゾーンについては過去に何度か出題されています。ゴールデンゾーンの範囲は業界標準の規定の数値があるわけでないため、試験で出題される数値は多少前後する可能性があります。その数値が「手に取りやすい範囲を示しているか、否か」の基準で正否を判断すると良いでしょう。",
    kaisetsu:
      "ア　○：　有効陳列範囲は、顧客の手に届く範囲を指します。一般的には床から高さ60cm～210cmの範囲とされており、商品は基本的にこの有効陳列範囲に陳列します。ゴールデンゾーンは、有効陳列範囲の中でさらに手に取りやすい範囲を指しますので、有効陳列範囲の方が広いと言えます。よって記述は適切です。\n\nイ　×：　有効陳列範囲の中で、最も手に取りやすい範囲をゴールデンゾーンと呼びます。ゴールデンゾーンは、一般的には床から80cm～140cm（男性）、70 cm～130 cm（女性）程度とされています。有効陳列範囲よりもゴールデンゾーンの方が範囲は狭くなります。よって記述は不適切です。\n\nウ　×：　ホリゾンタル陳列は、同じ種類の商品を横に並べる手法です。顧客はサイズや色の違いなどを、同じ目線の高さで横方向に比較することができます。縦方向に並べる手法はバーチカル陳列です。よって記述は不適切です。\n\nエ　×：　バーチカル陳列は、同じ種類の商品を縦に並べる手法です。顧客はサイズや色の違いなどを、立ち止まったまま縦方向に比較することができます。横方向に並べる手法はホリゾンタル陳列です。よって記述は不適切です。",
    figs: ["goldenZone", "chinretsuDirection"],
  },
  {
    id: 12,
    title: "フェイシング管理",
    category: "policy",
    question: "　商品のフェイス配分に関する記述として、最も不適切なものはどれか。",
    choices: [
      "ある商品のフェイス数を増やすほど、その商品の販売数はフェイス数に比例して増加する。",
      "フェイス数を増やすことによって、機会損失を少なくすることができる。",
      "フェイス数の決定は、各品目の売上高をABC分析して行うのが効果的である。",
      "フェイシングをより効果的に実現するため、天気や気温、季節なども考慮することが重要である。",
    ],
    answer: 0,
    kokoga:
      "　本問では、商品のフェイシング管理について問われています。\n　フェイスとは商品の顔という意味で、フェイス数は、顧客の目に触れる商品の数のことです。フェイシング管理では、陳列スペースを有効利用するために、フェイシング数を次のような観点で管理していきます。\n①基本的に、売れ筋商品のフェイス数を増やし、死に筋商品のフェイス数を減らす。\n②フェイス数が増えるほど、顧客の目に商品が触れる機会が増えるため、売上は増加する。但し、ある範囲を超えると限界効用逓減の法則により、微増もしくは横ばいになる。\n③同じ品目でも時期によって売れ行きが変わることがあるので、仮説と検証をくり返して、時期に合わせてフェイス数を見直していく。\n④重点商品やおすすめ商品については、フェイス数を増やして積極的に提案していく。\n　フェイシングについては過去に何度か出題されています。フェイス数と売上が完全に比例しない点については、しっかりと押さえておきましょう。",
    kaisetsu:
      "ア　×：\n　フェイス数が増えると、顧客の目に商品が触れる機会が増えます。このため、一般的には、ある範囲まではフェイス数と比例して売上も増加します。しかし、ある範囲を超えると限界効用逓減の法則により、微増もしくは横ばいとなります。よって記述は不適切です。\n\nイ　○：\n　フェイス数は、店頭在庫量を意味します。このため、フェイス数を増やすと欠品や品薄状態が起こりにくくなり、機会損失を防止できます。よって記述は適切です。\n\nウ　○：\n　各品目の売上高をABC分析することで、売れ筋商品や、死に筋商品が明確になります。その結果を踏まえて、売れ筋商品のフェイス数を増やし、死に筋商品のフェイス数を減らすというように、効果的にフェイス数を決定できます。よって記述は適切です。\n\nエ　○：\n　同じ品目でも、天気や気温、季節によって売れ行きが変わることがあります。そのため、売上に影響を与えるこれらの要素も加味してフェイシング数を決定することで、より効果的なフェイシング管理が実現できます。よって記述は適切です。",
    figs: [],
  },
  {
    id: 13,
    title: "ビジュアルマーチャンダイジング(VMD)",
    category: "policy",
    question:
      "ビジュアルマーチャンダイジング（VMD）について、文中の空欄A～Cに入る用語の組合せとして、最も適切なものを下記の解答群より選べ。\n\n店舗コンセプトやシーズンテーマに基づくメッセージなど、常に新鮮な情報を視覚的に発信し、顧客を店内へ誘導するための売場をＡという。\nＡに興味を持って入店した顧客に、商品の特徴や機能、型や色、コーディネートなどのバリエーションを提示し、商品の魅力を強調して見せる売場がＢである。\n顧客が商品を選びやすく、買いやすいように、サイズ・色・デザインなどをわかりやすく分類して陳列し、購買意欲を高めるための売場をＣという。\n\n〔解答群〕",
    choices: [
      "Ａ：IP　Ｂ：PP　Ｃ：VP",
      "Ａ：PP　Ｂ：IP　Ｃ：VP",
      "Ａ：VP　Ｂ：IP　Ｃ：PP",
      "Ａ：VP　Ｂ：PP　Ｃ：IP",
    ],
    answer: 3,
    kokoga:
      "　本問ではビジュアルマーチャンダイジングの３つの売場について問われています。\nビジュアルマーチャンダイジング（VMD：Visual Merchandising）とは、ストアコンセプトに沿って、視覚的に商品をより良く見せていくための活動です。VMDには次の3つの売場区分があります。\n◆IP（Item Presentation）\n売場の大半を占める商品陳列の場です。商品のサイズ・色・デザインなどをわかりやすく分類し、選びやすく、買いやすく陳列して購買意欲を高めます。\n◆PP（Point of Sales Presentation）\n商品の特徴や機能を視覚的に表現し、型や色、コーディネートなどのバリエーションを顧客に提示し、商品の魅力を強調して見せる場です。\n◆VP（Visual Presentation）\nお店のコンセプトやシーズンテーマに基づくメッセージなど、常に新鮮な情報を視覚的に発信し、顧客を店内へ誘導するための重要な演出の場です。\n衣類やブランド物を扱う小売店では、商品の陳列を積極的に工夫して、ビジュアル的に演出している例を多く見かけます。今度、そういった例を見かけた時に自分がどんな印象を持つか注意を払うと、ビジュアルマーチャンダイジングの効果について、より深く理解できると思います。",
    kaisetsu:
      "空欄Ａ：\n店舗のコンセプトや訴求したいテーマに基づいて、新しい情報を視覚的に発信・提案し、顧客に興味を持ってもらう売場はVP（Visual Presentation）と言います。VPは、店頭のショーケースやマネキン等でディスプレイされたコーナーなど、顧客の目が止まりやすい場所で展開されます。このVPで興味を引き、顧客を店内へと誘導します。\n\n空欄Ｂ：\n入店した顧客に対して、商品の特徴や機能、型や色、コーディネート提案などにより、商品の魅力を強調して見せる売場がPP（Point of Sales Presentation）です。VPでは数多くの商品をディスプレイしませんので、このPPで様々な商品のバリエーションや組み合わせを提示します。\n\n空欄Ｃ：\n最終的には商品を買ってもらうことが狙いですので、顧客が商品を選びやすく、買いやすいように、サイズ・色・デザインなどをわかりやすく分類して陳列し、購買意欲を高めるための売場がIP（Item Presentation）となります。\n\n以上より、Ａ：VP　Ｂ：PP　Ｃ：IPとなり、選択肢エが正解です。",
    figs: [],
  },
  {
    id: 14,
    title: "インストアマーチャンダイジング 1",
    category: "policy",
    question:
      "　インストアマーチャンダイジングについて、文中の空欄A～Dに入る用語の組合せとして、最も適切なものを下記の解答群より選べ。\n\n　インストアマーチャンダイジングは、小売店内での顧客の購買を高めるためのＡ手法であり、売上高を構成する要素のうち、Ｂを増やすための活動を展開する。インストアマーチャンダイジングの活動は、店内が中心になるため、あまり費用をかけずに実行できるというメリットがある。 この考えが生まれた背景には、調査の結果、買い物のうちＣが占める割合はわずか1割であり、残りの9割は店内で購買決定をするＤだったということがある。",
    choices: [
      "Ａ：経済的　Ｂ：客単価　Ｃ：最寄品購買　Ｄ：買回品購買",
      "Ａ：科学的　Ｂ：客単価　Ｃ：計画購買　　Ｄ：非計画購買",
      "Ａ：科学的　Ｂ：来店客数　Ｃ：非計画購買　Ｄ：計画購買",
      "Ａ：経済的　Ｂ：来店客数　Ｃ：買回品購買　Ｄ：最寄品購買",
    ],
    answer: 1,
    kokoga:
      "　本問では、インストアマーチャンダイジングの概要が問われています。\n　インストアマーチャンダイジングは、小売店内で、顧客への販売を促進するための科学的手法です。\n　売上高は、「来店客数 × 客単価」という式に分解できます。インストアマーチャンダイジングでは、客単価の方を上げるための活動を行います。\n　一般的に、来店客数を増やすための活動は、店の外が中心となるため、例えば、広告を打つにしても多額の費用がかかります。一方、客単価を上げるための活動は店内が中心になるため、あまり費用をかけずに実行することができます。\n　インストアマーチャンダイジングが生まれた背景は、調査の結果、買い物のうち計画購買の占める割合がわずか1割であり、残りの9割は店内で購買決定をする非計画購買だったということがあります。このため、来店客の非計画購買を促進することで、客単価を向上させるための方法として、インストアマーチャンダイジングという考え方が体系化されました。\n　インストアマーチャンダイジングについては、過去に多く出題されています。まず、この考えのポイントが、「来店客の非計画購買の促進による、客単価の向上」である点を、しっかりと押さえておきましょう。",
    kaisetsu:
      "Ａ：科学的\n　インストアマーチャンダイジングは、来店客の購買時の心理や行動などを調査した結果を整理し、体系化した科学的手法です。よってここでは、「科学的」を選択するのが適切です。\n\nＢ：客単価\n　売上高は、「来店客数 Ｘ 客単価」で構成されます。このうち、来店客数を増やすための活動は、店の外が中心となります。一方、客単価を上げるための活動は店内が中心になります。インストアという言葉からも連想できるとおり、インストアマーチャンダイジングでは、客単価を上げるための活動が中心となります。よってここでは、「客単価」を選択するのが適切です。\n\nＣ：計画購買、Ｄ：非計画購買\n　調査の結果、来店前に購買が決まっているもの（計画購買品）はわずか1割で、来店してから購買を決めるもの（非計画購買品）が9割もあったということです。インストアマーチャンダイジングは、この非計画購買を如何に促進するかという考え方から生まれた手法です。よってここでは、それぞれ、「計画購買」「非計画購買」を選択するのが適切です。\n\n　よって正解はイとなります。",
    figs: [],
  },
  {
    id: 15,
    title: "インストアマーチャンダイジング 2",
    category: "policy",
    question:
      "　来店客の客単価を上げるためには、いくつかの要素がある。インストアマーチャンダイジングでは、これらの各要素を高めるための活動を実施するが、その内容に関する説明として、最も適切なものの組合せを下記の解答群から選べ。\n\n<客単価を上げる構成要素の説明>\n　①:動線長の向上\n　②:買上個数の向上\n　③:商品単価の向上\n　④:買上率の向上\n\n<構成要素を向上する具体策の説明>\n　ａ:店内食材を利用した、ミールソリューションの実施\n　ｂ:調理実演、および試食提供の実施\n　ｃ:マグネットポイントの利用による副通路への誘導の実施\n　ｄ:セット販売による値引きの実施。\n〔解答群〕",
    choices: [
      "①－ｃ　②－ｄ",
      "②－ａ　③－ｃ",
      "①－ａ　④－ｂ",
      "④－ｃ　③－ａ",
    ],
    answer: 0,
    kokoga:
      "　本問では、客単価を上げる構成要素と具体的な方法が問われています。\n　客単価を分解すると、次のようになります。\n　客単価 ＝ 動線長 × 立寄率 × 視認率 × 買上率 × 買上個数 × 商品単価\n　つまり、顧客に、歩いてもらい、売場に立ち寄ってもらい、商品を見てもらい、購買を決定してもらい、沢山の商品をまとめて買ってもらい、かつ高い単価の商品を買ってもらうことができれば、客単価は向上します。\n　それぞれの要素の内容と、各要素の値を上げる方法は次のようになります。\n　客単価はさまざまな要素から構成されます。表に示す各要素と、各要素の値を上げる方法について、しっかりと理解しましょう。",
    kaisetsu:
      "客単価の構成要素を高める方法として、正しい組合せは次のようになります。\n\n①動線長の向上 － マグネットポイントの利用による副通路への誘導の実施\nいかに顧客に店内を歩いて回ってもらうかを考えるのが動線長の向上です。顧客を引き付けるマグネットポイントを設置して、副通路を誘導するのが有効です。\n②買上個数の向上 － セット販売による値引きの実施\n商品の購入数量をいかに増やしてもらうかを考えるのが買上個数の向上です。１点購入するよりも複数購入した方がお得になるセット販売の値引きは有効といえます。　（調理実演と試食提供も買上個数の向上が期待できるため、解答の候補になりますが、選択肢の中にその組み合わせがありませんので、ここではセット販売による値引きが該当します）。\n③商品単価の向上 － 店内食材を利用したミールソリューションの実施\nミールソリューションは、家庭での調理負担を軽減するために、自店の食材をあらかじめ調理した総菜やひと手間加えるだけで料理になる半製品などを指します。食材のみで販売するよりも付加価値が付いていますので価格に反映しやすく、商品単価の向上が期待できます。\n④買上率の向上 － 調理実演、および試食提供の実施\n購入を迷っている商品の購買を後押しする働きかけが、買上率の向上につながります。調理実演と試食の提供は、実際に顧客が味を確認できるため、購買を促進する効果があります。（セット販売による値引きも買上率の向上が期待できますが、選択肢の中にその組み合わせがありませんので、ここでは調理実演と試食の提供が該当します）。\n以上より、①－ｃ　②－ｄとなり、選択肢アが正解です。",
    figs: ["kyakutankaTable"],
  },
  {
    id: 16,
    title: "インストアマーチャンダイジング 3",
    category: "policy",
    question:
      "　インストアマーチャンダイジングにおける、インストアプロモーション（以下、「ISP」という。）と、スペースマネジメントに関する記述として、最も不適切なものはどれか。",
    choices: [
      "スペースマネジメントとは、売り場生産性を高めるための手法である。",
      "価格弾力性の高い商品は、価格プロモーションを中心としたISPが有効である。",
      "プラノグラムでは、販売データに基づき店内の商品配置を決定する。",
      "クロスマーチャンダイジングは、非価格主導型のISPに含まれる。",
    ],
    answer: 2,
    kokoga:
      "　本問では、インストアマーチャンダイジングを構成する、インストアプロモーション（ISP）と、スペースマネジメントについて問われています。\n　これらの体系と内容は次のようになります。\n　インストアプロモーションや、スペースマネジメントについては過去に多く出題されています。図の体系と、価格主導型及び非価格主導型の具体例について、しっかりと押さえておきましょう。",
    kaisetsu:
      "ア　○：\n　スペースマネジメントは、売場の単位スペースあたりの売上･利益を最大化していく方法です。具体的には、販売データに基づき、商品の陳列場所や、陳列量を計画し、コントロールすることで、売場の生産性を向上させていきます。よって記述は適切です。\n\nイ　○：\n　価格弾力性の高い商品とは、価格が変わると需要が大きく変動する商品のことです。つまり価格を少し下げただけでも、販売量の増加が期待できます。こうした商品は価格主導型の活動、すなわち価格プロモーションを実施することで、効果的に販売量を増やすことができます。よって記述は適切です。\n\nウ　×：\n　プラノグラムとは棚割り計画のことで、棚の中の陳列位置やフェイス数を決める活動です。スペースマネジメントにおいて、店内の商品配置を決める活動は「スペースアロケーション」です。よって記述は不適切です。\n\nエ　○：\n　クロスマーチャンダイジングとは、関連商品をまとめて陳列･演出することで関連購買を促進する活動です。例えば、肉を単品で売るのではなく、焼肉のたれと並べて、焼肉コーナーとして演出するといったものです。こうした活動では、顧客の購買行動に配慮して関連商品の陳列や演出を工夫し、価格を変えることなく売上の増加を目指します。このため、クロスマーチャンダイジングは非価格主導型の活動に該当します。よって記述は適切です。",
    figs: ["ispTree"],
  },
  {
    id: 17,
    title: "カテゴリーマネジメント",
    category: "policy",
    question:
      "　カテゴリーマネジメントに関する記述として、最も適切なものはどれか。",
    choices: [
      "清涼飲料水というカテゴリーを作り、複数あった配置場所を一箇所にまとめた。",
      "小売の視点で売れそうなカテゴリーを作り、そのカテゴリー単位で商品を管理する。",
      "商品の品揃え･陳列･販売促進など、すべて小売業者が単独で決めて実施できる内容のため、比較的導入がしやすい。",
      "カテゴリーを戦略的なビジネス単位として、商品構成などを管理する必要がある。",
    ],
    answer: 3,
    kokoga:
      "　本問では、カテゴリーマネジメントについて問われています。\n　カテゴリーマネジメントについて、押さえておきたい内容は次の通りです。\n●カテゴリーマネジメントの概要\n　カテゴリーマネジメントは、顧客の視点でカテゴリーを構築し、そのカテゴリー単位で品揃え、仕入、陳列、販売促進、損益管理などをマネジメントする手法です。\n　これにより店舗内では、従来のメーカー単位や、品種単位中心の品揃えや陳列ではなく、顧客の視点にたって構築したカテゴリーを中心とした品揃えや陳列をすることになります。\n●カテゴリーマネジメントの実現\n　カテゴリーマネジメントの実現のためには、陳列や販売促進だけでなく、カテゴリー単位に経営管理を行う組織を編成する必要があります。そのため、カテゴリーは戦略的事業単位となります。また、仕入や商品管理をカテゴリー単位で行う必要があるため、小売業だけでなく、メーカーや卸が協力しながら取り組む必要があります。\n　カテゴリーマネジメントでは、顧客視点でカテゴリーを構築すること、小売業だけでなくメーカーや卸と連携して取組むこと、この２点を押さえておきましょう。",
    kaisetsu:
      "ア　×：\n　カテゴリーマネジメントでは、従来の品種単位やメーカー単位の陳列ではなく、顧客の視点に立ってカテゴリーを構築します。例えば「オーガニック」、「生活習慣病予防」というように、品種にこだわらず広い視点に立ってカテゴリーを構築し、そのカテゴリーに属する関連商品を品揃え・陳列します。選択肢の記述は、複数あった飲料水の売り場を一箇所にまとめたに過ぎず、カテゴリーマネジメントとはいえません。よって記述は不適切です。\n\nイ　×：\n　カテゴリーマネジメントは、小売の視点ではなく、「顧客の視点から見た」商品のカテゴリーを作り、そのカテゴリー単位で品揃え･陳列･販売促進などを行っていく手法です。よって記述は不適切です。\n\nウ　×：\n　カテゴリーマネジメントの実現のためには、小売業者だけでなく、メーカーや卸が参加して、しっかりとした計画を作成し、お互いの意図を共有した上で、SCM全体が連動することが必要です。決して小売単独で実現できるものではありません。よって記述は不適切です。\n\nエ　○：\n　カテゴリーマネジメントの提唱者、ブライアン・ハリスは、「カテゴリーマネジメントとは、カテゴリーを戦略的ビジネス単位として管理していくことであり、消費者に価値を提供することに集中することによって、業績を改善していくこと」と定義しています。つまりカテゴリーマネジメントでは、顧客視点でカテゴリーを構築した上で、このカテゴリー単位で経営管理を行う組織を編成し、これを戦略的ビジネス単位として運営していきます。よって記述は適切です。",
    figs: [],
  },
  {
    id: 18,
    title: "人時生産性",
    category: "calc",
    question:
      "　ある売場において、商品を400万円で仕入れ、５日間ですべての商品を販売することを計画している。この売場で４人の従業員が毎日それぞれ５時間ずつ労働し、売上高が800万円であった場合、この期間の人時生産性として、最も適切なものはどれか。",
    choices: ["4万円", "16万円", "20万円", "80万円"],
    answer: 0,
    kokoga:
      "　本問では人時生産性についての知識を問われています。以下の式によって計算します。\n　人時生産性＝粗利益/総労働時間\n　分子の粗利益は、営業利益等を採用することもあります。人時生産性は従業員一人の時間当たりの生産性を意味しており、１人の従業員が１時間にどれだけの粗利を稼いだかを表す指標です。高いほど良く、生産性・効率の高い企業（事業所・店舗）であるといえます。\n　人時生産性を向上させるためには、粗利益の増加、総労働時間の削減が求められます。欧米に比べ、日本企業の生産性が低いと指摘されることがありますが、特に、総労働時間の低下が必要となります。そのためには、分母の総労働時間の算定要素である労働者数の減少、一人当たりの労働時間の短縮が重要になってきます。",
    kaisetsu:
      "人時生産性＝粗利益/総労働時間ですので、まず粗利益を求めます。\n粗利益＝売上高－売上原価（仕入）＝800－400＝400万円\n総労働時間＝５日×４人×５時間＝100時間\n人時生産性＝400万円/100時間＝4万円\nよって、アが正解になります。",
    figs: [],
  },
  {
    id: 19,
    title: "GMROI（商品投下資本粗利益率）",
    category: "calc",
    question:
      "　ある小売店の営業実績は次の通りであった。この小売店のGMROIとして、最も適切なものを下記の解答群より選べ。\n\n売上高 2,000万\n仕入れ高 900万\n期首棚卸高(原価) 200万\n期末棚卸高(原価) 300万\n\n〔解答群〕",
    choices: ["380%", "400%", "480%", "500%", "550%"],
    answer: 2,
    kokoga:
      "　本問では粗利益と平均在庫高(原価）を用いて、GMROI（商品投下資本粗利益率）を算出することが求められています。\n多くの小売業では、利益の目標をGMROI（商品投下資本粗利益率）で設定します。GMROIとは投下した商品に対する粗利益の割合で、次の式で求めます。\nGMROI ＝ 粗利益／平均在庫高(原価)\nここで、平均在庫高（原価）は、｛ 期首商品在庫高(原価) ＋ 期末商品在庫高(原価）｝÷ 2で、計算される在庫の平均値です。\nGMROIは過去に多く出題されています。上記の基本的な式は、必ず覚えておきましょう。",
    kaisetsu:
      "問題文に示された営業実績から、この小売店のGMROIを求めてみましょう。GMROIは次の式で算出できます。\nGMROI ＝ 粗利益 ÷ 平均在庫高（原価）\n粗利益＝ 売上高－（期首棚卸高(原価)＋仕入高－期末棚卸高(原価)）\n＝ 2,000万－（200万＋900万－300万）\n＝ 1,200万\n平均在庫高（原価）＝（期首棚卸高(原価)＋期末棚卸高(原価)）÷２\n＝（200万＋300万）÷２\n＝ 250万\nGMROI ＝ 1,200万÷250万＝480（％）\n\n以上より、選択肢ウが正解です。",
    figs: [],
  },
  {
    id: 20,
    title: "交差比率（交差主義比率）",
    category: "calc",
    question:
      "　ある小売店の売上高粗利益率が30%、商品回転率（売価）が6回、商品回転率（原価）が4回である場合の交差比率（交差主義比率）の値として、最も適切なものはどれか。",
    choices: ["120%", "180%", "300%", "500%"],
    answer: 1,
    kokoga:
      "　本問では売上高粗利益率と商品回転率（原価）と売価値入率を用いて、交差比率を算出することが求められています。\n　交差比率と商品回転率については、それぞれ次の式で求めます。\n●交差比率（交差主義比率）\n　交差比率は、GMROIの代わりの指標として用いられるもので、GMROIの分母の平均在庫高を売価にしたものになります。交差比率の式は、（下記①）\n\nとなります。さらに、（下記②）\n\n　という関係が成り立ちます。\n\n●商品回転率\n　商品回転率は、売価基準と原価基準の2つの計算方法があり、それぞれ次の式で求めます。なお、分子と分母の基準が、それぞれ売価と原価で揃っていることに注意しましょう。（下記③④）\n\n　交差比率は、粗利益と平均在庫高（売価）、もしくは粗利益率と商品回転率（売価）を用いて計算しますので、売価基準と原価基準を混同しないよう注意しましょう。\n　交差比率の計算は、過去に何度か出題されています。なお、試験では「交差主義比率」という表現がされる可能性がありますが、同じものです。確実に計算できるように練習しておきましょう。",
    kaisetsu:
      "正解：イ　180％\n\n交差比率は次の式で求められます。\n　・交差比率\n　　＝粗利益÷平均在庫高（売価）\n　　＝売上高粗利益率 × 商品回転率（売価）\n売上高粗利益率は30%、商品回転率（売価）は6回なので、これを用いて計算します。\n　・交差比率\n　　＝ 30% × 6回\n＝ 180%\nよって正解はイとなります。\n設問には、商品回転率（売価）と商品回転率（原価）の値が与えられていますが、商品回転率（売価）を用いて計算する点に注意しましょう。",
    figs: ["kousahiritsuFormula"],
  },
  {
    id: 21,
    title: "商品予算計画",
    category: "calc",
    question:
      "　ある小売店の商品予算計画に関する算出数値として、最も不適切なものはどれか。",
    choices: [
      "1年間の粗利益が2,400万円、年間平均在庫高（原価）が800万円であった場合、GMROIは300%である。",
      "2,000円で仕入れた商品を、売価値入率20%で販売した場合、販売価格は2,500円である。",
      "1年間の売上が1,800万円、期首と期末の棚卸高（売価）がそれぞれ、200万円、400万円であった場合、商品回転率（売価）は6回転である。",
      "当月売上高予算が300万円、年間売上高予算が3,600万円、年間予定商品回転数が4回転である場合、基準在庫法による月初適正在庫高は、800万円である。",
      "年間売上高予算が2,400万円、期首と期末の在庫高予算（売価）がそれぞれ、300万円、500万円であった場合、仕入高予算（売価）は、2,600万円である。",
    ],
    answer: 3,
    kokoga:
      "　本問では販売予算計画で用いる各指標の値を算出することが求められています。\n　ここでは、先の2問で解説した以外に予算計画を作る上で必要な内容を説明します。\n●在庫高予算\n　売上高予算を決定した後に、在庫高予算を編成しますが、月初の適正在庫高を決定する方法として、基準在庫法と百分率変異法の2つがあります。それぞれ、次の式で求めます。\n①基準在庫法（商品回転率が6回以下の商品向き）\n②百分率変異法（商品回転率が6回以上の商品向き）\n●値入高予算\n　商品の仕入価格を基に、どれだけ上乗せして販売価格にするかを決定します。上乗せする割合は、「値入率」で決定します。なお、値入率には、売価基準と原価基準の2種類があるので注意しましょう。\n●仕入高予算\n　仕入高予算は、売上高予算と在庫高予算から、次の式で計算します。\n仕入高予算（売価）\n＝ 売上高予算 ＋ 期末在庫高予算（売価）－ 期首在庫高予算（売価）\n　繰り返しになりますが、商品計画に関する問題は、過去に多く出題されています。先の2問も含めて、基本的な計算はしっかりとできるように練習しておきましょう。",
    kaisetsu:
      "ア　○：　GMROI＝粗利益÷平均在庫高（原価）＝ 2,400万円÷800万円 ＝300%。よって記述は適切です。\n\nイ　○：　売価＝原価÷（１－売価値入率）＝ 2,000円÷（１－0.2）＝2,500円。よって記述は適切です。\n\nウ　○：　平均在庫（売価）＝（期首商品在庫高(売価) ＋ 期末商品在庫高(売価)）÷ 2＝（200万円＋400万円)÷2＝300万円。商品回転率（売価）＝売上÷平均在庫（売価)＝1,800万円÷300万円＝6回転。よって記述は適切です。\n\nエ　×：　月初在庫高予算＝当月売上高予算＋ 年間売上高予算／年間予定商品回転率 － 年間売上高予算／12 ＝300万円＋（3,600万円÷4)－（3,600万円÷12）＝900万円。800万円ではありません。よって記述は不適切です。\n\nオ　○：　仕入高予算（売価）＝売上高予算＋期末在庫高予算（売価）－期首在庫高予算（売価）＝2,400万円＋500万円－300万円＝2,600万円。よって記述は適切です。",
    figs: ["budgetFormula"],
  },
  {
    id: 22,
    title: "相乗積",
    category: "calc",
    question:
      "　3つの店舗からなる小売店がある。A店舗（粗利益率：10% ／ 売上高構成比：50%)、B店舗（粗利益率：15% ／ 売上高構成比：30%)、C店舗（粗利益率：20% ／ 売上高構成比：20%)の時、この小売店における相乗積に関する記述として、最も適切なものはどれか。",
    choices: [
      "小売店全体の粗利益率は、15%である。",
      "ある店舗の相乗積は、小売店全体の粗利益高に占める当該店舗の粗利益高の割合を示す。",
      "B店舗の相乗積は4.5%である。",
      "小売店全体の中で最も利益貢献度の高い店舗はC店舗である。",
    ],
    answer: 2,
    kokoga:
      "　本問では相乗積に関する内容が、問われています。\n　複数の部門や店舗を有する小売業では、各部門が小売店全体の収益にどの程度貢献しているかを把握する必要があります。この各部門の利益貢献度を示す指標として相乗積があります。相乗積について押さえておきたいポイントは、次のようになります。\n・相乗積 ＝ 各部門の粗利益率 × 各部門の売上高構成比\n・各部門の相乗積の和は、小売店全体の粗利益率と等しくなる\n・各店舗の相乗積は、小売店全体の売上高に対する、当該店舗の粗利益高の割合を示す\n　相乗積は、近年頻繁に出題されている分野です。相乗積の計算方法と、その値が持つ意味について、しっかりと理解しておきましょう。",
    kaisetsu:
      "ア　×：小売店全体の粗利益率は、各店舗の相乗積の総和になります。各店舗の相乗積を求めその総和を求めると13.5％となります。よって記述は不適切です。\n・A店舗の相乗積＝10％×50％＝5％\n・B店舗の相乗積＝15％×30％＝4.5％\n・C店舗の相乗積＝20％×20％＝4％\n\nイ　×：相乗積は、売上高構成比×粗利益率で求めます。選択肢イの説明は、小売店全体に占める当該店舗の粗利益高構成比を示しています。よって記述は不適切です。\n\nウ　○：B店舗の相乗積は、4.5％となります。よって記述は適切です。\n\nエ　×：小売店全体の売上に対する、各店舗の粗利益高(相乗積)を比較すると、A店舗が最も利益を生み出しています。よって記述は不適切です。",
    figs: [],
  },
];

const CATEGORY_LABELS = {
  policy: "商品・売場政策",
  calc: "小売計数管理",
};
const CHOICE_MARKS = ["ア", "イ", "ウ", "エ", "オ"];
const MODE_LABELS = { all: "すべての問題", wrong: "前回不正解の問題のみ", review: "要復習の問題のみ" };

// ===================================================================
// メインコンポーネント
// ===================================================================
export default function App() {
  // 画面状態："login" | "dashboard" | "quiz" | "result"
  const [screen, setScreen] = useState("login");
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  const [userId, setUserId] = useState("");
  const [inputId, setInputId] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false); // 合言葉入力＋復元完了でのみtrue
  const [authReady, setAuthReady] = useState(false); // 匿名認証の完了（=通信可能になっただけ）
  const [loggingIn, setLoggingIn] = useState(false);
  const [usingLocal, setUsingLocal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // 学習データ
  const [progress, setProgress] = useState({
    history: {},
    reviews: {},
    progressIndex: 0,
    progressMode: "all",
  });

  // 出題
  const [mode, setMode] = useState("all");
  const [quizList, setQuizList] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // 途中再開モーダル
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pendingProgress, setPendingProgress] = useState(null);

  // ユーザーIDの変更を追跡（初回ロード判定用）
  const isFirstLoad = useRef(true);
  useEffect(() => {
    isFirstLoad.current = true;
  }, [userId]);

  const unsubRef = useRef(null);
  const usingLocalRef = useRef(false);
  useEffect(() => {
    usingLocalRef.current = usingLocal;
  }, [usingLocal]);

  // -----------------------------------------------------------------
  // 起動時：匿名認証（通信可能状態の確立のみ。これでログイン完了にはしない）
  // -----------------------------------------------------------------
  useEffect(() => {
    let mounted = true;
    const doAuth = async () => {
      if (!auth) {
        console.warn("[Auth] Firebase未初期化。LocalStorageフォールバックで動作します。");
        if (mounted) {
          setUsingLocal(true);
          setAuthReady(true);
        }
        return;
      }
      try {
        await signInAnonymously(auth);
        console.log("[Auth] 匿名サインイン成功（通信可能状態）。ただしログイン完了ではない。");
        if (mounted) setAuthReady(true);
      } catch (e) {
        console.error("[Auth] 匿名サインイン失敗。LocalStorageフォールバックへ切替。", e);
        if (mounted) {
          setUsingLocal(true);
          setAuthReady(true);
        }
      }
    };
    doAuth();
    return () => {
      mounted = false;
      if (unsubRef.current) {
        try {
          unsubRef.current();
        } catch (e) {
          /* noop */
        }
      }
    };
  }, []);

  // -----------------------------------------------------------------
  // LocalStorageフォールバック ユーティリティ
  // -----------------------------------------------------------------
  const localKey = (uid) => `${APP_ID}_${uid}`;
  const readLocal = (uid) => {
    try {
      const raw = window.localStorage.getItem(localKey(uid));
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      console.error("[Local] 読み込み失敗", e);
      return null;
    }
  };
  const writeLocal = (uid, data) => {
    try {
      window.localStorage.setItem(localKey(uid), JSON.stringify(data));
    } catch (e) {
      console.error("[Local] 書き込み失敗", e);
    }
  };

  // -----------------------------------------------------------------
  // 進捗の保存（Firestore + LocalStorage）防衛的に try-catch
  // -----------------------------------------------------------------
  const persist = useCallback(async (uid, data) => {
    if (!uid) return;
    // LocalStorageは常にフォールバックとして保存
    writeLocal(uid, data);
    if (db && !usingLocalRef.current) {
      try {
        const ref = doc(db, APP_ID, uid);
        await setDoc(ref, data, { merge: true });
        console.log("[Save] Firestoreへ保存しました。", {
          progressIndex: data?.progressIndex,
          progressMode: data?.progressMode,
        });
      } catch (e) {
        console.error("[Save] Firestore保存失敗。LocalStorageのみで継続。", e);
      }
    } else {
      console.log("[Save] LocalStorageへ保存しました。", {
        progressIndex: data?.progressIndex,
        progressMode: data?.progressMode,
      });
    }
  }, []);

  // -----------------------------------------------------------------
  // 出題リストの構築
  // -----------------------------------------------------------------
  const buildList = useCallback((m, prog) => {
    const hist = prog?.history || {};
    const rev = prog?.reviews || {};
    if (m === "wrong") {
      return QUESTIONS.filter((q) => hist?.[q.id] && hist[q.id].correct === false);
    }
    if (m === "review") {
      return QUESTIONS.filter((q) => rev?.[q.id] === true);
    }
    return [...QUESTIONS];
  }, []);

  // -----------------------------------------------------------------
  // 合言葉によるログイン（フェッチ完了の瞬間にのみ isAuthenticated=true）
  // -----------------------------------------------------------------
  const handleLogin = async () => {
    const uid = (inputId || "").trim();
    if (!uid) {
      setErrorMsg("合言葉を入力してください。");
      return;
    }
    if (uid.length < 4) {
      setErrorMsg("合言葉は4文字以上で入力してください。");
      return;
    }
    setErrorMsg("");
    setLoggingIn(true);
    console.log("[Login] 合言葉での接続を開始します。userId=", uid);

    // 既存の購読を解除
    if (unsubRef.current) {
      try {
        unsubRef.current();
      } catch (e) {
        /* noop */
      }
      unsubRef.current = null;
    }

    setUserId(uid);
    isFirstLoad.current = true;

    const normalize = (data) => ({
      history: data?.history || {},
      reviews: data?.reviews || {},
      progressIndex: Number(data?.progressIndex || 0),
      progressMode: data?.progressMode || "all",
    });

    const finishLogin = (parsed) => {
      isFirstLoad.current = false;
      setProgress(parsed);
      setIsAuthenticated(true);
      setScreen("dashboard");
      setLoggingIn(false);
      console.log("[Login] 初期データ読み込み完了。ログイン確定。", {
        progressIndex: parsed.progressIndex,
        progressMode: parsed.progressMode,
      });
      if (Number(parsed.progressIndex) > 0) {
        console.log("[Resume] 途中再開データを検知。再開モーダルを表示します。");
        setPendingProgress(parsed);
        setShowResumeModal(true);
      }
    };

    // LocalStorageフォールバックモード
    if (!db || usingLocalRef.current) {
      const local = readLocal(uid) || {};
      finishLogin(normalize(local));
      return;
    }

    // Firestore：まず確実にフェッチ（getDoc）してからログイン確定 → その後 onSnapshot を張る
    try {
      const ref = doc(db, APP_ID, uid);
      const snap = await getDoc(ref);
      const data = snap.exists() ? snap.data() : {};
      finishLogin(normalize(data));

      // リアルタイム同期（screenRef + isFirstLoad ガードで割り込み防止）
      const unsubscribe = onSnapshot(
        ref,
        (snapshot) => {
          if (snapshot.exists()) {
            const d = snapshot.data();
            const p = normalize(d);
            // 【重要】初回ロード判定かつ画面がダッシュボードのときのみ途中再開モーダルをトリガー
            if (isFirstLoad.current && screenRef.current === "dashboard") {
              isFirstLoad.current = false;
              if (p.progressIndex > 0) {
                setPendingProgress(p);
                setShowResumeModal(true);
                setProgress(p);
                return; // ステート更新をスキップしてモーダル表示
              }
            }
            // クイズ解答中（screen !== "dashboard"）や再開不要な場合はダイアログを出さず進捗のみ同期
            setProgress(p);
          }
        },
        (err) => {
          console.error("[Sync] onSnapshotエラー。", err);
        }
      );
      unsubRef.current = unsubscribe;
    } catch (e) {
      console.error("[Login] Firestoreフェッチ失敗。LocalStorageへフォールバック。", e);
      setUsingLocal(true);
      usingLocalRef.current = true;
      const local = readLocal(uid) || {};
      finishLogin(normalize(local));
    }
  };

  // -----------------------------------------------------------------
  // クイズ開始
  // -----------------------------------------------------------------
  const startQuiz = (m, startIndex = 0) => {
    const list = buildList(m, progress);
    console.log("[Mode] 出題モードを切り替え:", m, "問題数:", list.length, "開始Index:", startIndex);
    if (!list || list.length === 0) {
      setErrorMsg(
        m === "wrong"
          ? "前回不正解の問題はありません。"
          : m === "review"
          ? "要復習に登録された問題はありません。"
          : "出題できる問題がありません。"
      );
      return;
    }
    setErrorMsg("");
    setMode(m);
    setQuizList(list);
    const idx = Math.min(Math.max(startIndex, 0), list.length - 1);
    setCurrentIndex(idx);
    setSelected(null);
    setIsAnswered(false);
    setScreen("quiz");
  };

  // -----------------------------------------------------------------
  // 解答（クリック即時判定 → 解説展開 → 進捗保存）
  // -----------------------------------------------------------------
  const handleAnswer = (choiceIdx) => {
    if (isAnswered) return;
    const q = quizList?.[currentIndex];
    if (!q) return;
    const correct = choiceIdx === q.answer;
    setSelected(choiceIdx);
    setIsAnswered(true);
    console.log("[Answer] 解答:", { qid: q.id, choiceIdx, correct });

    const newHistory = {
      ...(progress?.history || {}),
      [q.id]: {
        correct,
        selected: choiceIdx,
        answeredAt: new Date().toISOString(),
      },
    };
    const newProgress = {
      ...progress,
      history: newHistory,
      progressIndex: currentIndex, // 何問目まで進んだか
      progressMode: mode,
    };
    setProgress(newProgress);
    console.log("[Progress] 途中再開インデックスを保存:", currentIndex, "mode:", mode);
    persist(userId, newProgress);
  };

  // -----------------------------------------------------------------
  // 要復習トグル
  // -----------------------------------------------------------------
  const toggleReview = (qid) => {
    const cur = progress?.reviews?.[qid] === true;
    const newReviews = { ...(progress?.reviews || {}), [qid]: !cur };
    const newProgress = { ...progress, reviews: newReviews };
    setProgress(newProgress);
    console.log("[Review] 要復習フラグ更新:", { qid, value: !cur });
    persist(userId, newProgress);
  };

  // -----------------------------------------------------------------
  // 次の問題へ / 完走
  // -----------------------------------------------------------------
  const goNext = () => {
    if (currentIndex + 1 >= quizList.length) {
      // 全問完走 → progressIndexを0にリセット
      const newProgress = { ...progress, progressIndex: 0 };
      setProgress(newProgress);
      console.log("[Complete] 全問完走。progressIndexを0にリセットします。");
      persist(userId, newProgress);
      setScreen("result");
      return;
    }
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    setSelected(null);
    setIsAnswered(false);
    // 進んだ位置を保存
    const newProgress = { ...progress, progressIndex: nextIdx, progressMode: mode };
    setProgress(newProgress);
    console.log("[Progress] 次の問題へ。インデックス保存:", nextIdx);
    persist(userId, newProgress);
  };

  // -----------------------------------------------------------------
  // ホームに戻る（その時点のインデックスを即保存）
  // -----------------------------------------------------------------
  const goHome = () => {
    const newProgress = { ...progress, progressIndex: currentIndex, progressMode: mode };
    setProgress(newProgress);
    console.log("[Home] ホームに戻る。中断インデックス保存:", currentIndex);
    persist(userId, newProgress);
    setScreen("dashboard");
    setSelected(null);
    setIsAnswered(false);
  };

  // -----------------------------------------------------------------
  // 途中再開モーダル操作
  // -----------------------------------------------------------------
  const handleResume = () => {
    const p = pendingProgress || progress;
    const m = p?.progressMode || "all";
    const idx = Number(p?.progressIndex || 0);
    console.log("[Resume] 続きから再開:", { mode: m, index: idx });
    setShowResumeModal(false);
    setPendingProgress(null);
    startQuiz(m, idx);
  };
  const handleRestart = () => {
    console.log("[Resume] 最初から開始。progressIndexを0にリセット。");
    const newProgress = { ...progress, progressIndex: 0 };
    setProgress(newProgress);
    persist(userId, newProgress);
    setShowResumeModal(false);
    setPendingProgress(null);
  };

  // -----------------------------------------------------------------
  // レーダーチャート用 指標計算
  // -----------------------------------------------------------------
  const computeMetrics = () => {
    const hist = progress?.history || {};
    const total = QUESTIONS.length;
    const answered = QUESTIONS.filter((q) => hist?.[q.id]).length;
    const correct = QUESTIONS.filter((q) => hist?.[q.id]?.correct === true).length;
    const catTotal = (c) => QUESTIONS.filter((q) => q.category === c).length;
    const catCorrect = (c) =>
      QUESTIONS.filter((q) => q.category === c && hist?.[q.id]?.correct === true).length;

    const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
    return [
      { metric: "総合進捗率", value: pct(answered, total) },
      { metric: "全問正解率", value: pct(correct, total) },
      { metric: "回答正確性", value: pct(correct, answered) },
      { metric: CATEGORY_LABELS.policy, value: pct(catCorrect("policy"), catTotal("policy")) },
      { metric: CATEGORY_LABELS.calc, value: pct(catCorrect("calc"), catTotal("calc")) },
    ];
  };

  // ===================================================================
  // レンダリング
  // ===================================================================

  // 起動直後（匿名認証中）はローディングスピナーを表示（画面真っ白防止）
  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // 【最重要】ログイン完了（合言葉入力＋復元完了）まではログイン画面のみを描画
  // 注意：内部コンポーネントは <LoginScreen /> ではなく LoginScreen() として
  // インライン展開する。これにより毎レンダー時の再マウント（入力欄のフォーカス喪失）を防ぐ。
  if (!isAuthenticated || screen === "login") {
    return LoginScreen();
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-6">
        {Header()}
        {screen === "dashboard" && Dashboard()}
        {screen === "quiz" && QuizScreen()}
        {screen === "result" && ResultScreen()}
      </div>
      {showResumeModal && ResumeModal()}
    </div>
  );

  // ----------------------- 内部コンポーネント -----------------------

  function LoginScreen() {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 shadow-lg shadow-indigo-900/50">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">スマート問題集 3-8</h1>
            <p className="mt-1 text-sm text-slate-400">マーチャンダイジング</p>
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-300">
            合言葉（ユーザーID）
          </label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
              placeholder="合言葉を入力（複数端末で同期）"
              className="w-full rounded-xl border border-slate-700 bg-slate-950/60 py-3 pl-10 pr-3 text-slate-100 placeholder-slate-500 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
          {errorMsg ? <p className="mt-2 text-sm text-rose-400">{errorMsg}</p> : null}

          <button
            onClick={handleLogin}
            disabled={loggingIn}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 py-3 font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01] hover:shadow-indigo-700/50 disabled:opacity-60"
          >
            {loggingIn ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                読み込み中...
              </>
            ) : (
              <>
                学習を開始する
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">
            同じ合言葉をPC・スマホで入力すると、<br />
            学習履歴と進捗が完全に同期・復元されます。
          </p>
          {usingLocal ? (
            <p className="mt-3 text-center text-xs text-amber-400/80">
              ※ 現在オフライン（ローカル保存）モードで動作しています。
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  function Header() {
    return (
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500 shadow-lg shadow-indigo-900/40">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-white">スマート問題集 3-8</h1>
            <p className="text-xs text-slate-400">マーチャンダイジング</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/70 px-3 py-1.5">
          <User className="h-4 w-4 text-indigo-400" />
          <span className="text-xs text-slate-300">{userId}</span>
        </div>
      </div>
    );
  }

  function Dashboard() {
    const metrics = computeMetrics();
    const hist = progress?.history || {};
    const rev = progress?.reviews || {};
    const answered = QUESTIONS.filter((q) => hist?.[q.id]).length;
    const correct = QUESTIONS.filter((q) => hist?.[q.id]?.correct === true).length;

    return (
      <div className="space-y-6">
        {/* サマリ */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard label="総問題数" value={`${QUESTIONS.length}`} />
          <StatCard label="解答済" value={`${answered}`} accent="sky" />
          <StatCard label="正解数" value={`${correct}`} accent="indigo" />
        </div>

        {/* レーダーチャート */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
          <div className="mb-2 flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-400" />
            <h2 className="font-bold text-white">学習分析レーダー</h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={metrics} outerRadius="70%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  stroke="#334155"
                />
                <Radar
                  name="達成度"
                  dataKey="value"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.45}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* モード選択 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
          <h2 className="mb-3 font-bold text-white">出題モードを選んで開始</h2>
          {errorMsg ? (
            <p className="mb-3 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {errorMsg}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <ModeButton m="all" />
            <ModeButton m="wrong" />
            <ModeButton m="review" />
          </div>
        </div>

        {/* 履歴一覧 */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
          <h2 className="mb-4 font-bold text-white">学習履歴（全問俯瞰）</h2>
          <div className="space-y-2">
            {QUESTIONS.map((q) => {
              const h = hist?.[q.id];
              const status = !h ? "untouched" : h.correct ? "correct" : "wrong";
              const isReview = rev?.[q.id] === true;
              return (
                <div
                  key={q.id}
                  className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="w-7 shrink-0 text-center text-sm font-bold text-slate-400">
                      {q.id}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-200">{q.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {CATEGORY_LABELS[q.category]}
                        {h?.answeredAt
                          ? ` ・ ${new Date(h.answeredAt).toLocaleString("ja-JP", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {isReview ? (
                      <span className="rounded-md bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                        要復習
                      </span>
                    ) : null}
                    <StatusBadge status={status} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function StatCard({ label, value, accent }) {
    const ring =
      accent === "sky"
        ? "from-sky-600/20 to-sky-400/5 border-sky-700/40"
        : accent === "indigo"
        ? "from-indigo-600/20 to-indigo-400/5 border-indigo-700/40"
        : "from-slate-700/20 to-slate-600/5 border-slate-700/50";
    return (
      <div className={`rounded-2xl border bg-gradient-to-br ${ring} p-4 text-center shadow-lg`}>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{label}</p>
      </div>
    );
  }

  function StatusBadge({ status }) {
    if (status === "correct") {
      return (
        <span className="flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-[11px] font-bold text-emerald-300">
          <Check className="h-3.5 w-3.5" /> 正解
        </span>
      );
    }
    if (status === "wrong") {
      return (
        <span className="flex items-center gap-1 rounded-md bg-rose-500/15 px-2 py-1 text-[11px] font-bold text-rose-300">
          <X className="h-3.5 w-3.5" /> 不正解
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 rounded-md bg-slate-700/40 px-2 py-1 text-[11px] font-bold text-slate-400">
        <HelpCircle className="h-3.5 w-3.5" /> 未着手
      </span>
    );
  }

  function ModeButton({ m }) {
    const count = buildList(m, progress).length;
    return (
      <button
        onClick={() => startQuiz(m)}
        className="group flex flex-col items-start gap-1 rounded-xl border border-slate-700 bg-slate-950/50 p-4 text-left transition hover:scale-[1.01] hover:border-indigo-500/60 hover:bg-indigo-950/30"
      >
        <span className="flex items-center gap-2 text-sm font-bold text-slate-100">
          {MODE_LABELS[m]}
        </span>
        <span className="text-xs text-slate-500">{count} 問</span>
        <span className="mt-1 flex items-center gap-1 text-xs font-medium text-indigo-400 group-hover:text-indigo-300">
          開始 <ChevronRight className="h-4 w-4" />
        </span>
      </button>
    );
  }

  function QuizScreen() {
    const q = quizList?.[currentIndex];
    if (!q) {
      return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center text-slate-300">
          出題できる問題がありません。
          <button onClick={goHome} className="mt-4 block w-full rounded-xl bg-indigo-600 py-2 font-bold">
            ホームへ戻る
          </button>
        </div>
      );
    }
    const ProblemFig = q.problemFig ? FIGURES[q.problemFig] : null;

    return (
      <div className="space-y-5">
        {/* 進捗バー */}
        <div className="flex items-center justify-between">
          <button
            onClick={goHome}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            <Home className="h-4 w-4" /> ホーム
          </button>
          <span className="text-sm text-slate-400">
            {currentIndex + 1} / {quizList.length}（{MODE_LABELS[mode]}）
          </span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all"
            style={{ width: `${((currentIndex + 1) / quizList.length) * 100}%` }}
          />
        </div>

        {/* 問題カード */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-indigo-500/15 px-2.5 py-1 text-xs font-bold text-indigo-300">
              問題 {q.id}
            </span>
            <span className="rounded-md border border-sky-700/40 bg-sky-500/10 px-2.5 py-1 text-xs font-bold text-sky-300">
              出典：{SOURCE_LABEL}
            </span>
            <span className="rounded-md bg-slate-700/40 px-2.5 py-1 text-xs font-medium text-slate-300">
              {CATEGORY_LABELS[q.category]}
            </span>
          </div>
          <h2 className="mb-2 text-base font-bold text-white">{q.title}</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{q.question}</p>

          {/* 問題画面の与条件図（解答情報を含まないニュートラルな図のみ） */}
          {ProblemFig ? <ProblemFig /> : null}

          {/* 選択肢 */}
          <div className="mt-4 space-y-2.5">
            {q.choices?.map((choice, idx) => {
              const isCorrect = idx === q.answer;
              const isSelected = idx === selected;
              let cls =
                "w-full flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition ";
              if (!isAnswered) {
                cls +=
                  "border-slate-700 bg-slate-950/40 text-slate-200 hover:scale-[1.01] hover:border-indigo-500/60 hover:bg-indigo-950/30";
              } else if (isCorrect) {
                cls += "border-emerald-500/60 bg-emerald-500/10 text-emerald-100";
              } else if (isSelected) {
                cls += "border-rose-500/60 bg-rose-500/10 text-rose-100";
              } else {
                cls += "border-slate-800 bg-slate-950/30 text-slate-400";
              }
              return (
                <button key={idx} onClick={() => handleAnswer(idx)} disabled={isAnswered} className={cls}>
                  <span
                    className={
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold " +
                      (isAnswered && isCorrect
                        ? "bg-emerald-500 text-white"
                        : isAnswered && isSelected
                        ? "bg-rose-500 text-white"
                        : "bg-slate-700 text-slate-200")
                    }
                  >
                    {isAnswered && isCorrect ? (
                      <Check className="h-4 w-4" />
                    ) : isAnswered && isSelected ? (
                      <X className="h-4 w-4" />
                    ) : (
                      CHOICE_MARKS[idx]
                    )}
                  </span>
                  <span className="whitespace-pre-wrap pt-0.5">{choice}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 解説エリア（解答後のみ展開） */}
        {isAnswered && ExplanationPanel({ q })}

        {isAnswered ? (
          <button
            onClick={goNext}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 py-3.5 font-bold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01]"
          >
            {currentIndex + 1 >= quizList.length ? "結果を見る" : "次の問題へ"}
            <ArrowRight className="h-5 w-5" />
          </button>
        ) : null}
      </div>
    );
  }

  function ExplanationPanel({ q }) {
    const correct = selected === q.answer;
    const isReview = progress?.reviews?.[q.id] === true;
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl">
        {/* 正誤 */}
        <div
          className={
            "mb-4 flex items-center gap-2 rounded-xl px-4 py-3 " +
            (correct ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200")
          }
        >
          {correct ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
          <span className="font-bold">{correct ? "正解！" : "不正解"}</span>
          <span className="ml-auto text-sm">正解：{CHOICE_MARKS[q.answer]}</span>
        </div>

        {/* 要復習チェックボックス */}
        <label className="mb-4 flex cursor-pointer items-center gap-3 rounded-xl border border-amber-700/40 bg-amber-500/5 px-4 py-3">
          <input
            type="checkbox"
            checked={isReview}
            onChange={() => toggleReview(q.id)}
            className="h-5 w-5 accent-amber-500"
          />
          <span className="text-sm font-medium text-amber-200">要復習リストに登録する</span>
        </label>

        {/* ここが重要 */}
        <div className="mb-4 rounded-xl border border-indigo-700/40 bg-indigo-950/30 p-4">
          <div className="mb-2 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-indigo-300" />
            <span className="text-sm font-bold text-indigo-200">ここが重要</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{q.kokoga}</p>
          {/* ここが重要に紐づく解説図（インラインSVG／テーブル） */}
          {q.figs?.map((key) => {
            const Fig = FIGURES[key];
            return Fig ? <Fig key={key} /> : null;
          })}
        </div>

        {/* 解説本文（各選択肢の正誤・計算の整合性） */}
        <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-4">
          <div className="mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-sky-300" />
            <span className="text-sm font-bold text-sky-200">解説</span>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{q.kaisetsu}</p>
        </div>
      </div>
    );
  }

  function ResultScreen() {
    const hist = progress?.history || {};
    const correctCount = quizList.filter((q) => hist?.[q.id]?.correct === true).length;
    const rate = quizList.length > 0 ? Math.round((correctCount / quizList.length) * 100) : 0;
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-900/40 to-sky-900/20 p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-500 shadow-lg">
            <BarChart2 className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">全問完走しました！</h2>
          <p className="mt-2 text-sm text-slate-300">{MODE_LABELS[mode]}</p>
          <p className="mt-4 text-4xl font-bold text-white">
            {correctCount}
            <span className="text-lg text-slate-400"> / {quizList.length} 正解</span>
          </p>
          <p className="mt-1 text-sm text-indigo-300">正答率 {rate}%</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setScreen("dashboard")}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900/70 py-3 font-bold text-slate-200 transition hover:bg-slate-800"
          >
            <Home className="h-5 w-5" /> ホームへ
          </button>
          <button
            onClick={() => startQuiz(mode, 0)}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 py-3 font-bold text-white transition hover:scale-[1.01]"
          >
            <RefreshCw className="h-5 w-5" /> もう一度
          </button>
        </div>
      </div>
    );
  }

  function ResumeModal() {
    const p = pendingProgress || progress;
    const idx = Number(p?.progressIndex || 0);
    const m = p?.progressMode || "all";
    // 表示用の問題番号（再構築リスト上のインデックスに対応する問題ID）
    const list = buildList(m, p);
    const targetQ = list?.[Math.min(idx, Math.max(list.length - 1, 0))];
    const displayNo = targetQ ? targetQ.id : idx + 1;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-sky-500">
              <RefreshCw className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-bold text-white">途中再開</h3>
          </div>
          <p className="mb-6 text-sm leading-relaxed text-slate-300">
            前回は【問題{displayNo}】まで進んでいます。<br />
            中断したモード（<span className="font-bold text-indigo-300">{MODE_LABELS[m]}</span>
            ）の続きから再開しますか？
          </p>
          <div className="space-y-3">
            <button
              onClick={handleResume}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 py-3 font-bold text-white transition hover:scale-[1.01]"
            >
              続きから再開する
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={handleRestart}
              className="w-full rounded-xl border border-slate-700 bg-slate-950/50 py-3 font-bold text-slate-300 transition hover:bg-slate-800"
            >
              最初から始める
            </button>
          </div>
        </div>
      </div>
    );
  }
}