// npm install lucide-react recharts firebase

import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, X, Home, ChevronRight, RefreshCw, BarChart2, BookOpen, User, ArrowRight, HelpCircle
} from 'lucide-react';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer 
} from 'recharts';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

// ==========================================
// 1. Firebase Configuration & Initialization
// ==========================================
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const APP_ID = "QuizApp_Merchandising_001";

// ==========================================
// 2. Quiz Data (100% Non-cut, Exact Text)
// ==========================================
const QUIZ_DATA = [
  {
    id: 1,
    title: "２商品間の売上金額の相関係数 【平成 30 年 第 36 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "商品Ａ〜Ｄの 1 年間における日別の売上金額について、2 商品間の売上金額の相関係数を計算したところ、下表のようになった。これらの結果の解釈および相関係数の一般的な知識に関する記述として、最も適切なものを下記の解答群から選べ。\n\n＊ここで相関係数とはピアソンの積率相関係数である。",
    table: {
      headers: ["組み合わせ", "相関係数"],
      rows: [
        ["商品Ａの売上金額 と 商品Ｂの売上金額", "0.5"],
        ["商品Ｂの売上金額 と 商品Ｃの売上金額", "0.1"],
        ["商品Ａの売上金額 と 商品Ｄの売上金額", "-0.7"],
      ]
    },
    options: [
      "売上金額の相関関係の強さを見ると、商品Ａと商品Ｂの関係より、商品Ａと商品Ｄの関係のほうが強い。",
      "商品Ａと商品Ｂの相関係数が 0.5 で、商品Ｂと商品Ｃの相関係数が 0.1 であるため、表には計算されていないが、商品Ａと商品Ｃの相関係数は 0.4 であると言える。",
      "商品Ａと商品Ｂの相関係数が 0.5 であるため、商品Ｂの平均売上金額は、商品Ａの平均売上金額の半分であると言える。",
      "相関係数は、-100 から 100 までの範囲の値として計算される。",
      "理論的に相関係数は 0 にはならない。"
    ],
    correctIndex: 0,
    explanation: "解答：ア\n\n本問は、売上の相関関係に関する出題です。相関係数については、財務会計でも問われますが、運営管理においても、POS データを\n利用したマーケットバスケット分析等を理解する前提として重要になります。相関関係については、以下の関係を理解しておく必要が\nあります。\n\n相関係数＝1　X と Y が全く同じ性質の変動をする\n相関係数＝0　X と Y は無関係の変動をする\n相関係数＝－1　X と Y は全く正反対の性質の変動をする\n\nでは、各選択肢を見ていきましょう。\n\n選択肢アですが、相関関係の強さは、相関係数の絶対値の大きさで表されます。商品 A と商品 B の相関関係は相関係数が 0.5、商品\nA と商品 D の相関関係は相関係数が-0.7 です。絶対値は 0.5＜0.7 ですので、商品 A と商品 D の相関関係の方が強いことがわかりま\nす。従って、記述は適切で、本問の正解です。\n\n選択肢イですが、相関係数は以下の式で表されます。\n相関係数＝（X と Y の共分散）/｛（X の標準偏差）×（Y の標準偏差）｝\nなお、共分散＝E[（X－E[X]）（Y－E[Y]） ]\n※E[ ]は期待値\n\n相関係数の式から、分母が商品 A と商品 B は、（商品 A の標準偏差×商品 B の標準偏差）となり、商品 B と商品 C は、（商品 B の\n標準偏差×商品 C の標準偏差）ですから、分母が異なるため、単純に足し算、引き算しても商品 A と商品 C の相関係数が求められる\nわけではありません。従って、記述は不適切です。\n\n選択肢ウについては、商品 A と商品 B の相関係数が 0.5 であるとは商品 B の売上金額の変動が商品 A の売上高の変動の 1/2 であ\nり、平均売上高が 1/2 ではありません。従って、記述は不適切です。\n\n選択肢エは、相関係数の範囲ですが-1〜1 であって、-100〜100 ではありません。従って、記述は不適切です。\n\n選択肢オは、相関係数が 0 とはならないとされていますが、商品の一方が、まったく変動しない場合には、相関係数は 0 になります。\n実際には相関係数が 0 というケースはまれですが、理論的にはあります。"
  },
  {
    id: 2,
    title: "商品仕入 【平成 28 年 第 27 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "小売店の商品仕入に関する記述として、最も適切なものはどれか。",
    options: [
      "委託仕入では、一定期間店頭で販売し、売れ残った商品だけ小売店が買い取る。",
      "委託仕入では、商品の販売価格は原則として小売店が自由に設定する。",
      "委託仕入において、店頭在庫の所有権は小売店にある。",
      "消化仕入では、商品の販売時に小売店に所有権が移転する。",
      "消化仕入をすると、小売店の廃棄ロスが発生しやすい。"
    ],
    correctIndex: 3,
    explanation: "解答：エ\n\n商品の仕入方法に関する問題です。\n仕入方法について覚えていた人は、正解できる問題です。\n\nまずは、問題で触れられていた、委託仕入と消化仕入の違いを簡単に復習しましょう。\n\n■ 委託仕入と消化仕入の違い\n委託仕入は、メーカーなどの売り手が在庫の所有権を持ったまま小売店が販売を行う方法です。委託仕入は、商品が売れ残った場合には、メーカ\nーなどに返品ができます。ただし、在庫の所有権はメーカーなどにありますので、小売店は販売価格を決められず販売した商品に関して販売手数料\nを受け取ります。\n消化仕入（売上仕入ともいいます）は、店頭に商品を置き、売れた分を同時に仕入として計上する方法です。消化仕入では売れない限り、仕入を\nする必要がないため、小売店は売れ残りのリスクを負いません。\n\nここまで押さえた上で、選択肢を見てみましょう。\n選択肢アについて、委託仕入では売れ残った商品はメーカーなどに返品することになります。よって、選択肢アは不適切です。\n選択肢イについて、委託仕入では商品の販売価格は原則としてメーカーなどが設定します。よって、選択肢イは不適切です。\n選択肢ウについて、委託仕入では店頭在庫の所有権はメーカーなどが有しています。よって、選択肢ウは不適切です\n選択肢エについて、消化仕入では商品の販売時に売上と仕入が同時に発生し、小売店に所有権が移転します。よって、選択肢エは適\n切です。\n選択肢オは、消化仕入では売れ残った商品はメーカーに返品することになります。小売店での廃棄ロスが発生しにくいため、選択肢\nオは不適切です。\n\n■ 〜補足〜 買取仕入\nもう一つ代表的な仕入れ方法に買取仕入が有ります。小売店が商品を買い取る方法で、在庫の所有権は小売店が持ち、販売価格も自由に決められま\nす。しかし、商品が売れ残るリスクは小売店が持つ形になります。量販店ではこの形態を多くとっています。"
  },
  {
    id: 3,
    title: "価格設定と価格政策 【平成 25 年 第 30 問】",
    source: "過去問セレクト演習 3-8",
    category: "price",
    text: "小売業の価格設定と価格政策に関する記述として、最も不適切なものはどれか。",
    options: [
      "慣習価格政策は、すでに一般的に浸透している価格を設定する手法である。",
      "コストプラス方式の価格設定は、価格が市場の実情に合わない場合がある。",
      "マーケットプライス法は、全国共通の価格を設定する手法である。",
      "名声価格政策は、意識的に高価格を設定することによって、高品質であることを連想させる手法である。"
    ],
    correctIndex: 2,
    explanation: "解答：ウ\n\n価格政策と価格決定に関する問題です。\n価格政策や価格決定に関する基本的な知識を覚えていれば、正解できる問題です。\nそれでは問題文を見ていきましょう。\n\n選択肢アについて、慣習価格政策とは、消費者が慣習的に一定の価格のみ受け入れている場合に、その価格に基づいて価格を決定す\nる政策です。例えば、現在は、自動販売機の缶ジュースは 130 円で売られていることが多いです。これは、一般的に浸透している 130\n円よりも高い価格を設定すると需要が急激に減るためです。よって選択肢アは適切です。\n\n選択肢イについて、コストプラス方式では、製品の原価に一定の利益を上乗せした価格を設定します。この方式は、供給者側の事情\nを優先した価格設定のため、市場の実情と合わない場合があります。よって選択肢イは適切です。\n\n選択肢ウについて、マーケットプライス法は、市場の状況、例えば、顧客の動向や、競合店の価格等を考慮して価格を設定する手法\nです。全国共通の価格を設定する手法ではありません。よって選択肢ウは不適切で、正解です。\n\n選択肢エについて、名声価格政策とは、あえて高い価格をつけることで、消費者に高い価値があると認識させる政策です。名声価格\nは威光価格と呼ばれることもあります。高級時計などのブランド品は、高い価格の方がステータスが上がり、低い価格をつけたときよ\nりも、売れることがあります。よって選択肢エは適切です。"
  },
  {
    id: 4,
    title: "価格政策 【令和 4 年 第 30 問】",
    source: "過去問セレクト演習 3-8",
    category: "price",
    text: "小売業の価格政策と特売に関する記述として、最も適切なものはどれか。",
    options: [
      "EDLP 政策の場合、プライスラインは 1 つしか設けない。",
      "定番価格を高く設定していても、特売を頻繁に繰り返すと顧客の内的参照価格は低下する。",
      "特売による販売促進は、価格弾力性が低い商品ほどチラシなどで告知したときの集客効果が高い。",
      "ハイ・ロープライシング政策では、特売時における対象商品の販売数量を最大化することで店全体の利益率が高まる。",
      "端数価格には、買物客に安さを感じさせる心理的効果はない。"
    ],
    correctIndex: 1,
    explanation: "解答：イ\n\n小売業の価格政策に関する出題です。問われている内容は難しくありませんが、本問では選択肢に含まれている専門用語を理解してい\nるかがポイントになります。これらの専門用語は過去の本試験でもよく出題されていますので、確実に理解しておきたい内容です。\n\nでは、選択肢を見ていきましょう。\n\n選択肢アは不適切な記述です。EDLP 政策を採用したからと言って、プライスラインは１つとは限りません。EDLP 政策とは、EveryDay \nLow Price の略で、特売日を設けず常に一定の低価格で販売する価格政策を指します。プライスラインとは、1,000 円、2,000 円などの\n価格帯のことを指します。よって、プライスラインを 1 つに絞ることが EDLP 政策ではありません。EDLP 政策でも複数のプライスラ\nインを設けるケースはあります。\n\n選択肢イは適切な記述です。内的参照価格とは、消費者がある商品の価格を見て「高い」「安い」と判断する基準のうち、消費者自身の\n過去の購買経験から感覚的に判断する基準を指します。分かりやすく言うと、「この商品はこのくらいの価格で売られている」と顧客の\n中に刷り込まれた基準です。よって、仮に定番価格が 1.000 円の商品でも、698 円で売る特売を頻繁に繰り返していると、顧客の内的\n参照価格は 1.000 円ではなく 698 円に下がってしまいます。\n\n選択肢ウは不適切な記述です。特売による販売促進は、価格弾力性が高い商品ほどチラシで告知したときの集客効果が高くなります。\n価格弾力性とは、価格の変動に対する需要の変動の度合いのことです。つまり、商品の価格を上げたり下げたりしたとき、その商品の\n売れ行きがどの程度変わるかを表したものです。価格弾力性が低い商品は、価格の変化に対して売れ行きに大きな影響は表れません。\nしたがって、価格弾力性が低い商品をチラシで訴求しても集客効果は期待できません。ちなみに、価格弾力性の高い商品であれば、価\n格の変化に対して売れ行きが大きく連動しますので、チラシ掲載による集客効果が期待できます。\n\n選択肢エは不適切な記述です。ハイ・ロープライシング政策では、特売時における対象商品の販売数量を最大化すると、店全体の利益\n率は下がります。ハイ・ロープライシング政策とは、通常価格で販売する時期と、低価格で販売する時期を繰り返す価格政策です。特\n売時は価格を下げて販売するわけですから、一般的には仕入れの条件等が変わらなければ利益率は下がります。よって、ロープライス\nで提供する特売時の販売数量を最大化すれば、店全体の利益率は低下します。\n\n選択肢オは不適切な記述です。端数価格とは、500 円、1,000 円といったキリのよい価格設定ではなく、498 円、980 円といった端数で\n設定する価格政策です。これにより、その価格差は僅かでありながら、顧客には心理的にそれ以上の安さを感じさせる効果があります。\n\n小売業の価格政策と特売は、出題頻度が高いテーマです。価格政策の特徴とそれらに関連する用語について、理解を深めておきましょ\nう。"
  },
  {
    id: 5,
    title: "陳列 【平成 24 年 第 29 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "商品陳列方法とそのメリットに関する記述として、最も不適切なものはどれか。",
    options: [
      "カットケース陳列には、高級感を出しやすいというメリットがある。",
      "ゴンドラ陳列には、フェイスをそろえやすいというメリットがある。",
      "ジャンブル陳列には、ディスプレイに手間がかからないというメリットがある。",
      "ショーケース陳列には、商品が汚れにくいというメリットがある。",
      "フック陳列には、陳列されている商品の在庫量が分かりやすいというメリットがある。"
    ],
    correctIndex: 0,
    explanation: "解答：ア\n\n商品陳列方法に関する出題です。\nそれぞれの商品陳列方法の基本を押さえていれば正解できる問題です。\n\nそれでは選択肢を見ていきましょう。\n\n選択肢アについて、カットケース陳列は、商品が入っていたダンボール箱をカットしてそのまま陳列する方法です。カットケース陳\n列は、陳列の手間がかからず、安さを訴求できることから、ディスカウントストアなどでよく用いられています。選択肢アは、高級感\nが出しやすいメリットがある、としていますがこれは不適切です。よって、これが正解です。\n\n選択肢イについて、ゴンドラ陳列は、ゴンドラに商品を並べる陳列です。ゴンドラ陳列は、スーパーマーケットなどで、定番品の陳\n列などに用いられます。通常、ゴンドラ陳列では、棚に商品の前面が向くように並べて陳列します。選択肢イは、フェイスがそろえや\nすいメリットがある、としています。よって、選択肢イは適切です。\n\n選択肢ウについて、ジャンブル陳列は、投げ込み陳列とも呼ばれ、カゴの中に商品が大量に投げ込まれている陳列方法です。ジャン\nブル陳列は、小さい商品を 1 つずつ陳列する必要がないため陳列が容易です。選択肢ウは、ディスプレイに手間がかからないというメ\nリットがある、としています。よって、選択肢ウは適切です。\n\n選択肢エについて、ショーケース陳列は、その名の通り、ショーケースに入れて陳列する方法です。ショーケースは、多くの場合、\nガラスで覆われています。選択肢エは、商品が汚れにくいというメリットがある、としています。よって、選択肢エは適切です。\n\n選択肢オについて、フック陳列は、商品をフックで吊るす陳列です。陳列される商品にはフックがついていて、それをフック・バー\nにかけて吊るします。フック陳列を行うと、商品が見やすく、手に取る事も簡単です。選択肢オは、陳列されている商品の在庫量が分\nかりやすいというメリットがある、としています。フック陳列では、陳列されている商品の個数が一目で分かります。よって、選択肢\nオは適切です。\n\n陳列の方法は、名前を聞いたら具体的なイメージが湧くように復習しておきましょう。"
  },
  {
    id: 6,
    title: "陳列方法 【令和 2 年 第 29 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "店舗における売場づくりに関して、以下に示す【陳列手法】と【陳列の特徴】の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\n【陳列手法】\n① レジ前陳列\n② ジャンブル陳列\n③ フック陳列\n\n【陳列の特徴】\nａ 商品を見やすく取りやすく陳列でき、在庫量が把握しやすい。\nｂ 非計画購買を誘発しやすく、少額商品の販売に適している。\nｃ 陳列が容易で、低価格のイメージを演出できる。",
    options: [
      "①とａ　②とｂ　③とｃ",
      "①とａ　②とｃ　③とｂ",
      "①とｂ　②とａ　③とｃ",
      "①とｂ　②とｃ　③とａ",
      "①とｃ　②とａ　③とｂ"
    ],
    correctIndex: 3,
    explanation: "解答：エ\n\n陳列手法に関する問題です。基本的な知識を問う問題です。\n\n① レジ前陳列ですが非計画購買を誘発しやすく、少額商品の販売に適しています。したがって、b が適切な記述です。\n② ジャンブル陳列ですが、陳列が容易で割安感を抱かせるもので、c が適切な記述です。\n③ フック陳列は、フックバーに商品をかけて展開する陳列方法です。小型の文具等で使われることが多く、陳列されている商品の在庫\n量がわかりやすいというメリットがあります。したがって、a が適切な記述です。\n\n以上より、①－b、②－c、③－a が適切な組み合わせですので選択肢エが正解となります。"
  },
  {
    id: 7,
    title: "ビジュアル・マーチャンダイジング（VMD）【令和 3 年 第 29 問】",
    source: "過去問セレクト演習 3-8",
    category: "price",
    text: "ビジュアル・マーチャンダイジング（VMD）における 3 つの表現区分①〜③とその役割に関する記述 a〜c の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\n① IP（Item Presentation）\n② PP（Point of Sales Presentation）\n③ VP（Visual Presentation）\n\nａ ショーウインドーやステージなど特定の場所で行い、客の目をひきつけ誘導する。\nｂ 商品の特徴や機能を明示し、選択のヒントを示して客の判断を手助けする。\nｃ 単品商品を分類・整理し、見やすく、分かりやすく、選びやすく陳列し、購買欲求を高める。",
    options: [
      "①とａ",
      "①とｃ",
      "②とａ",
      "③とｂ",
      "③とｃ"
    ],
    correctIndex: 1,
    explanation: "解答：イ\n\nビジュアル・マーチャンダイジング（VMD）に関する出題です。\nそれぞれの意味を知らなかった場合でも、問題文に英語表記がありますので、ある程度推測して正解したい問題です。\n\nビジュアル・マーチャンダイジング（VMD）とは、視覚的にマーチャンダイジングをする手法です。品揃えや陳列だけでなく、什器や\nPOP などを含めて統一したコンセプトのもとに、売場を視覚的に訴求することで顧客に商品価値をわかりやすく提案してきます。例え\nば、ハロウィンやクリスマスなどのシーズンに、そのイベントをテーマとして関連商品を集めて陳列したり、ディスプレイや店内装飾\nを統一して展開している例が見られますが、これが VMD の一例です。\n\nでは、選択肢を見ていきましょう。\n\n① IP （Item Presentation）とは、売場の大半を占める商品陳列の場です。商品のサイズ・色・デザインなどをわかりやすく分類し、選\nびやすく、買いやすく陳列して購買意欲を高めます。よって①と c の組み合わせとなります。\n\n② PP （Point of Sales Presentation）とは、商品の特徴や機能を視覚的に表現し、型や色、コーディネートなどのバリエーションを顧客\nに提示し、商品の魅力を強調して見せる場です。よって②と b の組み合わせとなります。\n\n③ VP（Visual Presentation）とは、お店のコンセプトやシーズンテーマに基づくメッセージなど、常に新鮮な情報を視覚的に発信し、\n顧客を店内へ誘導するための重要な演出の場です。よって③と a の組み合わせとなります。\n\nよって、①と c、②と b、③と a が正しい組み合わせで、選択肢イが正解（本問では①が問われている選択肢構成）です。\n\nVMD の出題頻度は高くありませんので、学習に時間をかける必要はありませんが、実務では売上に直結するため非常によく使われま\nす。今後も基本的な知識は出題される可能性がありますので、VMD の考え方は覚えておきましょう。"
  },
  {
    id: 8,
    title: "インストア・マーチャンダイジング 【平成 26 年 第 31 問】",
    source: "過去問セレクト演習 3-8",
    category: "price",
    text: "インストアマーチャンダイジングに関する次の文中の空欄ＡとＢに入る語句の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\n客単価を上げるためには、インストアマーチャンダイジングを実践することが有効である。たとえば、Ａためにはマグネットポイント\nの配置を工夫することが重要である。また、棚の前に立ち寄った客の視認率を上げるためにはＢことが重要である。",
    options: [
      "Ａ：買上率を高める　Ｂ：ＣＲＭを実施する",
      "Ａ：買上率を高める　Ｂ：プラノグラムを工夫する",
      "Ａ：客の動線長を伸ばす　Ｂ：ＣＲＭを実施する",
      "Ａ：客の動線長を伸ばす　Ｂ：プラノグラムを工夫する"
    ],
    correctIndex: 3,
    explanation: "解答：エ\n\nインストアマーチャンダイジングに関する出題です。基本的な知識が穴埋めで問われており、取り組みやすい問題となっています。\n\nインストアマーチャンダイジングは、小売店内で顧客への販売を促進するための科学的手法です。簡単に言えば、1 人あたりの顧客の\n売上である客単価を増やすための手法を体系化したものです。\n\n客単価は分解すると、次のようになります。\n客単価 ＝ 動線長Ｘ立寄率Ｘ視認率Ｘ買上率Ｘ買上個数Ｘ商品単価\n\nでは、設問文を確認していきましょう。\n\n最初の空欄Ａに続く文章では、「マグネットポイントの配置を工夫する」とあります。マグネットポイントとは、目を引く商品を店奥に\n配置し、来店客の回遊性を高めて客動線を伸ばすための売場を指します。よって、空欄Ａは「買上率」ではなく、「客動線」に関する文\n章が適切です。\n\n続 いて、 空欄 Ｂ を 確認 し て み ま し ょ う 。「 棚 の 前 に 立 ち 寄 った 客 の 視認率 を 上 げ る 」 と あ り ま す。 CRM は、\nCustomerRelationshipManagement の略で、顧客関係管理のことです。顧客との関係を深めることで、顧客ロイヤルティを高め、収益\nを拡大しようとするマーケティング手法です。視認率を上げる事とは関係がありません。一方、プラノグラムは棚割計画のことです。棚\nのどの位置に、どの商品を、どれくらいのフェイス数で陳列するかを決める計画を指します。視認率に大きく影響しますので、空欄Ｂ\nは「プラノグラムの工夫」が適切です。\n\nよって、選択肢エが正解となります。"
  },
  {
    id: 9,
    title: "インストア・プロモーション 【平成 24 年 第 28 問】",
    source: "過去問セレクト演習 3-8",
    category: "price",
    text: "インストア・プロモーション（ISP）には価格主導型 ISP と非価格主導型 ISP がある。価格主導型 ISP として最も適切なものの組み合わせを下記の解答群から選べ。\n\na クロスマーチャンダイジング\nb サンプリング\nc 増量パック\nd バンドル販売",
    options: [
      "ａとｃ",
      "ａとｄ",
      "ｂとｃ",
      "ｂとｄ",
      "ｃとｄ"
    ],
    correctIndex: 4,
    explanation: "解答：オ\n\nインストア・プロモーションに関する出題です。\nインストア・プロモーションの種類と代表的な方法を押さえていれば正解できる問題です。\n\nまず、インストア・プロモーションについて簡単に復習しておきましょう。\n\n■ インストア・プロモーション\nインストア・プロモーションは、小売店内で行う積極的な販売促進活動です。インストア・プロモーションには、価格主導型と、非価格主導型の活\n動があります。価格主導型の活動には、特売や値引き、ポイントカードやクーポンなどがあります。非価格主導型の活動には、デモ販売や POP など\nがあります。本問では、価格主導型のインストア・プロモーションについて問われています。\n\nここまで押さえた上で選択肢を見ていきましょう。\n\n選択肢 a について、クロスマーチャンダイジングは、関連商品をまとめて陳列･演出することで、買上個数を増やす活動です。関連購\n買を促進することで、1 人あたりの買上個数を増やすことを目的としています。このように、クロスマーチャンダイジングは非価格主\n導型のインストア・プロモーションです。よって、選択肢 a は不適切です。\n\n選択肢 b について、サンプリングは、商品の見本を無料で消費者に提供することです。消費者はサンプリングの提供を受けることで、\n商品の存在を知ったり、商品の購入をすることがあります。このように、サンプリングは非価格主導型のインストア・プロモーション\nです。よって、選択肢 b は不適切です。\n\n選択肢 c について、増量パックは、価格はそのままで商品の容量を増やすことです。通常は期間限定で行われます。消費者に割安感\nを訴求して、購入を促します。このように、増量パックは価格主導型のインストア・プロモーションです。よって選択肢 c は適切です。\n\n選択肢 d について、バンドル販売は、商品をまとめて販売し、その場合に商品単価を引き下げることです。たとえば、１個 300 円の\n商品を、４個セットで 1000 円で販売する方法です。これによって割安感を演出し、消費者に購入を促します。このように、バンドル販\n売は価格主導型のインストア・プロモーションです。よって選択肢 d は適切です。\n\nこれらより、選択肢 c と d が適切であることが分かります。よって、解答群オが正解です。"
  },
  {
    id: 10,
    title: "棚割（プラノグラム） 【平成 24 年 第 31 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "棚割（プラノグラム）の目的に関する記述として、最も適切なものはどれか。",
    options: [
      "棚内のゾーニングの工夫によって客動線を長くすることができる。",
      "バーティカル陳列によって同じグループ内の商品比較がしやすい売場をつくることができる。",
      "フェイシングの工夫によって売上高や商品回転率を上げることができる。",
      "ホリゾンタル陳列によって商品グループ間の比較がしやすい売場をつくることができる。"
    ],
    correctIndex: 2,
    explanation: "解答：ウ\n\n棚割（プラノグラム）に関する出題です。\n棚割（プラノグラム）とは、棚の中の陳列位置やフェイス数を決めることです。\n陳列方法などの特徴を問われており、やや難易度が高い問題です。\n\nそれでは選択肢を見ていきましょう。\n\n選択肢アについて、客動線とは、買い物客が店内をどのように見て回るかということです。客動線が長くなるほど、たくさんの商品\nを見てもらうことができます。ゾーニングとは、売場で商品群ごとの配置領域を区画することです。商品群をどの位置に、どのくらい\nのスペースをとり、どのように配置するかということです。一般的に、ゾーニングを工夫することで、客動線を長くすることができま\nす。ただし、選択肢アでは、「棚内のゾーニング」としています。どの棚にどの商品群を置くかということによって客動線を長くするこ\nとはできますが、１つ棚の中で商品群の配置を変えても客動線は長くなるとは考えられません。よって、選択肢アは不適切です。\n\n選択肢イについて、バーティカル陳列とは、縦割り陳列とも呼ばれ、同じグループの商品を縦に並べる方法です。顧客が、買い物を\nするときは、横方向に売場を歩いていきます。\nここで、欲しい種類の商品があると立ち止まり、サイズや色などの細かいアイテムを探します。このとき、縦割り陳列になっている\nと、顧客は立ち止まったまま縦にアイテムを探すことができるため便利です。ただし、同じグループの商品を比較する場合は、上下を\n見て比べたり、下の方の商品はしゃがんで見る必要もあります。この場合は、横割り陳列（ホリゾンタル陳列）の方が便利です。よっ\nて、選択肢イは不適切です。\n\n選択肢ウについて、フェイシングとは、売場に陳列する商品と、その商品のフェイス数を決定することをいいます。フェイスとは、\n商品の顔のことであり、フェイス数は、顧客の目に触れる商品の数のことです。ある商品のフェイス数が多いほど、顧客の目に触れる\n機会が増えるため、売上は増加します。一方、裏の方に隠れている商品は、顧客の目に触れることがないため、陳列量が多くても売れ\nません。このように、フェイシングによって、売上や商品回転率は変わります。よって選択肢ウは適切であり、これが正解です。\n\n選択肢エについて、ホリゾンタル陳列とは、横割り陳列とも呼ばれ、同じグループの商品を横に並べる方法です。そのため、同じグ\nループの商品を比較しやすい売り場となります。一方で、他のグループ間の比較をしようとすると、上下を見て比べたり、下の方の商\n品はしゃがんで見たりする必要があります。この場合は、縦割り陳列の方が便利です。よって選択肢エは不適切です。"
  },
  {
    id: 11,
    title: "販売促進 【平成 28 年 第 32 問】",
    source: "過去問セレクト演習 3-8",
    category: "price",
    text: "小売業の販売促進の方法と主な目的に関する記述として、最も適切なものはどれか。",
    options: [
      "売り場におけるクロスマーチャンダイジングは、関連する商品同士を並べて陳列することで、計画購買を促進する狙いがある。",
      "エンドなどにおける大量陳列は、商品の露出を高めて買い忘れを防止するなど、計画購買を促進する狙いがある。",
      "会計時に発行するレシートクーポンは、次回来店時の計画購買を促進する狙いがある。",
      "試食販売などのデモンストレーション販売は、リピート購買を促進する狙いがある。",
      "新聞折り込みチラシは、お買い得商品の情報を伝えて、想起購買を促進する狙いがある。"
    ],
    correctIndex: 2,
    explanation: "解答：ウ\n\n小売店の販売促進に関する問題です。\n販売促進の概要を覚えていた人は、正解できる問題です。\n\n販売促進の方法にはいろいろな種類があります。ここでは、インストア・マーチャンダイジングと陳列方法を簡単に復習しましょう。\n\n■ 「インストア・マーチャンダイジング」と「陳列方法」\nインストアマーチャンダイジング（ISM）による方法としては、インストア・プロモーション（ISP）とスペースマネジメントがあります。インス\nトア・プロモーションには、価格主導型と、非価格主導型の活動があります。価格主導型の活動には、特売や値引き、ポイントカードやクーポンな\nどがあります。非価格主導型の活動には、デモ販売やサンプリング、クロスマーチャンダイジングなどがあります。\n陳列は、量感陳列と展示陳列に大別できます。量感陳列は、商品の豊富さにより最寄品の購買意欲を高める陳列方法です。展示陳列は、店舗の重\n要商品や買回品のテーマを設定してコーディネートなどを提案する陳列方法です。\n\nここまで押さえた上で、選択肢を見てみましょう。\n\n選択肢アについて、クロスマーチャンダイジングは関連商品をまとめて陳列･演出することで、買上個数を増やす活動です。クロスマ\nーチャンダイジングは関連購買により「非計画購買」を促進します。よって、選択肢アは不適切です。\n\n選択肢イについて、大量陳列は商品の豊富さを出して購買意欲を高めることにより「非計画購買」を促進します。よって、選択肢イ\nは不適切です。\n\n選択肢ウについて、レシートクーポンは次回の来店時にクーポンの商品を買うという計画購買を促進できます。よって、選択肢ウは\n適切です\n\n選択肢エについて、デモンストレーション販売は主に新商品販売に際して使われる手法であり、リピート販売の促進には向きません。\nよって、選択肢エは不適切です。\n\n選択肢オについて、新聞折り込みチラシは来店者にお買い得商品を記憶してもらうことにより計画購買を促進します。店頭で商品の\n必要性を思い出す想起購買を促すものではありませんので、選択肢オは不適切です。"
  },
  {
    id: 12,
    title: "売価値入率 【令和 2 年 第 30 問】",
    source: "過去問セレクト演習 3-8",
    category: "price",
    text: "下表の 5 種類の商品を仕入れて販売することを計画している。\n商品Ａ〜Ｅの中で、同じ売価に設定される商品が 2 つある。この 2 つの商品について、仕入れた数量をすべて設定した売価で販売したときの粗利益額の合計として、最も適切なものを下記の解答群から選べ。なお、それぞれの商品の売価は、売価値入率により設定されるものとする。",
    table: {
      headers: ["", "仕入単価", "仕入数量", "売価値入率"],
      rows: [
        ["商品A", "480 円", "50 個", "20 %"],
        ["商品B", "300 円", "60 個", "40 %"],
        ["商品C", "300 円", "100 個", "50 %"],
        ["商品D", "800 円", "30 個", "20 %"],
        ["商品E", "600 円", "40 個", "50 %"],
      ]
    },
    options: [
      "12,000 円",
      "36,000 円",
      "42,000 円",
      "60,000 円",
      "90,000 円"
    ],
    correctIndex: 1,
    explanation: "解答：イ\n\n売価値入率による売価設定と粗利益額に関する問題です。\n売価は仕入単価と売価値入率から以下の式で求められます。\n\n売価＝仕入単価/（1－売価値入率）\n各商品の売価値入率と粗利益額は次のようになります。\n\n商品 A：売価＝480/（1-0.2）＝600 粗利益額＝（600－480）×50＝6000\n商品 B：売価＝300/（1-0.4）＝500 粗利益額＝（500－300）×60＝12000\n商品 C：売価＝300/（1-0.5）＝600 粗利益額＝（600－300）×100＝30000\n商品 D：売価＝800/（1-0.2）＝1000 粗利益額＝（1000－800）×30＝6000\n商品 E：売価＝600/（1-0.5）＝1200 粗利益額＝（1200－600）×40＝24000\n\n以上より、商品 A と商品 C の売価が同じですので、\n6000＋30000＝36000 が合計額となり、選択肢イが正解となります。"
  },
  {
    id: 13,
    title: "GMROI 【平成 24 年 第 26 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "ある小売店では、年間売上高 2,900 万円、期首在庫高（原価）800 万円、期中仕入高 1,600 万円、期末在庫高（原価）700 万円であった。この店の GMROI として最も適切なものはどれか。",
    options: [
      "120％",
      "130％",
      "160％",
      "180％",
      "200％"
    ],
    correctIndex: 2,
    explanation: "解答：ウ\n\nGMROI に関する出題です。\nGMROI の計算式を押さえていれば正解できる問題です。\n\nまず、GMROI について簡単に復習しておきましょう。\n\n■ GMROI\nGMROI は、商品投下資本粗利益率のことであり、投下した商品に対する粗利益の割合を表します。GMROI を求める式は、次のとおりです。\nGMROI＝粗利益／平均在庫高（原価）\n粗利益は売上総利益と同じです。平均在庫高（原価）は、期首の商品の在庫高と期末の商品の在庫高を平均したものになります。\n\nでは、本問の数値を入れて GMROI を計算します。\n\nまず、平均在庫高を求めます。\n平均在庫高（原価）＝（期首在庫高（原価）＋期末在庫高（原価））÷2＝（800＋700）÷2＝750（百万円）\n\n次に、粗利益を求めます。売上高は与えられていますので、売上原価を求める必要があります。\n売上原価＝期首在庫高（原価）＋期中仕入高－期末在庫高（原価）＝800＋1,600－700＝1,700（百万円）\n\n粗利益＝売上高－売上原価＝2,900－1,700＝1,200（百万円）\n\nこれらの数値を使うと、GMROI が計算できます。\nGMROI＝粗利益÷平均在庫高（原価）＝1,200÷750＝1.6\n\nつまり、GMROI は 160％となります。\nよって、選択肢ウが正解です。\nGMROI は確実に計算できるようにしておきましょう。"
  },
  {
    id: 14,
    title: "交差比率（交差主義比率）【平成 27 年 第 32 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "商品予算計画に関する以下の用語とその算出方法の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\n＜用語＞\n① GMROI\n② 交差主義比率\n③ 商品回転率\n\n＜算出方法＞\nａ 粗利益÷平均商品在庫高（原価）\nｂ 粗利益率×商品回転率\nｃ 年間売上高÷平均商品在庫高（売価）",
    options: [
      "①：ａ　②：ｂ　③：ｃ",
      "①：ａ　②：ｃ　③：ｂ",
      "①：ｂ　②：ａ　③：ｃ",
      "①：ｂ　②：ｃ　③：ａ",
      "①：ｃ　②：ａ　③：ｂ"
    ],
    correctIndex: 0,
    explanation: "解答：ア\n\n商品予算計画で用いられる指標と、その算出方法に関する問題です。\n指標の意味を理解していれば正解できる問題です。\nそれでは選択肢の用語と算出方法を見ていきましょう。\n\n①GMROI（商品投下資本粗利益率：Gross Margin Return On Inventory Investment）\nGMROI は、投下した商品に対する粗利益の割合を表します。仕入れの側面から、投資の効率性を見る指標です。GMROI が高いと、\n投下した商品から効率的に粗利益を得ていることになります。\nGMROI ＝ 粗利益÷平均商品在庫高（原価）\nよって、計算式は a が適切です。\n\n②交差主義比率\n交差主義比率は、販売の側面から商品が効率的に粗利益を稼いでいるかを見る指標です。GMROI と同様に、投下した商品に対する粗\n利益の割合を表しますが、GMROI が商品在庫高を原価基準で計算するのに対して、交差主義比率では売価基準で計算します。\n交差主義比率 ＝ 粗利益÷平均商品在庫高（売価）\n ＝ 粗利益売上高 × 売上高平均商品在庫高\n ＝ 粗利益率×商品回転率\nよって、計算式は b が適切です。\n\n③商品回転率\n商品回転率とは、商品が一定期間にどれだけ回転（仕入れ→販売）したかを表すもので、販売の効率性を見る指標です。\n商品回転率の求め方には、売価ベース、原価ベース、数量ベースの３つ方法がありますが、本問題では売価ベースの算出方法が示され\nています。\n商品回転率（売価ベース） ＝ 売上高÷平均商品在庫高（売価）\n商品回転率（原価ベース） ＝ 売上原価÷平均商品在庫高（原価）\n商品回転率（数量ベース） ＝ 売上数量÷平均商品在庫高（数量）\nよって、計算式は c が適切です。\n\n以上より、①：a ②：b ③：c となり、選択肢アが正解です。"
  },
  {
    id: 15,
    title: "在庫管理 【令和 3 年 第 32 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "最寄品を主に取り扱う小売店舗における在庫管理に関する記述として、最も適切なものはどれか。",
    options: [
      "1 回当たりの発注量が一定の場合、サイクル在庫は一定になる。",
      "欠品を防止するために設定する安全在庫量は、需要量の標準偏差が 2 倍になると半分になる。",
      "定期発注方式を採用した場合、販売量を一定とすると、1 回当たりの発注量は発注から納品までの調達期間が長くなるほど少なくなる。",
      "定量発注方式を採用した場合、発注量の決定には発注間隔があらかじめ決定されている必要がある。",
      "発注点と補充点を設定して発注する方式を採用した場合、1 回当たりの発注量は販売量の増減にかかわらず一定になる。"
    ],
    correctIndex: 0,
    explanation: "解答：ア\n\n最寄品の在庫管理に関する出題です。在庫量を適正に維持するための発注方式について基本的な知識が問われています。様々な発注方\n式の細かな点まで理解している必要があり、やや難易度の高い問題です。\n\nでは、選択肢を見ていきましょう。\n\n選択肢アは適切な記述です。サイクル在庫とは、発注から次の発注までの期間に売れる量の半分を指します。言い換えると、1 回の発\n注量の半分の量です。例えば、1 週間に 1 回発注するとします。1 週間で売れる量が 20 個（発注量も 20 個）の場合、サイクル在庫は\n10 個です。よって、1 回あたりの発注量が一定であればサイクル在庫も一定となります。\n\n選択肢イは不適切な記述です。安全在庫は、急に売れたり、まとめ買いがあったり、あるいはメーカー側の欠品で入荷しなくなった場\n合に備えて、店舗側である程度多めに持っておく在庫のことです。安全在庫量は多過ぎると過剰在庫になり、少な過ぎると欠品を起こ\nしますので、適正量を設定する必要があります。正確に設定する場合は次の式で求めます。\n安全在庫 ＝ 安全在庫係数 × 需要量の標準偏差 × √ 調達リードタイム\n上式より、需要量の標準偏差が 2 倍になれば、安全在庫も 2 倍になります。\n但し、本問は計算式を覚えていなくても解答することができます。選択肢には「需要量の標準偏差が 2 倍になる」と難しく書いてあり\nますが、要するに「バラつきが 2 倍になる」ということです。売れ行きの振れ幅が 2 倍になるわけですから、安全在庫の量は半分には\nならないことがイメージできると思います。\n\n選択肢ウは不適切な記述です。定期発注方式は、一定期間ごとにその都度、発注量を決めて発注する方法です。販売量が一定の場合、\n発注から納品までの調達期間が長くなると、1 回当たりの発注量は多くなります。例えば、毎日 10 個ずつ売れていたとします。発注し\nてから商品が届くまでの期間が長くなればなるほど、その日数分の在庫を持っておく必要がありますので、1 回の発注量も必然的に多\nくなります。\n\n選択肢エは不適切な記述です。定量発注方式は、在庫量が一定の水準になったときに一定量を発注する方法です。発注量は経済的発注\n量で決定し、発注間隔は需要の変動に応じて基本的に毎回異なります。発注間隔をあらかじめ決めておく必要があるのは定期発注方式\nです。\n\n選択肢オは不適切な記述です。発注点と補充点を決めて発注する方法を「発注点・補充点方式」といいます。在庫量が発注点を下回っ\nたら、補充点まで発注します。このとき、発注量は現時点の在庫量を引いた数となります。例えば、補充点を 10 個、発注点を 4 個に設\n定したとします。在庫が 4 個を下回ったら、在庫が 10 個になるように発注しましょうという意味ですので、発注量は 10 個－4 個＝6\n個となります。ところが、残りの在庫がいつも 4 個とは限りません。一度にたくさん売れて 1 個になっているかもしれません。この場\n合は 9 個発注することになります。よって、発注点・補充点方式の場合、1 回当たりの発注量は一定ではなく、販売量の増減によって\n変動します。\n\n在庫管理は頻出テーマです。それぞれ発注方式の特徴は生産管理でも問われますので、しっかりと理解しておきましょう。"
  },
  {
    id: 16,
    title: "小売店舗の在庫管理 【令和 4 年 第 31 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "小売店舗における在庫管理に関する以下の文章の空欄Ａ〜Ｃに入る用語の組み合わせとして、最も適切なものを下記の解答群から選べ。\n\nある商品について、当該店舗の発注担当者は在庫量を毎日確認し、需要予測に基づいて必要と見込まれる数量を毎日発注している。ここで行われている発注方法を一般的に Ａ という。適正在庫を維持するためには、発注量を決めるための需要予測量を計算する期間をＢにする必要がある。また、毎日計算する発注量は、需要予測量と安全在庫の合計数量から発注時の Ｃ を減算して求める必要がある。",
    options: [
      "Ａ：定期発注方式　Ｂ：調達期間　Ｃ：手持在庫量",
      "Ａ：定期発注方式　Ｂ：調達期間と発注間隔の合計期間　Ｃ：手持在庫量",
      "Ａ：定期発注方式　Ｂ：調達期間と発注間隔の合計期間　Ｃ：有効在庫量",
      "Ａ：定量発注方式　Ｂ：調達期間　Ｃ：有効在庫量",
      "Ａ：定量発注方式　Ｂ：調達期間と発注間隔の合計期間　Ｃ：手持在庫量"
    ],
    correctIndex: 2,
    explanation: "解答：ウ\n\n小売店舗の在庫管理に関する出題です。適正在庫を維持するための需要予測や発注方式の基本的な知識が問われています。過去の本試\n験で何度も出題されているテーマです。\n\nでは、本問を見ていきましょう。\n\n空欄 A：定期発注方式とは、一定期間ごとに毎回、需要予測や在庫量を考慮して発注量を決めて発注する方式です。一方、定量発注方\n式とは、在庫量が一定の水準になったときに一定量を発注する方式です。設問文では、「発注担当者が在庫量を毎日確認し、需要予測に\n基づいて必要と見込まれる数量を毎日発注している」とありますので、「定期発注方式」が適切です。\n\n空欄 B：定期発注方式において、需要予測量を計算する期間は、発注サイクルと調達リードタイムをあわせた期間になります。したが\nって、「調達期間と発注間隔の合計期間」が適切です。\n\n空欄 C：定期発注方式で発注量を求める公式は、次の通りです。\n発注量 ＝ 在庫調整期間の需要予測量 － 現在の在庫量 － 発注残 ＋ 安全在庫\n現在の在庫量を手持在庫量といい、現在の在庫量に発注残を加えた量を有効在庫量といいます。したがって、発注時に計算する発注量\nは、需要予測量と安全在庫の合計数量から発注時の「有効在庫量」を引いた量となります。\n\n以上より、空欄に入る語句は、A ：定期発注方式、B ：調達期間と発注間隔の合計期間、C ：有効在庫量 となりますので、選択肢ウが\n正解です。\n\n在庫管理における発注方式は出題頻度の高いテーマです。生産管理の分野でもよく出題されますので、合格する上で確実に抑えておき\nたい知識です。特に定量発注方式と定期発注方式の違いはしっかり理解を深めておきましょう。"
  },
  {
    id: 17,
    title: "相乗積 1 【平成 25 年 第 31 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "小売業では、部門別などのグループごとに売上や粗利益などを管理する。そのひとつの指標として相乗積(利益相乗積係数)がある。小売店舗における相乗積に関する記述として、最も不適切なものはどれか。",
    options: [
      "ある部門の相乗積は、店舗全体の粗利益高に占める当該部門の粗利益高の割合を示す。",
      "ある部門の相乗積は、当該部門の売上高構成比と粗利益率の積である。",
      "すべての部門の相乗積の和は、店舗全体の粗利益率に等しくなる。",
      "部門ごとの相乗積を比較すると、最も利益を生み出している部門が分かる。"
    ],
    correctIndex: 0,
    explanation: "解答：ア\n\n相乗積に関する出題です。\n相乗積に関する基本的な内容を覚えていれば、正解できる問題です。\n\nまず、相乗積について簡単に復習しておきましょう。\n\n■ 相乗積\n相乗積とは、複数の部門を有する小売店において、各部門の収益貢献度を示す指標で、次のような計算式で表されます。\n相乗積 ＝ 各部門の売上高構成比 × 各部門の粗利益率\nまた、相乗積には、次のような性質があります。\n・各部門の相乗積の合計は、店舗全体の粗利益率と等しくなる。\n・各部門の相乗積は、店舗全体の売上高に対する、当該部門の粗利益高の割合を示す。\n\nそれでは選択肢を見ていきましょう。\n\n選択肢アについて、相乗積は、「店舗全体の粗利益高」ではなく、「店舗全体の売上高」に占める、当該部門の粗利益高の割合を示し\nます。よって、選択肢アは不適切で、正解です。なお、相乗積を求める式を分解すると以下のようになり、計算式からも相乗積が店舗\n全体の売上高に占める当該部門の粗利高の割合を示していることを導くことができます。\n相乗積＝各部門の売上高構成比×各部門の粗利益率\n ＝ 部門の売上高 / 店舗全体の売上高 × 部門の粗利益高 / 部門の売上高\n ＝ 部門の粗利益高 / 店舗全体の売上高\n\n選択肢イについて、ある部門の相乗積は、当該部門の売上高構成比と粗利益率を掛けたものとなります。よって、選択肢イは適切で\nす。\n\n選択肢ウについて、すべての部門の相乗積の合計は、全部門の粗利益高の合計を店舗全体の売上高で割ったものとなりますので、店\n舗全体の粗利益率に等しくなります。よって、選択肢ウは適切です。\n\n選択肢エについて、部門ごとの相乗積は、店舗全体の売上高に占める、当該部門の粗利益高の割合を示します。つまり相乗積が一番\n大きな部門が、一番利益を生み出している部門です。したがって、相乗積を比較することで、店舗の中で最も利益を生み出している部\n門が分かります。よって、選択肢エは適切です。\n\n相乗積に関する問題は、近年頻繁に出題されています。相乗積の計算方法と、その値が持つ意味について、しっかり理解しておきま\nしょう。"
  },
  {
    id: 18,
    title: "相乗積 2【令和元年 第 28 問】",
    source: "過去問セレクト演習 3-8",
    category: "inventory",
    text: "店舗Ｘのある月の営業実績は下表のとおりである。この表から計算される相乗積に関する記述として、最も適切なものを下記の解答群から選べ。",
    table: {
      headers: ["商品カテゴリー", "販売金額\n(万円)", "販売金額\n構成比(%)", "粗利益率\n(%)"],
      rows: [
        ["カテゴリーA", "500", "25", "20"],
        ["カテゴリーB", "300", "15", "20"],
        ["カテゴリーC", "200", "10", "30"],
        ["カテゴリーD", "600", "30", "40"],
        ["カテゴリーE", "400", "20", "50"],
        ["合計", "2,000", "100", ""]
      ]
    },
    options: [
      "カテゴリーＡ〜Ｅの合計の販売金額が 2 倍になると、各カテゴリーの相乗積の合計も 2 倍になる。",
      "カテゴリーＡの相乗積は 50%である。",
      "カテゴリーＡの販売金額も粗利益率も変わらず、他のカテゴリーの販売金額が増加すると、カテゴリーＡの相乗積は減少する。",
      "カテゴリーＢはカテゴリーＣよりも相乗積が大きい。",
      "相乗積が最も大きいカテゴリーは、カテゴリーＥである。"
    ],
    correctIndex: 2,
    explanation: "解答：ウ\n\n本問は、相乗積について問われています。基本的知識が問われており難易度は高くありません。\n\nでは、相乗積について復習しましょう。\n各カテゴリーの収益貢献度を示す指標である相乗積は、次の式で求められます。\n相乗積 ＝ 各カテゴリーの粗利益率 × 各カテゴリーの販売金額構成比\n\nでは、選択肢を見ていきましょう。\n\n選択肢アですが、各カテゴリーの販売金額が 2 倍になっても各カテゴリーの相乗積の合計が 2 倍にはならず、売上高構成比は変化し\nません。従って、不適切な記述です。\n\n選択肢イですが、カテゴリーA の相乗積は、カテゴリーA の粗利益率 20％×カテゴリーA の販売金額構成比 25％＝相乗積 5％とな\nりますので、50％とする記述は不適切です。\n\n選択肢ウですが、カテゴリーA の販売金額も粗利益率も変わらず、他のカテゴリーの販売金額が増加すると、カテゴリーA の売上高\n構成比が低下しますので、カテゴリーA の相乗積は減少します。従って、適切な記述です。\n\n選択肢エですが、カテゴリーB の相乗積は、粗利益率 20％×販売金額構成比 15％＝3％となります。カテゴリーC の相乗積は、粗利\n益率 30％×販売金額構成比 10％＝3％となり、双方とも相乗積は 3％で同じです。従って、不適切な記述です。\n\n選択肢オですが、カテゴリーE の相乗積は粗利益率 50％×販売金額構成比 20％＝10％となります。一方、カテゴリーD の相乗積は\n粗利益率 40％×販売金額構成比 30％＝12％となります。上記のように、カテゴリーA の相乗積は 5％、カテゴリーB は 3％、カテゴリ\nーC は 3％です。従って、相乗積が最も大きいカテゴリーは E ではなく、D になりますので、不適切な記述です。"
  }
];

// ==========================================
// 3. Main Application Component
// ==========================================
export default function App() {
  const [screen, setScreen] = useState('login');
  const screenRef = useRef('login'); // Guardrail for screen transitions

  const [secretKey, setSecretKey] = useState('');
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // User Data State
  const [userData, setUserData] = useState({
    history: {}, // { questionId: { correct: boolean, timestamp: number } }
    reviewList: {}, // { questionId: boolean }
    progressIndex: 0,
    progressMode: 'all', // 'all', 'wrong', 'review'
  });

  // Quiz Execution State
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedMode, setSelectedMode] = useState('all');
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);

  // Sync screen state with screenRef strictly
  const navigateTo = (newScreen) => {
    screenRef.current = newScreen;
    setScreen(newScreen);
  };

  // --- Auth & Data Fetching ---
  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!secretKey.trim()) return;

    navigateTo('loading');
    setIsLoading(true);

    try {
      // 1. Force Anonymous Auth
      await signInAnonymously(auth);

      // 2. Fetch User Data from Firestore
      const uid = `USER_${secretKey.trim()}`;
      setUserId(uid);
      const userDocRef = doc(db, APP_ID, uid);
      const userSnap = await getDoc(userDocRef);

      let fetchedData = {
        history: {},
        reviewList: {},
        progressIndex: 0,
        progressMode: 'all'
      };

      if (userSnap.exists()) {
        fetchedData = { ...fetchedData, ...userSnap.data() };
      } else {
        await setDoc(userDocRef, fetchedData);
      }

      setUserData(fetchedData);

      // 3. Screen transition logic
      if (fetchedData.progressIndex > 0) {
        navigateTo('resume_dialog');
      } else {
        navigateTo('dashboard');
      }
    } catch (error) {
      console.error("Login Error:", error);
      alert("通信エラーが発生しました。時間をおいて再試行してください。");
      navigateTo('login');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Resume Logic ---
  const handleResume = (resume) => {
    if (resume) {
      startQuiz(userData.progressMode, userData.progressIndex);
    } else {
      updateProgress(0, 'all');
      navigateTo('dashboard');
    }
  };

  // --- Data Savers ---
  const updateProgress = async (index, mode) => {
    if (!userId) return;
    const newData = { ...userData, progressIndex: index, progressMode: mode };
    setUserData(newData);
    try {
      await setDoc(doc(db, APP_ID, userId), newData, { merge: true });
    } catch (e) {
      console.error("Save Progress Error", e);
    }
  };

  const saveAnswer = async (qId, isCorrect) => {
    if (!userId) return;
    const newHistory = {
      ...userData.history,
      [qId]: { correct: isCorrect, timestamp: Date.now() }
    };
    const newData = { ...userData, history: newHistory };
    setUserData(newData);
    try {
      await setDoc(doc(db, APP_ID, userId), { history: newHistory }, { merge: true });
    } catch (e) {
      console.error("Save Answer Error", e);
    }
  };

  const toggleReview = async (qId) => {
    if (!userId) return;
    const isReviewed = !userData.reviewList[qId];
    const newReviewList = { ...userData.reviewList, [qId]: isReviewed };
    const newData = { ...userData, reviewList: newReviewList };
    setUserData(newData);
    try {
      await setDoc(doc(db, APP_ID, userId), { reviewList: newReviewList }, { merge: true });
    } catch (e) {
      console.error("Save Review Error", e);
    }
  };

  // --- Quiz Flow ---
  const startQuiz = (mode, startIndex = 0) => {
    let filtered = [];
    if (mode === 'all') {
      filtered = [...QUIZ_DATA];
    } else if (mode === 'wrong') {
      filtered = QUIZ_DATA.filter(q => userData.history[q.id] && !userData.history[q.id].correct);
    } else if (mode === 'review') {
      filtered = QUIZ_DATA.filter(q => userData.reviewList[q.id]);
    }

    if (filtered.length === 0) {
      alert("該当する問題がありません。");
      return;
    }

    setSelectedMode(mode);
    setCurrentQuestions(filtered);
    setCurrentQuestionIndex(startIndex);
    setIsAnswered(false);
    setSelectedOption(null);
    navigateTo('quiz');
  };

  const handleOptionSelect = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const question = currentQuestions[currentQuestionIndex];
    const isCorrect = index === question.correctIndex;
    
    saveAnswer(question.id, isCorrect);
    updateProgress(currentQuestionIndex + 1, selectedMode);
  };

  const handleNext = () => {
    if (currentQuestionIndex + 1 < currentQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      // Finished
      updateProgress(0, 'all');
      navigateTo('dashboard');
    }
  };

  const goHome = () => {
    // Progress is already saved during answering
    navigateTo('dashboard');
  };

  // --- Renderers ---

  const renderLogin = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-200 p-4">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center text-slate-100 mb-2">マーチャンダイジング</h1>
        <p className="text-center text-slate-400 mb-8 text-sm">過去問セレクト演習 3-8</p>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">合言葉 (ユーザーID)</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                placeholder="secret-key-123"
                autoFocus
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">入力した合言葉で学習進捗が他端末と同期されます。</p>
          </div>
          <button
            type="submit"
            disabled={!secretKey.trim() || isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <span>学習をはじめる</span>}
          </button>
        </form>
      </div>
    </div>
  );

  const renderResumeDialog = () => (
    <div className="min-h-screen flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-sm">
      <div className="max-w-md w-full bg-slate-800 p-8 rounded-xl shadow-2xl border border-slate-700 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-6">
          <RefreshCw className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-100 mb-4">中断データがあります</h2>
        <p className="text-slate-400 mb-8 leading-relaxed">
          前回は【{userData.progressMode === 'all' ? 'すべての問題' : userData.progressMode === 'wrong' ? '間違えた問題' : '要復習'}】モードの<br/>
          <strong className="text-indigo-400 text-lg">{userData.progressIndex}問目</strong>まで進んでいます。<br/>続きから再開しますか？
        </p>
        <div className="space-y-3">
          <button
            onClick={() => handleResume(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            続きから再開する
          </button>
          <button
            onClick={() => handleResume(false)}
            className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            新しく最初から始める
          </button>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => {
    const totalQ = QUIZ_DATA.length;
    const answeredCount = Object.keys(userData.history).length;
    const correctCount = Object.values(userData.history).filter(h => h.correct).length;
    const progressRate = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;
    const correctRate = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;
    const wrongCount = answeredCount - correctCount;
    const reviewCount = Object.values(userData.reviewList).filter(Boolean).length;

    // Calculate generic stats for Radar Chart
    // 1. 総合進捗率 (Progress)
    // 2. 全問正解率 (Correctness overall vs total)
    // 3. 回答正確性 (Accuracy of answered)
    // 4. 価格管理系 (Price)
    // 5. 在庫・店舗管理系 (Inventory)
    const priceQs = QUIZ_DATA.filter(q => q.category === 'price');
    const invQs = QUIZ_DATA.filter(q => q.category === 'inventory');
    
    const calcRate = (qs) => {
      if (!qs.length) return 0;
      const c = qs.filter(q => userData.history[q.id]?.correct).length;
      return Math.round((c / qs.length) * 100);
    };

    const radarData = [
      { subject: '総合進捗率', A: progressRate, fullMark: 100 },
      { subject: '全問に対する正解率', A: totalQ > 0 ? Math.round((correctCount / totalQ) * 100) : 0, fullMark: 100 },
      { subject: '回答精確性', A: correctRate, fullMark: 100 },
      { subject: '価格・プロモ手法', A: calcRate(priceQs), fullMark: 100 },
      { subject: '在庫・陳列管理', A: calcRate(invQs), fullMark: 100 },
    ];

    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 pb-20">
        <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="text-indigo-500" />
              <h1 className="font-bold text-slate-100">学習ダッシュボード</h1>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <User className="w-4 h-4" />
              <span>{secretKey}</span>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-xs font-semibold mb-1">総合進捗</div>
              <div className="text-2xl font-bold text-slate-100">{progressRate}<span className="text-sm font-normal text-slate-500">%</span></div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-xs font-semibold mb-1">正解数</div>
              <div className="text-2xl font-bold text-emerald-400">{correctCount}<span className="text-sm font-normal text-slate-500">/{totalQ}</span></div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-xs font-semibold mb-1">不正解 / 未実施</div>
              <div className="text-2xl font-bold text-rose-400">{wrongCount}<span className="text-sm font-normal text-slate-500"> / {totalQ - answeredCount}</span></div>
            </div>
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-end">
              <div>
                <div className="text-slate-400 text-xs font-semibold mb-1">要復習</div>
                <div className="text-2xl font-bold text-amber-400">{reviewCount}</div>
              </div>
              <Check className="text-slate-600 mb-1" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Radar Chart */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex flex-col">
              <h2 className="text-sm font-bold text-slate-100 mb-6 flex items-center"><BarChart2 className="w-4 h-4 mr-2 text-indigo-400" />スキルアナリティクス</h2>
              <div className="flex-grow min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#334155" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="User"
                      dataKey="A"
                      stroke="#818cf8"
                      fill="#6366f1"
                      fillOpacity={0.4}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-4 flex flex-col justify-center">
              <button
                onClick={() => startQuiz('all')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl flex items-center justify-between transition-transform transform active:scale-95 shadow-lg shadow-indigo-900/20"
              >
                <div className="text-left">
                  <div className="font-bold text-lg">すべての問題に挑戦</div>
                  <div className="text-indigo-200 text-xs mt-1">全{totalQ}問を通しで演習します</div>
                </div>
                <ChevronRight />
              </button>
              
              <button
                onClick={() => startQuiz('wrong')}
                disabled={wrongCount === 0}
                className="w-full bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 p-4 rounded-xl flex items-center justify-between transition-colors"
              >
                <div className="text-left">
                  <div className="font-bold">前回不正解の問題のみ</div>
                  <div className="text-slate-400 text-xs mt-1">対象: {wrongCount}問</div>
                </div>
                <ChevronRight className="text-slate-500" />
              </button>

              <button
                onClick={() => startQuiz('review')}
                disabled={reviewCount === 0}
                className="w-full bg-slate-800 border border-slate-700 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 p-4 rounded-xl flex items-center justify-between transition-colors"
              >
                <div className="text-left">
                  <div className="font-bold text-amber-400">要復習リストの問題のみ</div>
                  <div className="text-slate-400 text-xs mt-1">対象: {reviewCount}問</div>
                </div>
                <ChevronRight className="text-slate-500" />
              </button>
            </div>
          </div>

          {/* Question List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800/50">
              <h2 className="text-sm font-bold text-slate-100 flex items-center"><BookOpen className="w-4 h-4 mr-2 text-indigo-400" />問題一覧</h2>
            </div>
            <div className="divide-y divide-slate-700/50 max-h-[400px] overflow-y-auto">
              {QUIZ_DATA.map((q, idx) => {
                const hist = userData.history[q.id];
                const isReview = userData.reviewList[q.id];
                return (
                  <div key={q.id} className="p-4 flex items-center justify-between hover:bg-slate-750 transition-colors">
                    <div className="flex items-center space-x-4 overflow-hidden">
                      <div className="flex-shrink-0 w-8 h-8 rounded bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-400 border border-slate-700">
                        {idx + 1}
                      </div>
                      <div className="truncate">
                        <div className="text-sm font-medium text-slate-200 truncate">{q.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{q.source}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
                      {isReview && <div className="text-[10px] font-bold bg-amber-900/50 text-amber-400 px-2 py-1 rounded">要復習</div>}
                      {hist ? (
                        hist.correct ? 
                          <div className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center"><Check className="w-4 h-4 text-emerald-400" /></div> :
                          <div className="w-6 h-6 rounded-full bg-rose-900/50 flex items-center justify-center"><X className="w-4 h-4 text-rose-400" /></div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-600 border-dashed" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    );
  };

  const renderQuiz = () => {
    if (currentQuestions.length === 0) return null;
    const question = currentQuestions[currentQuestionIndex];
    const isCorrectInfo = isAnswered ? selectedOption === question.correctIndex : null;

    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col">
        {/* Header */}
        <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-20">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button onClick={goHome} className="text-slate-400 hover:text-white transition-colors p-2 -ml-2 rounded-lg hover:bg-slate-700">
                <Home className="w-5 h-5" />
              </button>
              <div className="text-sm font-medium text-slate-300">
                問 {currentQuestionIndex + 1} / {currentQuestions.length}
              </div>
            </div>
            <div className="text-xs font-medium px-3 py-1 bg-slate-900 rounded-full text-slate-400 border border-slate-700">
              {selectedMode === 'all' ? '全体演習' : selectedMode === 'wrong' ? '弱点克服' : '要復習'}
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-slate-900 w-full">
            <div 
              className="h-full bg-indigo-500 transition-all duration-300" 
              style={{ width: `${((currentQuestionIndex) / currentQuestions.length) * 100}%` }}
            />
          </div>
        </header>

        <main className="flex-grow max-w-3xl mx-auto w-full px-4 py-8 space-y-8">
          {/* Question Meta */}
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-100 leading-tight">{question.title}</h2>
            <div className="flex-shrink-0 text-[10px] font-bold bg-indigo-900/30 text-indigo-300 px-2 py-1 rounded ml-4 border border-indigo-800/50">
              {question.source}
            </div>
          </div>

          {/* Question Text & Graphics */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-sm leading-relaxed text-slate-200 text-sm whitespace-pre-wrap">
            {question.text}
            
            {/* Table Rendering if exists */}
            {question.table && (
              <div className="mt-6 overflow-x-auto text-sm border border-slate-700 rounded-lg">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-900/50">
                    <tr>
                      {question.table.headers.map((h, i) => (
                        <th key={i} className="p-3 border-b border-slate-700 font-medium text-slate-300 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {question.table.rows.map((row, i) => (
                      <tr key={i} className="even:bg-slate-800/50 odd:bg-slate-800 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30 transition-colors">
                        {row.map((cell, j) => (
                          <td key={j} className="p-3 text-slate-300">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            {question.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrectOpt = question.correctIndex === idx;
              
              let btnClass = "w-full text-left p-4 rounded-xl border transition-all duration-200 text-sm leading-relaxed flex items-start ";
              let iconContent = <div className="w-5 h-5 rounded-full border border-slate-500 mr-4 flex-shrink-0 mt-0.5" />;
              
              if (!isAnswered) {
                btnClass += "bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-500 text-slate-300";
              } else {
                if (isCorrectOpt) {
                  btnClass += "bg-emerald-900/20 border-emerald-500/50 text-emerald-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]";
                  iconContent = <div className="w-5 h-5 rounded-full bg-emerald-500 mr-4 flex-shrink-0 mt-0.5 flex items-center justify-center"><Check className="w-3 h-3 text-white" /></div>;
                } else if (isSelected && !isCorrectOpt) {
                  btnClass += "bg-rose-900/20 border-rose-500/50 text-rose-100";
                  iconContent = <div className="w-5 h-5 rounded-full bg-rose-500 mr-4 flex-shrink-0 mt-0.5 flex items-center justify-center"><X className="w-3 h-3 text-white" /></div>;
                } else {
                  btnClass += "bg-slate-800/50 border-slate-800 text-slate-500 opacity-60";
                }
              }

              return (
                <button
                  key={idx}
                  disabled={isAnswered}
                  onClick={() => handleOptionSelect(idx)}
                  className={btnClass}
                >
                  {iconContent}
                  <span className="pt-px">{opt}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation Area */}
          {isAnswered && (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-300">
              <div className={`p-6 rounded-xl border ${isCorrectInfo ? 'bg-emerald-900/10 border-emerald-900/50' : 'bg-rose-900/10 border-rose-900/50'} relative overflow-hidden`}>
                {/* Result Label */}
                <div className="flex items-center justify-between mb-6">
                  <div className={`flex items-center space-x-2 ${isCorrectInfo ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isCorrectInfo ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                    <span className="text-xl font-bold">{isCorrectInfo ? '正解' : '不正解'}</span>
                  </div>
                  <label className="flex items-center space-x-2 cursor-pointer group bg-slate-900 px-3 py-2 rounded-lg border border-slate-700">
                    <input 
                      type="checkbox" 
                      className="form-checkbox bg-slate-800 border-slate-600 rounded text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-900" 
                      checked={!!userData.reviewList[question.id]}
                      onChange={() => toggleReview(question.id)}
                    />
                    <span className="text-sm font-medium text-slate-300 group-hover:text-amber-400 transition-colors">要復習リスト</span>
                  </label>
                </div>
                
                {/* Text */}
                <div className="prose prose-invert max-w-none text-sm text-slate-300 leading-loose whitespace-pre-wrap">
                  <div className="flex items-center text-slate-400 mb-2 font-bold"><HelpCircle className="w-4 h-4 mr-2" />解説</div>
                  {question.explanation}
                </div>

                {/* Next Button */}
                <div className="mt-8 pt-6 border-t border-slate-700/50">
                  <button
                    onClick={handleNext}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-transform transform active:scale-95 flex items-center justify-center space-x-2 shadow-lg shadow-indigo-900/30"
                  >
                    <span>{currentQuestionIndex + 1 < currentQuestions.length ? '次の問題へ' : '結果を見る'}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  };

  // --- Main Render Switch ---
  return (
    <>
      {screenRef.current === 'login' && renderLogin()}
      {screenRef.current === 'loading' && (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-400 font-medium">学習データをロードしています...</p>
        </div>
      )}
      {screenRef.current === 'resume_dialog' && renderResumeDialog()}
      {screenRef.current === 'dashboard' && renderDashboard()}
      {screenRef.current === 'quiz' && renderQuiz()}
    </>
  );
}