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
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

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
const APP_ID = "QuizApp_3_6_Past_Exams_001";

// Firebase初期化（多重初期化・設定欠如でクラッシュしないよう防衛的に）
let app = null;
let auth = null;
let db = null;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (e) {
  console.error("[Firebase] 初期化に失敗しました（LocalStorageへフォールバックします）:", e);
}

const TITLE = "過去問セレクト演習 3-6 生産のオペレーション";
const SUBTITLE = "3-6 生産のオペレーション";
const CHOICE_LABELS = ["ア", "イ", "ウ", "エ", "オ"];

// 2大カテゴリ（学習指標・レーダーチャート用）
const CAT_QC = "品質管理";
const CAT_EQUIP = "設備・生産管理";

// ===================================================================
// 図表（外部画像URLは一切使わず、インラインSVG / テーブルで100%内製化）
//   トンマナ：スレート＆インディゴ／スカイのダークモードに最適化しつつ、
//   軸ラベル・与条件・数値は1つも省略せずマッピングする。
// ===================================================================

// 共通：図表カードラッパ（横スクロール対応）
const FigCard = ({ children, label }) => (
  <div className="my-4 overflow-x-auto rounded-xl border border-slate-700 bg-slate-950/60 p-3">
    {label ? (
      <div className="mb-2 text-center text-xs font-semibold tracking-wider text-sky-300">
        {label}
      </div>
    ) : null}
    <div className="flex min-w-fit justify-center">{children}</div>
  </div>
);

// -------------------------------------------------------------------
// ◆管理図（QC7つ道具）
// -------------------------------------------------------------------
const ControlChart = () => {
  const pts = [
    [150, 140], [168, 158], [186, 184], [204, 150], [222, 164],
    [240, 178], [258, 150], [276, 134], [294, 158], [312, 90],
    [330, 120], [348, 116], [366, 198], [384, 150], [402, 158],
  ];
  const poly = pts.map((p) => p.join(",")).join(" ");
  return (
    <svg viewBox="0 0 560 300" width="100%" style={{ maxWidth: 560 }} role="img" aria-label="管理図">
      <text x="280" y="28" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="700">◆管理図</text>
      {/* 軸 */}
      <line x1="120" y1="50" x2="120" y2="250" stroke="#cbd5e1" strokeWidth="2" />
      <polygon points="120,44 115,56 125,56" fill="#cbd5e1" />
      <line x1="120" y1="250" x2="515" y2="250" stroke="#cbd5e1" strokeWidth="2" />
      <polygon points="521,250 509,245 509,255" fill="#cbd5e1" />
      <text x="520" y="272" textAnchor="end" fill="#cbd5e1" fontSize="13" fontWeight="700">時間</text>
      {/* 管理限界線・中心線 */}
      <line x1="125" y1="100" x2="500" y2="100" stroke="#ef4444" strokeWidth="1.6" strokeDasharray="4 4" />
      <text x="112" y="104" textAnchor="end" fill="#f87171" fontSize="11">上方管理限界線</text>
      <line x1="125" y1="160" x2="500" y2="160" stroke="#0ea5e9" strokeWidth="1.6" strokeDasharray="4 4" />
      <text x="112" y="164" textAnchor="end" fill="#7dd3fc" fontSize="11">中心線</text>
      <line x1="125" y1="215" x2="500" y2="215" stroke="#ef4444" strokeWidth="1.6" strokeDasharray="4 4" />
      <text x="112" y="219" textAnchor="end" fill="#f87171" fontSize="11">下方管理限界線</text>
      {/* データ折れ線 */}
      <polyline points={poly} fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="2.6" fill="#38bdf8" />
      ))}
      {/* 異常値 */}
      <rect x="400" y="60" width="64" height="22" rx="3" fill="#b91c1c" />
      <text x="432" y="75" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="700">異常値</text>
      <line x1="400" y1="78" x2="318" y2="92" stroke="#cbd5e1" strokeWidth="1.2" />
      <polygon points="312,90 322,88 320,98" fill="#cbd5e1" />
    </svg>
  );
};

// -------------------------------------------------------------------
// ◆特性要因図（フィッシュボーン）
// -------------------------------------------------------------------
const CauseEffect = () => {
  const Big = ({ x, y, label }) => (
    <g>
      <rect x={x - 38} y={y - 14} width="76" height="28" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1.4" />
      <text x={x} y={y + 5} textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="700">{label}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 640 300" width="100%" style={{ maxWidth: 640 }} role="img" aria-label="特性要因図">
      <text x="320" y="26" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="700">◆特性要因図</text>
      {/* 背骨 */}
      <line x1="40" y1="160" x2="520" y2="160" stroke="#cbd5e1" strokeWidth="2.4" />
      {/* 特性ボックス */}
      <rect x="522" y="142" width="96" height="36" rx="4" fill="#3f2a1e" stroke="#f59e0b" strokeWidth="1.4" />
      <text x="570" y="165" textAnchor="middle" fill="#fed7aa" fontSize="14" fontWeight="700">特性</text>
      {/* 大骨（左ノード） */}
      <line x1="240" y1="160" x2="160" y2="78" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="240" y1="160" x2="160" y2="242" stroke="#cbd5e1" strokeWidth="2" />
      <Big x={160} y={62} label="要因(大)" />
      <Big x={160} y={258} label="要因(大)" />
      {/* 大骨（右ノード） */}
      <line x1="430" y1="160" x2="350" y2="78" stroke="#cbd5e1" strokeWidth="2" />
      <line x1="430" y1="160" x2="350" y2="242" stroke="#cbd5e1" strokeWidth="2" />
      <Big x={350} y={62} label="要因(大)" />
      <Big x={350} y={258} label="要因(大)" />
      {/* 小骨ラベル（要因(小)×8） */}
      {[
        [120, 120], [205, 120], [120, 208], [205, 208],
        [310, 120], [395, 120], [310, 208], [395, 208],
      ].map((p, i) => (
        <g key={i}>
          <text x={p[0]} y={p[1]} textAnchor="middle" fill="#cbd5e1" fontSize="10">要因(小)</text>
          <line x1={p[0] - 18} y1={p[1] + 6} x2={p[0] + 18} y2={p[1] + 6} stroke="#94a3b8" strokeWidth="1" />
          <polygon points={`${p[0] + 18},${p[1] + 6} ${p[0] + 11},${p[1] + 3} ${p[0] + 11},${p[1] + 9}`} fill="#94a3b8" />
        </g>
      ))}
    </svg>
  );
};

// -------------------------------------------------------------------
// ◆パレート図（降順の棒＋累積曲線）
// -------------------------------------------------------------------
const ParetoChart = () => {
  const heights = [150, 95, 75, 60, 48, 36, 26, 18, 10];
  const labels = ["A", "B", "C", "D", "E", "F", "G", "H", "…"];
  const bw = 38;
  const x0 = 95;
  const base = 260;
  // 累積曲線（合計に対する累積比率を 100%（y=70）〜0%（y=255）にマップ）
  const total = heights.reduce((a, b) => a + b, 0);
  let acc = 0;
  const curve = heights.map((h, i) => {
    acc += h;
    const cx = x0 + i * bw + bw / 2;
    const cy = 255 - (acc / total) * (255 - 70);
    return [cx, cy];
  });
  const curvePath = curve.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(" ");
  return (
    <svg viewBox="0 0 520 320" width="100%" style={{ maxWidth: 520 }} role="img" aria-label="パレート図">
      <text x="260" y="26" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="700">◆パレート図</text>
      {/* 軸 */}
      <line x1="90" y1="45" x2="90" y2="260" stroke="#cbd5e1" strokeWidth="2" />
      <polygon points="90,39 85,51 95,51" fill="#cbd5e1" />
      <line x1="90" y1="260" x2="490" y2="260" stroke="#cbd5e1" strokeWidth="2" />
      <polygon points="496,260 484,255 484,265" fill="#cbd5e1" />
      <text x="488" y="282" textAnchor="end" fill="#cbd5e1" fontSize="13" fontWeight="700">項目</text>
      {/* 100% / 0% */}
      <line x1="90" y1="70" x2="470" y2="70" stroke="#0ea5e9" strokeWidth="1.2" strokeDasharray="4 4" />
      <text x="82" y="74" textAnchor="end" fill="#7dd3fc" fontSize="12" fontWeight="700">100%</text>
      <text x="82" y="258" textAnchor="end" fill="#7dd3fc" fontSize="12" fontWeight="700">0%</text>
      <line x1="470" y1="70" x2="470" y2="260" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="3 3" />
      {/* 棒 */}
      {heights.map((h, i) => (
        <rect key={i} x={x0 + i * bw} y={base - h} width={bw - 4} height={h} fill="#fdf6e3" fillOpacity="0.12" stroke="#fcd34d" strokeWidth="1.2" />
      ))}
      {labels.map((l, i) => (
        <text key={i} x={x0 + i * bw + (bw - 4) / 2} y="276" textAnchor="middle" fill="#cbd5e1" fontSize="11">{l}</text>
      ))}
      {/* 累積曲線 */}
      <path d={curvePath} fill="none" stroke="#ef4444" strokeWidth="2.6" strokeLinejoin="round" />
    </svg>
  );
};

// -------------------------------------------------------------------
// ◆ヒストグラム
// -------------------------------------------------------------------
const Histogram = () => {
  const data = [
    [50, 30], [51, 70], [52, 120], [53, 150], [54, 180], [55, 205],
    [56, 170], [57, 130], [58, 80], [59, 35], [60, 18],
  ];
  const bw = 38;
  const x0 = 75;
  const base = 260;
  return (
    <svg viewBox="0 0 560 320" width="100%" style={{ maxWidth: 560 }} role="img" aria-label="ヒストグラム">
      <text x="300" y="26" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="700">◆ヒストグラム</text>
      <line x1="70" y1="45" x2="70" y2="260" stroke="#cbd5e1" strokeWidth="2" />
      <polygon points="70,39 65,51 75,51" fill="#cbd5e1" />
      <text x="58" y="52" textAnchor="end" fill="#cbd5e1" fontSize="12" fontWeight="700">度数</text>
      <line x1="70" y1="260" x2="530" y2="260" stroke="#cbd5e1" strokeWidth="2" />
      <polygon points="536,260 524,255 524,265" fill="#cbd5e1" />
      <text x="528" y="282" textAnchor="end" fill="#cbd5e1" fontSize="13" fontWeight="700">重量</text>
      {data.map(([lab, h], i) => (
        <rect key={i} x={x0 + i * bw} y={base - h} width={bw} height={h} fill="#fdf6e3" fillOpacity="0.12" stroke="#fcd34d" strokeWidth="1.2" />
      ))}
      {data.map(([lab], i) => (
        <text key={i} x={x0 + i * bw + bw / 2} y="276" textAnchor="middle" fill="#cbd5e1" fontSize="11">{lab}</text>
      ))}
    </svg>
  );
};

// -------------------------------------------------------------------
// ◆散布図（正の相関）
// -------------------------------------------------------------------
const ScatterPlot = () => {
  const pts = [
    [150, 215], [175, 200], [195, 185], [210, 205], [225, 165],
    [245, 180], [255, 150], [270, 170], [285, 140], [300, 160],
    [315, 130], [330, 150], [350, 120], [365, 138], [385, 110], [400, 95],
  ];
  return (
    <svg viewBox="0 0 520 300" width="100%" style={{ maxWidth: 520 }} role="img" aria-label="散布図">
      <text x="260" y="26" textAnchor="middle" fill="#e2e8f0" fontSize="18" fontWeight="700">◆散布図</text>
      <line x1="70" y1="40" x2="70" y2="250" stroke="#cbd5e1" strokeWidth="2" />
      <polygon points="70,34 65,46 75,46" fill="#cbd5e1" />
      <text x="58" y="46" textAnchor="end" fill="#cbd5e1" fontSize="13" fontWeight="700">Y</text>
      <line x1="70" y1="250" x2="480" y2="250" stroke="#cbd5e1" strokeWidth="2" />
      <polygon points="486,250 474,245 474,255" fill="#cbd5e1" />
      <text x="478" y="272" textAnchor="end" fill="#cbd5e1" fontSize="13" fontWeight="700">X</text>
      {/* 相関を示す点線楕円 */}
      <ellipse cx="278" cy="160" rx="155" ry="48" fill="none" stroke="#38bdf8" strokeWidth="1.6" strokeDasharray="3 4" transform="rotate(-26 278 160)" />
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="4.5" fill="#dc2626" />
      ))}
      <text x="400" y="205" textAnchor="middle" fill="#7dd3fc" fontSize="12" fontWeight="700">正の相関</text>
    </svg>
  );
};

// -------------------------------------------------------------------
// 設備A・Bの稼働／故障修復タイムライン（問題6の与条件＝答えは含まない）
//   ※ MTBF/MTTR/可用率といった「解答」は描かず、中立な調査結果のみ表示。
// -------------------------------------------------------------------
const EquipmentTimeline = () => {
  const X0 = 70;
  const SCALE = (970 - X0) / 240; // 240時間を 70〜970px へ
  const tx = (t) => X0 + t * SCALE;
  // [開始, 終了, 種別]
  const segA = [
    [0, 40, "run"], [40, 70, "fix"], [70, 120, "run"], [120, 130, "fix"],
    [130, 180, "run"], [180, 200, "fix"], [200, 240, "run"],
  ];
  const segB = [
    [0, 20, "run"], [20, 30, "fix"], [30, 80, "run"], [80, 90, "fix"],
    [90, 170, "run"], [170, 190, "fix"], [190, 240, "run"],
  ];
  const ticks = [];
  for (let t = 0; t <= 240; t += 10) ticks.push(t);
  const Bar = ({ seg, y }) =>
    seg.map(([s, e, type], i) => {
      const fill = type === "run" ? "#0c4a6e" : "#7f1d1d";
      const stroke = type === "run" ? "#38bdf8" : "#f87171";
      const txt = type === "run" ? "稼働" : "修復";
      const tcol = type === "run" ? "#e0f2fe" : "#fecaca";
      const w = (e - s) * SCALE;
      return (
        <g key={i}>
          <rect x={tx(s)} y={y} width={w} height="30" fill={fill} stroke={stroke} strokeWidth="1.2" />
          {w > 26 ? (
            <text x={tx(s) + w / 2} y={y + 20} textAnchor="middle" fill={tcol} fontSize="12" fontWeight="700">{txt}</text>
          ) : null}
        </g>
      );
    });
  return (
    <svg viewBox="0 0 1000 210" width="100%" style={{ maxWidth: 1000 }} role="img" aria-label="設備AとBの稼働・故障修復タイムライン">
      {/* 時間目盛 */}
      {ticks.map((t) => (
        <g key={t}>
          <line x1={tx(t)} y1="38" x2={tx(t)} y2="44" stroke="#64748b" strokeWidth="1" />
          <text x={tx(t)} y="30" textAnchor="middle" fill="#94a3b8" fontSize="10">{t}</text>
        </g>
      ))}
      <line x1={X0} y1="44" x2={tx(240)} y2="44" stroke="#475569" strokeWidth="1" />
      {/* 設備A */}
      <text x="14" y="78" fill="#e2e8f0" fontSize="13" fontWeight="700">設備A</text>
      <Bar seg={segA} y={62} />
      {/* 設備B */}
      <text x="14" y="138" fill="#e2e8f0" fontSize="13" fontWeight="700">設備B</text>
      <Bar seg={segB} y={122} />
      {/* 凡例 */}
      <rect x={X0} y="178" width="18" height="14" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1" />
      <text x={X0 + 24} y="190" fill="#cbd5e1" fontSize="11">稼働</text>
      <rect x={X0 + 80} y="178" width="18" height="14" fill="#7f1d1d" stroke="#f87171" strokeWidth="1" />
      <text x={X0 + 104} y="190" fill="#cbd5e1" fontSize="11">修復</text>
      <text x={tx(240)} y="190" textAnchor="end" fill="#94a3b8" fontSize="11">単位：時間（0〜240）</text>
    </svg>
  );
};

// -------------------------------------------------------------------
// 設備A・Bの評価指標 計算表（問題6の解答・解説でのみ表示）
// -------------------------------------------------------------------
const EquipmentMetricsTable = () => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px] border-collapse text-center text-xs text-slate-100 md:text-sm">
      <thead>
        <tr className="bg-slate-800/70 text-slate-200">
          <th className="border border-slate-700 px-2 py-2"></th>
          <th className="border border-slate-700 px-2 py-2">①稼働時間</th>
          <th className="border border-slate-700 px-2 py-2">②修復時間</th>
          <th className="border border-slate-700 px-2 py-2">③故障回数</th>
          <th className="border border-slate-700 px-2 py-2">MTBF<br />（平均故障間隔）<br />①÷③</th>
          <th className="border border-slate-700 px-2 py-2">MTTR<br />（平均修復時間）<br />②÷③</th>
          <th className="border border-slate-700 px-2 py-2">アベイラビリティ<br />（可用率）<br />①÷（①＋②）</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-slate-700 bg-slate-800/40 px-2 py-2 font-bold">設備A</td>
          <td className="border border-slate-700 px-2 py-2">180</td>
          <td className="border border-slate-700 px-2 py-2">60</td>
          <td className="border border-slate-700 px-2 py-2">3</td>
          <td className="border border-slate-700 px-2 py-2">60</td>
          <td className="border border-slate-700 px-2 py-2">20</td>
          <td className="border border-slate-700 px-2 py-2">75.0%</td>
        </tr>
        <tr>
          <td className="border border-slate-700 bg-slate-800/40 px-2 py-2 font-bold">設備B</td>
          <td className="border border-slate-700 px-2 py-2">200</td>
          <td className="border border-slate-700 px-2 py-2">40</td>
          <td className="border border-slate-700 px-2 py-2">3</td>
          <td className="border border-slate-700 px-2 py-2">66.66…</td>
          <td className="border border-slate-700 px-2 py-2">13.33…</td>
          <td className="border border-slate-700 px-2 py-2">83.3%</td>
        </tr>
      </tbody>
    </table>
  </div>
);

// -------------------------------------------------------------------
// ◆保全活動 体系図（ツリー）
// -------------------------------------------------------------------
const MaintenanceTree = () => {
  const Node = ({ x, y, w, label, leaf }) => (
    <g>
      <rect x={x} y={y} width={w} height="34" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1.3" />
      <text x={x + w / 2} y={y + 22} textAnchor="middle" fill={leaf ? "#f87171" : "#e2e8f0"} fontSize="14" fontWeight="700">{label}</text>
    </g>
  );
  return (
    <svg viewBox="0 0 720 320" width="100%" style={{ maxWidth: 720 }} role="img" aria-label="保全活動の体系図">
      <text x="360" y="24" textAnchor="middle" fill="#e2e8f0" fontSize="17" fontWeight="700">◆保全活動</text>
      {/* 接続線 */}
      <line x1="170" y1="160" x2="210" y2="160" stroke="#94a3b8" strokeWidth="1.6" />
      <line x1="210" y1="90" x2="210" y2="230" stroke="#94a3b8" strokeWidth="1.6" />
      <line x1="210" y1="90" x2="260" y2="90" stroke="#94a3b8" strokeWidth="1.6" />
      <line x1="210" y1="230" x2="260" y2="230" stroke="#94a3b8" strokeWidth="1.6" />
      {/* 維持活動 → 予防保全 / 事後保全 */}
      <line x1="420" y1="90" x2="460" y2="90" stroke="#94a3b8" strokeWidth="1.6" />
      <line x1="460" y1="55" x2="460" y2="125" stroke="#94a3b8" strokeWidth="1.6" />
      <line x1="460" y1="55" x2="510" y2="55" stroke="#94a3b8" strokeWidth="1.6" />
      <line x1="460" y1="125" x2="510" y2="125" stroke="#94a3b8" strokeWidth="1.6" />
      {/* 改善活動 → 改良保全 / 保全予防 */}
      <line x1="420" y1="230" x2="460" y2="230" stroke="#94a3b8" strokeWidth="1.6" />
      <line x1="460" y1="195" x2="460" y2="265" stroke="#94a3b8" strokeWidth="1.6" />
      <line x1="460" y1="195" x2="510" y2="195" stroke="#94a3b8" strokeWidth="1.6" />
      <line x1="460" y1="265" x2="510" y2="265" stroke="#94a3b8" strokeWidth="1.6" />
      {/* ノード */}
      <Node x={30} y={143} w={140} label="保全活動" />
      <Node x={260} y={73} w={160} label="維持活動" />
      <Node x={260} y={213} w={160} label="改善活動" />
      <Node x={510} y={38} w={160} label="予防保全" leaf />
      <Node x={510} y={108} w={160} label="事後保全" leaf />
      <Node x={510} y={178} w={160} label="改良保全" leaf />
      <Node x={510} y={248} w={160} label="保全予防" leaf />
    </svg>
  );
};

// -------------------------------------------------------------------
// 図表ディスパッチャ（name → 図表コンポーネント）
// -------------------------------------------------------------------
const Figure = ({ name }) => {
  switch (name) {
    case "control_chart":
      return <FigCard label="QC7つ道具：管理図"><ControlChart /></FigCard>;
    case "cause_effect":
      return <FigCard label="QC7つ道具：特性要因図"><CauseEffect /></FigCard>;
    case "pareto":
      return <FigCard label="QC7つ道具：パレート図"><ParetoChart /></FigCard>;
    case "histogram":
      return <FigCard label="QC7つ道具：ヒストグラム"><Histogram /></FigCard>;
    case "scatter":
      return <FigCard label="QC7つ道具：散布図"><ScatterPlot /></FigCard>;
    case "equipment_timeline":
      return <FigCard label="設備AとBの稼働・故障修復の調査結果（0〜240時間）"><EquipmentTimeline /></FigCard>;
    case "equipment_metrics":
      return <FigCard label="設備AとBの評価指標（計算結果）"><EquipmentMetricsTable /></FigCard>;
    case "maintenance_tree":
      return <FigCard label="保全活動の体系"><MaintenanceTree /></FigCard>;
    default:
      return null;
  }
};

// ===================================================================
// 問題データ（全10問・ノンカット収録：問題文／選択肢／正解／解説フルテキスト）
//   answer: 0始まりのインデックス（CHOICE_LABELS = ア,イ,ウ,エ,オ）
//   figure: 問題画面に表示する与条件図（解答情報を含まないもののみ）
//   explanation: ブロック配列 { t:'p'|'fig'|'key', x }
// ===================================================================
const QUESTIONS = [
  {
    id: "q1",
    no: 1,
    topic: "QC7つ道具",
    category: CAT_QC,
    exam: "令和元年　第11問",
    question: "QC7つ道具に関する記述として、最も適切なものはどれか。",
    choices: [
      "管理図は、2つの対になったデータをXY軸上に表した図である。",
      "特性要因図は、原因と結果の関係を魚の骨のように表した図である。",
      "パレート図は、不適合の原因を発生件数の昇順に並べた図である。",
      "ヒストグラムは、時系列データを折れ線グラフで表した図である。",
    ],
    answer: 1,
    explanation: [
      { t: "p", x: "本問は、QC７つ道具に関する問題です。\nでは、選択肢を見ていきましょう。" },
      { t: "p", x: "選択肢アですが、管理図は２つの対になったデータではなく、観測した個々のデータを表したグラフです。従って、不適切な記述です。" },
      { t: "fig", x: "control_chart" },
      { t: "p", x: "選択肢イですが、特性要因図は、以下のグラフのように原因（要因）と結果（特性）の関係を魚の骨のように表わすことで、複合的な要因を整理する手法です。従って、適切な記述です。" },
      { t: "fig", x: "cause_effect" },
      { t: "p", x: "選択肢ウですが、パレート図は、不適合の原因を発生件数の昇順ではなく、降順で並べた図です。" },
      { t: "fig", x: "pareto" },
      { t: "p", x: "選択肢エですが、時系列データを折れ線グラフではなく、棒グラフで表した図です。従って、不適切な記述です。" },
      { t: "fig", x: "histogram" },
    ],
  },
  {
    id: "q2",
    no: 2,
    topic: "QC7つ道具と新QC7つ道具",
    category: CAT_QC,
    exam: "令和4年　第11問",
    question: "QC7つ道具と新QC7つ道具に関する記述として、最も適切なものはどれか。",
    choices: [
      "管理図は、時系列データをヒストグラムで表した図である。",
      "散布図は、不具合を原因別に集計し、件数が多い順に並べた図である。",
      "特性要因図は、原因と結果、目的と手段などが複雑に絡み合った問題の因果関係を表した図である。",
      "パレート図は、項目別に層別して出現頻度の高い順に並べるとともに、累積和を表した図である。",
      "連関図は、原因と結果の関係を魚の骨のように表した図である。",
    ],
    answer: 3,
    explanation: [
      { t: "p", x: "QC7つ道具と新QC7つ道具に関する出題です。各ツールの特徴について、基本的な内容が問われています。" },
      { t: "p", x: "QC7つ道具は、品質の改善活動をするための手法を7つ集めたものです。品質を向上させるための数値データを使った分析が中心で、①管理図、②パレート図、③ヒストグラム、④散布図、⑤特性要因図、⑥チェックシート、⑦層別があります。" },
      { t: "p", x: "新QC7つ道具は、言語データを使って情報を整理し、発想を導くための手法を7つにまとめたものです。新QC7つ道具には、①親和図法、②連関図法、③系統図法、④マトリックス図法、⑤マトリックスデータ解析法、⑥PDPC法、⑦アロー・ダイヤグラム法があります。" },
      { t: "p", x: "では、選択肢を見ていきましょう。" },
      { t: "p", x: "選択肢アは不適切な記述です。管理図は、測定した値を折れ線グラフにした図です。測定値が異常かどうかを判別するために、上下に管理限界線が引かれており、製品や工程が基準（管理限界線）から外れていないかを継続的に管理する目的で使用されます。ヒストグラムで表した図ではありません。" },
      { t: "fig", x: "control_chart" },
      { t: "p", x: "選択肢イは不適切な記述です。本肢はパレート図の説明です。散布図とは、2つの特性をX軸とY軸に取り、データを点でプロットしたものです。散布図は、2つの特性の間の相関関係を把握するために使うことができます。" },
      { t: "fig", x: "scatter" },
      { t: "p", x: "選択肢ウは不適切な記述です。本肢は連関図法の説明です。特性要因図とは、ある特性とそれをもたらす様々な要因の関係を図で表したものです。例えば、品質が悪いという問題に対して、その原因となっている要因を魚の骨のような形で記入していきます。" },
      { t: "fig", x: "cause_effect" },
      { t: "p", x: "選択肢エは適切な記述です。パレート図は、項目別に不良数などの件数を数えて、多い順に並べたグラフです。出現頻度の高い順に並べるとともに累積和を表します。" },
      { t: "fig", x: "pareto" },
      { t: "p", x: "選択肢オは不適切な記述です。本肢は特性要因図の説明です。連関図とは、原因と結果、目的と手段が絡みあった問題について、関係を明確にする手法です。原因と結果、目的と手段などをカード等に記入し、それらの関係を線で結ぶことで因果関係などを明確にします。" },
      { t: "key", x: "QC7つ道具については過去の本試験で度々出題されています。それぞれ7つ道具の特徴について理解を深めておきましょう。" },
    ],
  },
  {
    id: "q3",
    no: 3,
    topic: "設計・製造段階における品質",
    category: CAT_QC,
    exam: "平成25年　第5問",
    question: "設計・製造段階における品質に関する記述として、最も適切なものはどれか。",
    choices: [
      "製造品質は、製造段階で責任を持つべき品質であり、｢ねらいの品質｣と呼ばれている。",
      "設計品質は、品質特性に対する品質目標であり、｢できばえの品質｣と呼ばれている。",
      "代用特性は、品質特性を直接測定することが困難な場合に、その代わりとして用いられる特性である。",
      "品質特性は、顧客の要求をそのまま表現した特性であり、製品価格もその1つである。",
    ],
    answer: 2,
    explanation: [
      { t: "p", x: "品質管理の種類と品質特性に関する問題です。\n品質管理の種類と品質特性の概要を押さえていれば、正解できる問題です。" },
      { t: "p", x: "まず、品質管理の種類と、品質特性について復習しましょう。" },
      { t: "p", x: "■「品質管理の種類」と「品質特性」" },
      { t: "p", x: "品質管理の種類には、「設計品質」と「製造品質」の2種類があります。「設計品質」は「ねらいの品質」とも呼ばれ、顧客の要求を満たすために目標として設定した品質のことです。「製造品質」は「結果の品質」と呼ばれ、製品の製造時に結果として生じた品質のことです。" },
      { t: "p", x: "品質特性とは、製造した部品や製品が本来持っている特性のことで、「実用特性」と「代用特性」とに大別されます。「実用特性」（真の特性）とは、顧客が求める品質特性そのもののことで、具体的な測定方法と数値で表現できます。「代用特性」とは、主観的な品質で数値化できない特性や、破壊を伴ったり、測定が困難な特性について、代用として用いたりする品質特性のことです。" },
      { t: "p", x: "それでは選択肢を見ていきましょう。" },
      { t: "p", x: "選択肢アについて、「製造品質」は、製品の製造時に結果として生じる品質であるため「結果の品質」あるいは「できばえの品質」と呼ばれます。「ねらいの品質」とは、「設計品質」のことです。よって選択肢アは不適切です。" },
      { t: "p", x: "選択肢イについて、「設計品質」は、顧客の要求を満たすために目標として設定した品質のことであり「ねらいの品質」と呼ばれます。「できばえの品質」とは、「製造品質」のことです。よって選択肢イは不適切です。" },
      { t: "p", x: "選択肢ウについて、「代用特性」とは、「顧客が求める品質特性を直接測定することが困難な場合に、その代用として用いる他の品質特性」のことです。よって選択肢ウは適切で、正解です。" },
      { t: "p", x: "選択肢エについて、「品質特性」とは、製品が本来備えている特性で、その値が許容値から外れた場合は不適合品と判断される特性のことです。例えば、ボールペンの品質特性は、線の太さ、色、耐久性などとなります。製品価格は、複数の要素から決定される対価であり、製品に本来備わっている性質とはいえません。よって選択肢エは不適切です。" },
    ],
  },
  {
    id: "q4",
    no: 4,
    topic: "TQMの3つの原則",
    category: CAT_QC,
    exam: "平成25年　第13問",
    question:
      "TQM（総合的品質管理）の原則は、以下の3つに大別される。\n① 目的に関する原則\n② 手段に関する原則\n③ 目的の達成と手段の実践を支える組織の運営に関する原則\nこのうちの｢②手段に関する原則｣に当てはまるものの組み合わせとして、最も適切なものはどれか。",
    choices: [
      "源流管理、再発防止、事実に基づく管理。",
      "潜在トラブルの顕在化、QCD結果に基づく管理、教育・訓練の重視。",
      "品質第一、重点志向、標準化。",
      "マーケットイン、プロセス重視、未然防止。",
    ],
    answer: 0,
    explanation: [
      { t: "p", x: "TQM（総合的品質管理）に関する問題です。\nTQMの3つの原則について、それぞれの特徴を覚えていれば、正解できる問題です。" },
      { t: "p", x: "まずは、TQMの3つの原則について簡単に復習しましょう。" },
      { t: "p", x: "■ TQMの3つの原則" },
      { t: "p", x: "TQMには、「目的に関する原則」、「手段に関する原則」、「組織の運営に関する原則」、の3つがあります。" },
      { t: "p", x: "「目的に関する原則」は、顧客視点に立つことを重視した3つの考え方で構成されています。例えば、品質第一、後工程はお客様、マーケットイン、といったものがあります。" },
      { t: "p", x: "「手段に関する原則」は、実際に活動を進めるための具体的な手法や注意点、管理方法に関する10の考え方で構成されています。例えば、プロセス重視、事実に基づく管理、再発防止、といったものがあります。" },
      { t: "p", x: "「組織の運営に関する原則」は、人に関する内容で、各人の役割や心構え、人材の開発・育成に関する4つの考え方で構成されています。例えば、リーダーシップ、人間性尊重、教育・訓練の重視、といったものがあります。" },
      { t: "p", x: "それでは選択肢を見ていきましょう。" },
      { t: "p", x: "選択肢アについて、記述してある考え方は全て、活動を進める手法や注意点、管理方法に関する考え方で、「手段に関する原則」に含まれる内容です。よって選択肢アは適切で、正解です。" },
      { t: "p", x: "選択肢イについて、「潜在トラブルの顕在化」と「QCD結果に基づく管理」の考え方は、「手段に関する原則」に含まれる内容です。但し、「教育・訓練の重視」は人に関する考え方で、「目的の達成と手段の実践を支える組織の運営に関する原則」に含まれる内容です。よって選択肢イは不適切です。" },
      { t: "p", x: "選択肢ウについて、「品質第一」は顧客視点に立つことを重視する考え方で、「目的に関する原則」に含まれる内容です。よって選択肢ウは不適切です。なお、「重点志向」と｢標準化」の考え方は「手段に関する原則」に含まれる内容です。" },
      { t: "p", x: "選択肢エについて、「マーケットイン」は、顧客視点に立つことを重視する考え方で「目的に関する原則」に含まれる内容です。よって選択肢エは不適切です。なお、「プロセス重視」と「未然防止」の考え方は「手段に関する原則」に含まれる内容です。" },
      { t: "key", x: "3つの原則のそれぞれの特徴を押さえておきましょう。" },
    ],
  },
  {
    id: "q5",
    no: 5,
    topic: "設備総合効率",
    category: CAT_EQUIP,
    exam: "令和2年　第20問",
    question: "設備総合効率に関する記述として、最も適切なものはどれか。",
    choices: [
      "作業方法を変更して段取時間を短縮すると、性能稼働率が向上する。",
      "設備の立ち上げ時間を短縮すると、時間稼働率が低下する。",
      "チョコ停の総時間を削減すると、性能稼働率が向上する。",
      "不適合率を改善すると、性能稼働率が低下する。",
    ],
    answer: 2,
    explanation: [
      { t: "p", x: "設備総合効率に関する問題です。\nまず、以下の式を確認しておきましょう。" },
      { t: "key", x: "設備総合効率＝時間稼働率×性能稼働率×良品率\n時間稼働率＝（負荷時間－停止時間）/負荷時間×100（％）\n性能稼働率＝（基準サイクルタイム×加工数量）/稼働時間×100（％）\n良品率＝（加工数量－不良数量）/加工数量×100（％）" },
      { t: "p", x: "選択肢アですが、段取時間を短縮すると停止時間が減るため、性能稼働率ではなく、時間稼働率が向上します。したがって、不適切な記述です。" },
      { t: "p", x: "選択肢イですが、設備の立ち上げ時間を短縮すると、停止時間が減るため時間稼働率が向上します。したがって、不適切な記述です。" },
      { t: "p", x: "選択肢ウですが、チョコ停とは、設備がトラブルにより一時的に停止する現象です。チョコ停の総時間を削減すると、性能稼働率が向上します。したがって、適切な記述です。" },
      { t: "p", x: "選択肢エですが、不適合率を改善すると良品率が向上します。したがって、不適切な記述です。" },
    ],
  },
  {
    id: "q6",
    no: 6,
    topic: "設備の故障（信頼性・保全性）",
    category: CAT_EQUIP,
    exam: "令和3年　第19問",
    question:
      "初期導入された設備AとBを240時間利用したときの稼働および故障修復について、下図のような調査結果が得られた。この2台の設備に関する記述a〜cの正誤の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\nａ　MTBF（平均故障間隔）は設備Ｂのほうが長い。\nｂ　MTTR（平均修復時間）は設備Ｂのほうが長い。\nｃ　アベイラビリティ（可用率）は設備Ｂのほうが高い。\n\n〔解答群〕",
    figure: "equipment_timeline",
    choices: [
      "ａ：正　　ｂ：正　　ｃ：誤",
      "ａ：正　　ｂ：誤　　ｃ：正",
      "ａ：正　　ｂ：誤　　ｃ：誤",
      "ａ：誤　　ｂ：正　　ｃ：正",
      "ａ：誤　　ｂ：正　　ｃ：誤",
    ],
    answer: 1,
    explanation: [
      { t: "p", x: "設備の故障に関する出題です。設備の稼働と故障の状況を図表から読み取ります。" },
      { t: "p", x: "MTBFやMTTRについては、経営情報システムの科目でも学習します。ただ、運営管理でも出題されることがある論点です。科目を横断して出題されても対処できるように、問題演習を通じて身につけていきましょう。" },
      { t: "p", x: "本問の設備Aと設備Bの評価指標を計算すると次の通りです。" },
      { t: "fig", x: "equipment_metrics" },
      { t: "p", x: "では、選択肢を見ていきましょう。" },
      { t: "p", x: "ａは正しい記述です。MTBF（平均故障間隔）とは、故障が修復されてから次の故障までの動作時間の平均値です。上記の表の通り、設備Bの方が長いです。" },
      { t: "p", x: "ｂの記述は誤りです。MTTR（平均修復時間）とは、修復に費やした時間の平均値です。上記の表の通り、設備Aの方が長いです。" },
      { t: "p", x: "ｃは正しい記述です。アベイラビリティ（可用率）とは、必要とされるときに設備が使用中または運転可能である確率です。上記の表の通り、設備Bの方が高いです。" },
      { t: "p", x: "よって、ａ：正　 ｂ：誤　 ｃ：正　となり、選択肢イが正解です。" },
      { t: "key", x: "評価指標の種類と計算方法をしっかり覚えておきましょう。" },
    ],
  },
  {
    id: "q7",
    no: 7,
    topic: "保全活動①",
    category: CAT_EQUIP,
    exam: "平成27年　第18問",
    question: "保全活動に関する記述として、最も適切なものはどれか。",
    choices: [
      "改良保全は、設備故障の発生から修復までの時間を短縮する活動である。",
      "保全活動は、予防保全、改良保全、保全予防の3つに分けられる。",
      "保全予防は、設備の計画・設計段階から、過去の保全実績等の情報を用いて不良や故障に関する事項を予測し、これらを排除するための対策を織り込む活動である。",
      "予防保全は、定期保全と集中保全の2つに分けられる。",
    ],
    answer: 2,
    explanation: [
      { t: "p", x: "保全活動に関する問題です。\n保全活動の種類は、次のように体系立てて整理できます。" },
      { t: "fig", x: "maintenance_tree" },
      { t: "p", x: "それでは選択肢を見ていきましょう。" },
      { t: "p", x: "選択肢アについて、改良保全は、設備そのものが故障しにくくなるように改良することです。設備故障の発生から修復までの時間を短縮する活動ではありません。よって選択肢アは不適切です。" },
      { t: "p", x: "選択肢イについて、保全活動は大きく分けると、設備を維持する活動と、改善する活動になります。さらに、設備を維持する活動には、予防保全と事後保全があります。設備を改善する活動には、改良保全と保全予防があります。このような分類になりますので、選択肢イは不適切です。" },
      { t: "p", x: "選択肢ウについて、保全予防は、設備の計画、設計段階から故障や性能の劣化を防ぐための活動です。保全予防では、過去の保全実績を記録しておき、それを基に新しい設備を計画・設計します。よって選択肢ウは適切で、正解です。" },
      { t: "p", x: "選択肢エについて、予防保全は、故障を未然に防ぐための活動です。予防保全はさらに定期保全と予知保全に分けられます。定期保全は、その名の通り定期的に実施する保全活動です。予知保全は、設備の劣化傾向を設備診断技術などによって管理し、故障に至る前の最適な時期に最善の対策を行う保全の方法です。よって選択肢エは不適切です。" },
    ],
  },
  {
    id: "q8",
    no: 8,
    topic: "保全活動②",
    category: CAT_EQUIP,
    exam: "令和4年　第17問",
    question: "生産保全の観点から見た保全活動に関する記述として、最も適切なものはどれか。",
    choices: [
      "あらかじめ代替機を用意し、故障してから修理した方がコストがかからない場合は、予防保全を選択する。",
      "過去に発生した故障が再発しないように改善を加える活動は、事後保全である。",
      "設備の劣化傾向について設備診断技術などを用いて管理することによって、保全の時期や修理方法などを決める予防保全の方法を状態監視保全という。",
      "掃除、給油、増し締めなどの活動は、設備の劣化を防ぐために実施される改良保全である。",
    ],
    answer: 2,
    explanation: [
      { t: "p", x: "保全活動に関する出題です。保全活動の種類と特徴について知識を問う問題です。" },
      { t: "p", x: "保全活動は大きく分けて、設備を「維持する活動」と設備を「改善する活動」があります。設備を維持する活動には予防保全と事後保全があり、設備を改善する活動には改良保全と保全予防があります。本問では、それぞれの保全活動の目的を理解していることがポイントです。" },
      { t: "fig", x: "maintenance_tree" },
      { t: "p", x: "では、選択肢を見ていきましょう。" },
      { t: "p", x: "選択肢アは不適切な記述です。予防保全は、故障を未然に防ぐための活動です。設備の定期点検や古くなった部品を交換する活動が含まれます。あらかじめ代替機を用意し、故障してから修理した方がコストがかからない場合は、事後保全を選択します。" },
      { t: "p", x: "選択肢イは不適切な記述です。事後保全は、故障が発見された後の活動です。故障した設備を修理するような活動が含まれます。過去に発生した故障が再発しないように改善を加える活動は、改良保全です。" },
      { t: "p", x: "選択肢ウは適切な記述です。状態監視保全は、設備の劣化傾向を設備診断技術などによって管理し、故障に至る前の最適な時期に最善の対策を行う方法です。" },
      { t: "p", x: "選択肢エは不適切な記述です。改良保全は、設備そのものが故障しにくくなるように改良を施すことです。単に故障を直すだけでなく、故障しやすい設備の構造自体を改良することで、故障の防止や性能の向上を目指します。設備の劣化を防ぐために実施される掃除、給油、増し締めなどの活動は予防保全です。" },
      { t: "key", x: "保全活動は目的に応じて様々な活動があります。似たような名称で混同しやすいので、体系図で整理しながらそれぞれの活動の特徴を理解しておきましょう。" },
    ],
  },
  {
    id: "q9",
    no: 9,
    topic: "自主保全のステップ",
    category: CAT_EQUIP,
    exam: "平成25年　第19問",
    question:
      "TPM（Total Productive Maintenance）における自主保全の7つのステップを示す以下の図の空欄Ａ〜Ｃに入る語句として、最も適切なものの組み合わせを下記の解答群から選べ。\n\n　１． （　Ａ　）\n　２．発生源･困難個所対策\n　３． （　Ｂ　）\n　４．総点検\n　５．自主点検\n　６． （　Ｃ　）\n　７．自主管理の徹底\n\n[解答群]",
    choices: [
      "Ａ：故障原因の究明　Ｂ：故障の再発防止策の策定　Ｃ：標準化",
      "Ａ：故障原因の究明　Ｂ：自主保全仮基準の作成　Ｃ：保全組織の決定",
      "Ａ：初期清掃(清掃・点検)　Ｂ：故障の再発防止策の策定　Ｃ：保全組織の決定",
      "Ａ：初期清掃(清掃・点検)　Ｂ：自主保全仮基準の作成　Ｃ：標準化",
    ],
    answer: 3,
    explanation: [
      { t: "p", x: "TPM（Total Productive Maintenance）に関する問題です。\n本問では、TPMにおける自主保全の実施ステップの順番が問われています。7つの順番を完全に覚えていなくても、要所を押さえていれば、正解できる問題です。" },
      { t: "p", x: "まずは、TPMの実施ステップを簡単に復習しましょう。\nTPMとは、生産部門をはじめ、開発・営業・管理などのあらゆる部門にわたってトップから第一線従業員にいたるまで全員が参加し、ロス・ゼロを達成する保全活動です。その活動の基本構成は3つの段階に分けられ、さらに7つのステップで実施されます。" },
      { t: "p", x: "・段階1：劣化を防ぐ活動\n設備の清掃・点検を中心に、設備の基本条件を徹底的に整備し、維持体制をつくる段階です。第1〜第3までの「初期清掃（清掃・点検）」、「発生源・困難箇所対策」、「自主保全の仮基準の作成」の3つのステップが含まれます。" },
      { t: "p", x: "・段階2：劣化を測る活動\n設備総点検の教育と実施により、劣化を防ぐ活動から劣化を測る活動へと発展させます。五感から理屈に裏付けられた日常点検ができる「設備に強いオペレーター」を目指す段階です。第4〜第5までの「総点検」、「自主点検」の2つのステップが含まれます。" },
      { t: "p", x: "・段階3：標準化と自主管理の活動\n標準化と自主管理の仕上げの段階です。オペレーター自身が必要な保全技能の完成を図ることで、オペレーターと現場が大きく変わり、自主管理の職場となります。第6〜第7ステップの「標準化」、「自主管理の徹底」の2つのステップが含まれます。" },
      { t: "p", x: "それでは、選択肢を見ていきましょう。\nＡについて、段階1の最初の活動で「初期清掃(清掃・点検)」となります。これは全てのベースとなる非常に重要な活動です。" },
      { t: "p", x: "Ｂについて、段階1の最後の活動で、短時間で清掃・給油・増締め・点検を確実に維持できるような行動基準となる、「自主保全仮基準の作成」をすることで、劣化を防ぎます。" },
      { t: "p", x: "Ｃについて、段階3の仕上げの活動の一つで「標準化」となります。" },
      { t: "p", x: "ここまで踏まえた上で選択肢を見ると、正解はエであることが分かります。" },
      { t: "key", x: "TPM活動の基本を構成する3つの段階については、その名称と内容をしっかり押さえておきましょう。また、7つのステップについても、全て覚えるのは難しいかもしれませんが、「初期清掃」ではじまり、「標準化」と「自主管理」をもって仕上げる点を、合わせて押さえておきましょう。" },
      { t: "p", x: "〜補足〜 自主保全の7つのステップ\n1. 初期清掃（清掃・点検）\n2. 発生源・困難箇所対策\n3. 自主保全の仮基準の作成\n4. 総点検\n5. 自主点検\n6. 標準化\n7. 自主管理の徹底" },
    ],
  },
  {
    id: "q10",
    no: 10,
    topic: "生産情報システム",
    category: CAT_EQUIP,
    exam: "平成24年　第5問",
    question: "生産活動におけるコンピュータ支援技術に関する記述として、最も適切なものはどれか。",
    choices: [
      "コンピュータの内部に表現されたモデルに基づいて、生産に必要な各種情報を作成すること、およびそれに基づいて進める生産の形式は、CADと呼ばれる。",
      "生産活動に関連する設備、システムの運用、管理などについて、コンピュータの支援のもとで教育または学習を行う方法は、CAIと呼ばれる。",
      "製品の形状その他の属性データからなるモデルをコンピュータ内部に作成し、解析・処理することによって進める設計は、CAEと呼ばれる。",
      "製品を製造するために必要な情報をコンピュータを用いて統合的に処理し、製品、品質、製造工程などを解析評価することは、CAMと呼ばれる",
    ],
    answer: 1,
    explanation: [
      { t: "p", x: "生産情報システムに関する出題です。\nそれでは選択肢を見ていきましょう。" },
      { t: "p", x: "選択肢アについて、CADは、製品の設計をコンピュータを利用して行うシステムです。選択肢アの記述は、CAMのことを説明した内容になっています。よって選択肢アは不適切です。" },
      { t: "p", x: "選択肢イについて、CAIは、Computer-Aided Instructionの略で、コンピュータを活用して教育プログラムを提供するシステムです。生産活動やシステムの運用、管理に限らず、子どもの教育や学生の勉強、大人の資格や趣味の学習など、活用範囲は多岐にわたります。選択肢イは、CAIのことを説明した記述ですので、選択肢イは適切です。よってこれが正解です。" },
      { t: "p", x: "選択肢ウについて、CAEは、製品のシミュレーションを行うシステムです。CAEを用いることで、製品を実際に作る前に、強度や安定性、性能などをシミュレーションで評価することができます。選択肢ウは、CADすなわちコンピュータ支援設計のことを説明した記述です。よって選択肢ウは不適切です。" },
      { t: "p", x: "選択肢エについて、CAMは、コンピュータ内部で表現されたモデルに基づいて生産に必要な情報を生成するシステムです。CAMでは、CADなどで設計したモデルを基に、NC工作機械などで生産できるようなプログラムを生成します。選択肢エは、CAEのことを説明した記述です。よって選択肢エは不適切です。" },
    ],
  },
];

// ===================================================================
// データ永続化ヘルパ（LocalStorageフォールバック）
// ===================================================================
const lsKey = (uid) => `${APP_ID}__${uid}`;

const loadLocal = (uid) => {
  try {
    const raw = localStorage.getItem(lsKey(uid));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("[Local] 読み込み失敗:", e);
    return null;
  }
};

const saveLocal = (uid, data) => {
  try {
    localStorage.setItem(lsKey(uid), JSON.stringify(data));
  } catch (e) {
    console.error("[Local] 保存失敗:", e);
  }
};

const normalize = (data) => ({
  progressIndex: Number(data?.progressIndex || 0),
  progressMode: data?.progressMode || "all",
  history: data?.history || {},
  reviews: data?.reviews || {},
});

// ===================================================================
// メインコンポーネント
// ===================================================================
export default function App() {
  // --- 初期化・認証 ---
  const [authReady, setAuthReady] = useState(false);

  // --- 画面状態（screenRefガードに使用） ---
  const [screen, setScreen] = useState("login"); // login | dashboard | quiz | result
  const screenRef = useRef(screen);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  // --- ユーザー識別（合言葉） ---
  const [inputId, setInputId] = useState("");
  const [userId, setUserId] = useState("");
  const isFirstLoad = useRef(true);
  useEffect(() => {
    isFirstLoad.current = true;
  }, [userId]);

  // --- 学習データ ---
  const [progress, setProgress] = useState(normalize({}));
  const [loadingData, setLoadingData] = useState(false);

  // --- 途中再開モーダル ---
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [pendingProgress, setPendingProgress] = useState(null);

  // --- クイズセッション ---
  const [mode, setMode] = useState("all"); // all | wrong | review
  const [quizList, setQuizList] = useState([]); // 問題index(0始まり)の配列
  const [cursor, setCursor] = useState(0); // quizList内の位置
  const [selected, setSelected] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const unsubRef = useRef(null);

  // -----------------------------------------------------------------
  // 1. 匿名認証（Firestoreアクセス前に必ず実行・成功を待つ）
  // -----------------------------------------------------------------
  useEffect(() => {
    let active = true;
    const init = async () => {
      if (!auth) {
        console.warn("[Auth] authが未初期化のためLocalStorageモードで起動します");
        if (active) setAuthReady(true);
        return;
      }
      try {
        await signInAnonymously(auth);
        console.log("[Auth] 匿名サインイン成功（Firestoreアクセス可能）");
      } catch (e) {
        console.error("[Auth] 匿名サインイン失敗（LocalStorageへフォールバック）:", e);
      } finally {
        if (active) setAuthReady(true);
      }
    };
    init();
    return () => {
      active = false;
      if (unsubRef.current) unsubRef.current();
    };
  }, []);

  // -----------------------------------------------------------------
  // 2. ログイン（合言葉入力 → データ購読開始 → 復元完了でログイン確定）
  // -----------------------------------------------------------------
  const fallbackLogin = useCallback((uid) => {
    const local = normalize(loadLocal(uid) || {});
    isFirstLoad.current = false;
    console.log("[Login] LocalStorage復元完了 → ログイン確定", local);
    setProgress(local);
    setLoadingData(false);
    setScreen("dashboard");
    if (local.progressIndex > 0) {
      console.log("[Resume] 途中再開を検出(Local) index=", local.progressIndex, "mode=", local.progressMode);
      setPendingProgress(local);
      setShowResumeModal(true);
    }
  }, []);

  const handleLogin = useCallback(() => {
    const uid = inputId.trim();
    if (!uid) return;
    console.log("[Login] 合言葉でログイン:", uid);
    setUserId(uid);
    setLoadingData(true);
    isFirstLoad.current = true;

    // 既存購読を解除
    if (unsubRef.current) {
      unsubRef.current();
      unsubRef.current = null;
    }

    // Firestore購読（失敗時はLocalStorageへ）
    if (db) {
      try {
        const ref = doc(db, APP_ID, uid);
        const unsub = onSnapshot(
          ref,
          (snap) => {
            const parsed = snap.exists() ? normalize(snap.data()) : normalize({});
            saveLocal(uid, parsed);

            // 【screenRefガード】初回ロードかつクイズ中でないときのみ再開モーダルを判定。
            // クイズ解答中(screen==="quiz")の自動受信ではモーダルを出さず進捗だけ同期する。
            if (isFirstLoad.current && screenRef.current !== "quiz") {
              isFirstLoad.current = false;
              console.log("[Login] Firestore履歴フェッチ完了 → ログイン確定");
              setLoadingData(false);
              setProgress(parsed);
              setScreen("dashboard");
              if (parsed.progressIndex > 0) {
                console.log("[Resume] 途中再開を検出 index=", parsed.progressIndex, "mode=", parsed.progressMode);
                setPendingProgress(parsed);
                setShowResumeModal(true);
              }
              return; // 初回はここで終了
            }

            // クイズ解答中など（screen === "quiz"）はモーダルを出さず、進捗だけ同期
            setProgress(parsed);
          },
          (err) => {
            console.error("[Firestore] 購読エラー（LocalStorageへフォールバック）:", err);
            fallbackLogin(uid);
          }
        );
        unsubRef.current = unsub;
      } catch (e) {
        console.error("[Firestore] 購読開始失敗:", e);
        fallbackLogin(uid);
      }
    } else {
      fallbackLogin(uid);
    }
  }, [inputId, fallbackLogin]);

  // -----------------------------------------------------------------
  // 3. 進捗の保存（Firestore + LocalStorage）
  // -----------------------------------------------------------------
  const persist = useCallback(
    async (patch) => {
      if (!userId) return;
      const next = normalize({ ...progress, ...patch });
      setProgress(next);
      saveLocal(userId, next);
      if (db) {
        try {
          await setDoc(doc(db, APP_ID, userId), next, { merge: true });
        } catch (e) {
          console.error("[Firestore] 保存失敗（Localのみ保持）:", e);
        }
      }
    },
    [userId, progress]
  );

  // -----------------------------------------------------------------
  // 4. 出題リストの構築
  // -----------------------------------------------------------------
  const buildList = useCallback(
    (m) => {
      const all = QUESTIONS.map((_, i) => i);
      if (m === "wrong") {
        return all.filter((i) => {
          const h = progress.history?.[QUESTIONS[i].id];
          return h && h.correct === false;
        });
      }
      if (m === "review") {
        return all.filter((i) => progress.reviews?.[QUESTIONS[i].id]);
      }
      return all;
    },
    [progress]
  );

  // -----------------------------------------------------------------
  // 5. クイズ開始 / 再開
  // -----------------------------------------------------------------
  const startQuiz = useCallback(
    (m, startCursor = 0) => {
      const list = buildList(m);
      if (list.length === 0) {
        console.log("[Quiz] 対象問題が0件:", m);
        return;
      }
      const safeCursor = Math.min(Math.max(0, startCursor), list.length - 1);
      console.log("[Quiz] 出題モード切替:", m, "開始位置:", safeCursor, "件数:", list.length);
      setMode(m);
      setQuizList(list);
      setCursor(safeCursor);
      setSelected(null);
      setIsAnswered(false);
      setScreen("quiz");
      persist({ progressMode: m, progressIndex: safeCursor });
    },
    [buildList, persist]
  );

  const handleResumeYes = () => {
    const p = pendingProgress || progress;
    console.log("[Resume] 続きから再開:", p.progressMode, p.progressIndex);
    setShowResumeModal(false);
    startQuiz(p.progressMode || "all", Number(p.progressIndex || 0));
  };

  const handleResumeNo = () => {
    console.log("[Resume] 最初から開始（progressIndexをリセット）");
    setShowResumeModal(false);
    setPendingProgress(null);
    persist({ progressIndex: 0 });
  };

  // -----------------------------------------------------------------
  // 6. 解答処理
  // -----------------------------------------------------------------
  const currentQ = quizList.length ? QUESTIONS[quizList[cursor]] : null;

  const handleAnswer = (choiceIdx) => {
    if (isAnswered || !currentQ) return;
    const correct = choiceIdx === currentQ.answer;
    setSelected(choiceIdx);
    setIsAnswered(true);
    console.log("[Answer] 解答保存 Q", currentQ.id, "選択:", choiceIdx, "正誤:", correct);

    const newHistory = {
      ...progress.history,
      [currentQ.id]: {
        correct,
        selected: choiceIdx,
        answeredAt: new Date().toISOString(),
      },
    };
    // 解答するたびに現在位置をprogressIndexへ保存（次に解く位置 = cursor+1）
    const nextIndex = cursor + 1;
    const completed = nextIndex >= quizList.length;
    persist({
      history: newHistory,
      progressMode: mode,
      progressIndex: completed ? 0 : nextIndex, // 完走したら0にリセット
    });
    if (completed) console.log("[Progress] 全問完走 → progressIndexを0にリセット");
  };

  const toggleReview = () => {
    if (!currentQ) return;
    const cur = !!progress.reviews?.[currentQ.id];
    const newReviews = { ...progress.reviews, [currentQ.id]: !cur };
    if (cur) delete newReviews[currentQ.id];
    console.log("[Review] 要復習登録:", currentQ.id, "→", !cur);
    persist({ reviews: newReviews });
  };

  const goNext = () => {
    if (cursor + 1 >= quizList.length) {
      console.log("[Quiz] 最終問題まで完了 → 結果画面（progressIndexを0にリセット）");
      setScreen("result");
      persist({ progressIndex: 0 });
      return;
    }
    const nc = cursor + 1;
    setCursor(nc);
    setSelected(null);
    setIsAnswered(false);
    persist({ progressIndex: nc, progressMode: mode });
  };

  const goHome = () => {
    // 中断時もその時点のprogressIndexを即時保存（ブラウザを閉じても続きから再開可能）
    console.log("[Nav] ホームへ戻る（progressIndex保存）", cursor);
    if (screen === "quiz") {
      persist({ progressIndex: cursor, progressMode: mode });
    }
    setSelected(null);
    setIsAnswered(false);
    setScreen("dashboard");
  };

  // -----------------------------------------------------------------
  // 7. 学習指標（レーダーチャート用）
  // -----------------------------------------------------------------
  const stats = React.useMemo(() => {
    const total = QUESTIONS.length;
    const answered = QUESTIONS.filter((q) => progress.history?.[q.id]).length;
    const correct = QUESTIONS.filter((q) => progress.history?.[q.id]?.correct).length;
    const reviewCount = QUESTIONS.filter((q) => progress.reviews?.[q.id]).length;

    const catStat = (cat) => {
      const qs = QUESTIONS.filter((q) => q.category === cat);
      const done = qs.filter((q) => progress.history?.[q.id]).length;
      return qs.length ? Math.round((done / qs.length) * 100) : 0;
    };

    const radar = [
      { metric: "総合進捗率", value: total ? Math.round((answered / total) * 100) : 0 },
      { metric: "全問正解率", value: total ? Math.round((correct / total) * 100) : 0 },
      { metric: "回答正確性", value: answered ? Math.round((correct / answered) * 100) : 0 },
      { metric: CAT_QC, value: catStat(CAT_QC) },
      { metric: CAT_EQUIP, value: catStat(CAT_EQUIP) },
    ];
    return { total, answered, correct, reviewCount, radar };
  }, [progress]);

  // -----------------------------------------------------------------
  // 描画
  // -----------------------------------------------------------------

  // 初期ローディング（認証完了まで）
  if (!authReady) {
    return <LoadingScreen text="初期化しています..." />;
  }

  // ログイン画面（合言葉認証が完了するまで他画面は絶対に描画しない）
  if (screen === "login") {
    return (
      <LoginScreen
        inputId={inputId}
        setInputId={setInputId}
        onLogin={handleLogin}
        loading={loadingData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500">
              <BookOpen size={18} className="text-white" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-slate-100">過去問セレクト演習</div>
              <div className="text-[11px] text-slate-400">{SUBTITLE}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <User size={14} />
            <span className="max-w-[120px] truncate">{userId}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-24 pt-6">
        {loadingData ? (
          <div className="py-20">
            <Spinner />
            <p className="mt-4 text-center text-sm text-slate-400">学習データを読み込み中...</p>
          </div>
        ) : screen === "dashboard" ? (
          <Dashboard stats={stats} progress={progress} onStart={startQuiz} buildList={buildList} />
        ) : screen === "quiz" && currentQ ? (
          <QuizView
            q={currentQ}
            cursor={cursor}
            total={quizList.length}
            selected={selected}
            isAnswered={isAnswered}
            isReview={!!progress.reviews?.[currentQ.id]}
            onAnswer={handleAnswer}
            onToggleReview={toggleReview}
            onNext={goNext}
            onHome={goHome}
          />
        ) : screen === "result" ? (
          <ResultView quizList={quizList} progress={progress} mode={mode} onHome={goHome} />
        ) : (
          <EmptyState onHome={goHome} />
        )}
      </main>

      {/* 途中再開モーダル */}
      {showResumeModal && (pendingProgress || progress) ? (
        <ResumeModal
          progress={pendingProgress || progress}
          onYes={handleResumeYes}
          onNo={handleResumeNo}
        />
      ) : null}
    </div>
  );
}

// ===================================================================
// 画面コンポーネント群
// ===================================================================
const Spinner = () => (
  <div className="flex justify-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-sky-400" />
  </div>
);

const LoadingScreen = ({ text }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 font-sans">
    <div className="text-center">
      <Spinner />
      <p className="mt-4 text-sm text-slate-400">{text}</p>
    </div>
  </div>
);

const LoginScreen = ({ inputId, setInputId, onLogin, loading }) => (
  <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 font-sans">
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 shadow-lg shadow-indigo-900/40">
          <BookOpen size={30} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-100">{TITLE}</h1>
        <p className="mt-2 text-sm text-slate-400">中小企業診断士 運営管理／過去問セレクト演習</p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl backdrop-blur">
        <label className="mb-2 block text-sm font-semibold text-slate-200">合言葉（ユーザーID）</label>
        <p className="mb-3 text-xs leading-relaxed text-slate-400">
          同じ合言葉を入力すれば、PC・スマホなど複数端末で学習履歴と進捗が完全に同期・復元されます。
        </p>
        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 focus-within:border-sky-500">
          <User size={18} className="text-slate-500" />
          <input
            type="text"
            value={inputId}
            onChange={(e) => setInputId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onLogin()}
            placeholder="例：mystudy2026"
            className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-600"
          />
        </div>
        <button
          onClick={onLogin}
          disabled={loading || !inputId.trim()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 py-3 font-bold text-white transition hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-900/40 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            "読み込み中..."
          ) : (
            <>
              学習を始める <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
      <p className="mt-6 text-center text-[11px] text-slate-600">
        全{QUESTIONS.length}問収録 ／ 3-6 生産のオペレーション（品質管理・設備保全・生産情報システム）
      </p>
    </div>
  </div>
);

const ModeButton = ({ icon, label, desc, count, disabled, onClick, accent }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`group flex w-full items-center gap-3 rounded-xl border p-4 text-left transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-40 ${accent}`}
  >
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-950/60">
      {icon}
    </div>
    <div className="flex-1">
      <div className="font-bold text-slate-100">{label}</div>
      <div className="text-xs text-slate-400">{desc}</div>
    </div>
    <div className="flex items-center gap-1 text-xs text-slate-400">
      <span className="rounded-full bg-slate-950/60 px-2 py-0.5 font-semibold">{count}問</span>
      <ChevronRight size={18} className="text-slate-500 transition group-hover:translate-x-0.5" />
    </div>
  </button>
);

const Dashboard = ({ stats, progress, onStart, buildList }) => {
  const wrongCount = buildList("wrong").length;
  const reviewCount = buildList("review").length;

  return (
    <div className="space-y-6">
      {/* 学習指標カード */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart2 size={18} className="text-sky-400" />
          <h2 className="font-bold text-slate-100">学習ダッシュボード</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={stats.radar} outerRadius="72%">
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} />
                <Radar dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.45} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="総問題数" value={stats.total} unit="問" />
            <StatCard label="解答済み" value={stats.answered} unit="問" accent="text-sky-300" />
            <StatCard label="正解数" value={stats.correct} unit="問" accent="text-emerald-300" />
            <StatCard label="要復習" value={stats.reviewCount} unit="問" accent="text-amber-300" />
          </div>
        </div>
      </section>

      {/* モード選択 */}
      <section className="space-y-3">
        <h2 className="px-1 text-sm font-semibold text-slate-300">出題モードを選択</h2>
        <ModeButton
          icon={<BookOpen size={20} className="text-indigo-300" />}
          label="すべての問題"
          desc="全問題を順番に演習します"
          count={stats.total}
          accent="border-indigo-700/60 bg-indigo-950/30 hover:border-indigo-500"
          onClick={() => onStart("all")}
        />
        <ModeButton
          icon={<RefreshCw size={20} className="text-rose-300" />}
          label="前回不正解の問題のみ"
          desc="間違えた問題だけを集中演習"
          count={wrongCount}
          disabled={wrongCount === 0}
          accent="border-rose-700/50 bg-rose-950/20 hover:border-rose-500"
          onClick={() => onStart("wrong")}
        />
        <ModeButton
          icon={<HelpCircle size={20} className="text-amber-300" />}
          label="要復習の問題のみ"
          desc="チェックを付けた問題を演習"
          count={reviewCount}
          disabled={reviewCount === 0}
          accent="border-amber-700/50 bg-amber-950/20 hover:border-amber-500"
          onClick={() => onStart("review")}
        />
      </section>

      {/* 履歴一覧 */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <h2 className="mb-3 text-sm font-semibold text-slate-300">解答履歴（全問題の状況）</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs text-slate-200 md:text-sm">
            <thead>
              <tr className="text-slate-400">
                <th className="border-b border-slate-700 px-2 py-2 text-left">No.</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left">論点</th>
                <th className="border-b border-slate-700 px-2 py-2 text-center">状況</th>
                <th className="border-b border-slate-700 px-2 py-2 text-center">復習</th>
                <th className="border-b border-slate-700 px-2 py-2 text-left">最終解答</th>
              </tr>
            </thead>
            <tbody>
              {QUESTIONS.map((q) => {
                const h = progress.history?.[q.id];
                const rev = !!progress.reviews?.[q.id];
                return (
                  <tr key={q.id} className="hover:bg-slate-800/40">
                    <td className="border-b border-slate-800 px-2 py-2 text-slate-400">{q.no}</td>
                    <td className="border-b border-slate-800 px-2 py-2">
                      <div className="font-medium text-slate-100">{q.topic}</div>
                      <div className="text-[11px] text-slate-500">{q.exam}</div>
                    </td>
                    <td className="border-b border-slate-800 px-2 py-2 text-center">
                      {!h ? (
                        <span className="text-slate-600">未着手</span>
                      ) : h.correct ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/60 px-2 py-0.5 text-emerald-300">
                          <Check size={12} /> 正解
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-950/60 px-2 py-0.5 text-rose-300">
                          <X size={12} /> 不正解
                        </span>
                      )}
                    </td>
                    <td className="border-b border-slate-800 px-2 py-2 text-center">
                      {rev ? <span className="text-amber-300">★</span> : <span className="text-slate-700">−</span>}
                    </td>
                    <td className="border-b border-slate-800 px-2 py-2 text-[11px] text-slate-500">
                      {h?.answeredAt
                        ? new Date(h.answeredAt).toLocaleString("ja-JP", { dateStyle: "short", timeStyle: "short" })
                        : "−"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const StatCard = ({ label, value, unit, accent }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
    <div className="text-[11px] text-slate-400">{label}</div>
    <div className={`mt-1 text-2xl font-bold ${accent || "text-slate-100"}`}>
      {value}
      <span className="ml-0.5 text-xs font-normal text-slate-500">{unit}</span>
    </div>
  </div>
);

// 解説ブロックのレンダラ（{t:'p'|'fig'|'key', x} のブロック配列 or 文字列）
const ExplanationBody = ({ explanation }) => {
  const blocks = Array.isArray(explanation) ? explanation : [{ t: "p", x: explanation }];
  return (
    <div className="space-y-3">
      {blocks.map((b, i) => {
        if (b.t === "fig") return <Figure key={i} name={b.x} />;
        if (b.t === "key")
          return (
            <div key={i} className="rounded-xl border border-sky-700/50 bg-sky-950/30 p-4">
              <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-sky-300">
                <HelpCircle size={14} /> ここが重要
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{b.x}</p>
            </div>
          );
        return (
          <p key={i} className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
            {b.x}
          </p>
        );
      })}
    </div>
  );
};

const QuizView = ({ q, cursor, total, selected, isAnswered, isReview, onAnswer, onToggleReview, onNext, onHome }) => {
  const correct = isAnswered && selected === q.answer;
  return (
    <div className="space-y-5">
      {/* 進捗バー */}
      <div>
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-400">
          <span>
            {cursor + 1} / {total} 問
          </span>
          <button
            onClick={onHome}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <Home size={14} /> ホーム
          </button>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-sky-400 transition-all"
            style={{ width: `${((cursor + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* 問題カード */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-gradient-to-r from-indigo-600 to-sky-500 px-2.5 py-1 text-xs font-bold text-white">
            過去問　{q.exam}
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-400">
            {q.category}
          </span>
          <span className="rounded-md border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-400">
            問題{q.no}
          </span>
        </div>
        <h2 className="mb-2 text-base font-bold text-sky-200">{q.topic}</h2>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{q.question}</p>

        {/* 問題画面の図表（解答情報を含まない与条件図のみ。解答後に解説図へ切替） */}
        {q.figure ? <Figure name={q.figure} /> : null}
      </div>

      {/* 選択肢 */}
      <div className="space-y-2.5">
        {q.choices.map((c, i) => {
          const label = CHOICE_LABELS[i];
          let cls = "border-slate-700 bg-slate-900/60 hover:border-sky-500 hover:bg-slate-800/60";
          if (isAnswered) {
            if (i === q.answer) cls = "border-emerald-500 bg-emerald-950/40";
            else if (i === selected) cls = "border-rose-500 bg-rose-950/40";
            else cls = "border-slate-800 bg-slate-900/40 opacity-60";
          }
          return (
            <button
              key={i}
              onClick={() => onAnswer(i)}
              disabled={isAnswered}
              className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition ${cls} ${
                isAnswered ? "cursor-default" : "hover:scale-[1.01]"
              }`}
            >
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  isAnswered && i === q.answer
                    ? "bg-emerald-500 text-white"
                    : isAnswered && i === selected
                    ? "bg-rose-500 text-white"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {label}
              </span>
              <span className="flex-1 whitespace-pre-wrap text-sm text-slate-100">{c}</span>
              {isAnswered && i === q.answer ? (
                <Check size={20} className="shrink-0 text-emerald-400" />
              ) : isAnswered && i === selected ? (
                <X size={20} className="shrink-0 text-rose-400" />
              ) : null}
            </button>
          );
        })}
      </div>

      {/* 解説（解答後に展開） */}
      {isAnswered && (
        <div className="space-y-4">
          {/* 正誤バナー */}
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              correct ? "border-emerald-600/60 bg-emerald-950/40" : "border-rose-600/60 bg-rose-950/40"
            }`}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                correct ? "bg-emerald-500" : "bg-rose-500"
              }`}
            >
              {correct ? <Check size={22} className="text-white" /> : <X size={22} className="text-white" />}
            </div>
            <div>
              <div className={`font-bold ${correct ? "text-emerald-300" : "text-rose-300"}`}>
                {correct ? "正解！" : "不正解"}
              </div>
              <div className="text-sm text-slate-300">
                正解は <span className="font-bold text-slate-100">{CHOICE_LABELS[q.answer]}</span> です。
              </div>
            </div>
          </div>

          {/* 要復習チェック */}
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <input type="checkbox" checked={isReview} onChange={onToggleReview} className="h-5 w-5 accent-amber-500" />
            <span className="flex items-center gap-1.5 text-sm font-medium text-slate-200">
              <HelpCircle size={16} className="text-amber-400" />
              この問題を要復習リストに登録する
            </span>
          </label>

          {/* 解説本文 */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
            <div className="mb-3 flex items-center gap-2">
              <BookOpen size={18} className="text-sky-400" />
              <h3 className="font-bold text-slate-100">解説</h3>
            </div>
            <ExplanationBody explanation={q.explanation} />
          </div>

          {/* 次へ */}
          <button
            onClick={onNext}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 py-3.5 font-bold text-white transition hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-900/40"
          >
            {cursor + 1 >= total ? "結果を見る" : "次の問題へ"} <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

const ResultView = ({ quizList, progress, mode, onHome }) => {
  const items = quizList.map((qi) => QUESTIONS[qi]);
  const answered = items.filter((q) => progress.history?.[q.id]);
  const correct = items.filter((q) => progress.history?.[q.id]?.correct);
  const rate = answered.length ? Math.round((correct.length / answered.length) * 100) : 0;
  const modeLabel = mode === "wrong" ? "前回不正解" : mode === "review" ? "要復習" : "すべての問題";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500">
          <Check size={32} className="text-white" />
        </div>
        <h2 className="text-xl font-bold text-slate-100">演習完了！</h2>
        <p className="mt-1 text-sm text-slate-400">{modeLabel}モード</p>
        <div className="mt-6 flex items-center justify-center gap-8">
          <div>
            <div className="text-3xl font-bold text-sky-300">{rate}%</div>
            <div className="text-xs text-slate-400">正答率</div>
          </div>
          <div className="h-12 w-px bg-slate-700" />
          <div>
            <div className="text-3xl font-bold text-slate-100">
              {correct.length}
              <span className="text-base text-slate-500">/{items.length}</span>
            </div>
            <div className="text-xs text-slate-400">正解数</div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {items.map((q) => {
          const h = progress.history?.[q.id];
          const ok = h?.correct;
          return (
            <div key={q.id} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                  ok ? "bg-emerald-500" : "bg-rose-500"
                }`}
              >
                {ok ? <Check size={15} className="text-white" /> : <X size={15} className="text-white" />}
              </span>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-100">
                  問題{q.no}　{q.topic}
                </div>
                <div className="text-[11px] text-slate-500">{q.exam}</div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onHome}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 py-3.5 font-bold text-slate-100 transition hover:scale-[1.01] hover:border-sky-500"
      >
        <Home size={18} /> ダッシュボードへ戻る
      </button>
    </div>
  );
};

const EmptyState = ({ onHome }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center">
    <p className="text-slate-300">対象の問題がありません。</p>
    <button
      onClick={onHome}
      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 px-5 py-2.5 font-bold text-white transition hover:scale-[1.01]"
    >
      <Home size={16} /> ダッシュボードへ
    </button>
  </div>
);

const ResumeModal = ({ progress, onYes, onNo }) => {
  const modeLabel =
    progress.progressMode === "wrong"
      ? "前回不正解"
      : progress.progressMode === "review"
      ? "要復習"
      : "すべての問題";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-sky-500">
            <RefreshCw size={20} className="text-white" />
          </div>
          <h3 className="text-lg font-bold text-slate-100">途中再開</h3>
        </div>
        <p className="mb-6 text-sm leading-relaxed text-slate-300">
          前回は
          <span className="mx-1 font-bold text-sky-300">問題{Number(progress.progressIndex || 0) + 1}</span>
          まで進んでいます。中断した
          <span className="mx-1 font-bold text-sky-300">{modeLabel}</span>
          モードの続きから再開しますか？
        </p>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onYes}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-sky-500 py-3 font-bold text-white transition hover:scale-[1.01]"
          >
            続きから再開する <ArrowRight size={18} />
          </button>
          <button
            onClick={onNo}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 py-3 font-bold text-slate-200 transition hover:scale-[1.01] hover:border-slate-500"
          >
            最初から始める
          </button>
        </div>
      </div>
    </div>
  );
};