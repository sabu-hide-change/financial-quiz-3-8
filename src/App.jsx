// npm install lucide-react recharts

import React, { useState, useEffect } from 'react';
import { Home, ChevronRight, Check, X, RotateCcw, BarChart2, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- データ定義 ---
// 添付の問題集データをHTMLタグ付きで完全収録（表・条件等を含む）
const questionsData = [
  {
    id: 1,
    [cite_start]title: "マーチャンダイジング [cite: 1, 2]",
    [cite_start]text: "マーチャンダイジングについて、文中の空欄A～Dに入る用語の組合せとして、最も適切なものを下記の解答群より選べ。[cite: 3][cite_start]<br/><br/>マーチャンダイジングは、「5つの適正」を実現していく活動とも呼ばれる。5つの適正とは、適正な商品またはサービスを、適正なＡで、適正な時期に、適正な数量を、適正なＢで販売するように計画し、実行していく活動である。また、5つの適正の実現にあたっては、Ｃ、仕入、価格設定、陳列、Ｄなどの活動を最適化する必要がある。[cite: 4]",
    options: [
      [cite_start]"ア Ａ：方法　Ｂ：価格　Ｃ：品揃え　Ｄ：販売促進 [cite: 6]",
      [cite_start]"イ Ａ：方法　Ｂ：品質　Ｃ：顧客設定　Ｄ：宣伝活動 [cite: 7]",
      [cite_start]"ウ Ａ：場所　Ｂ：価格　Ｃ：品揃え　Ｄ：販売促進 [cite: 8]",
      [cite_start]"エ Ａ：場所　Ｂ：品質　Ｃ：顧客設定　Ｄ：宣伝活動 [cite: 9]"
    ],
    answerIndex: 2,
    [cite_start]explanation: "解答：ウ [cite: 11][cite_start]<br/><br/><table class='w-full border-collapse border border-gray-300 mb-4'><tr><th class='border border-gray-300 bg-blue-100 p-2'>ここが重要</th><td class='border border-gray-300 p-2'>本問ではマーチャンダイジングの定義（5つの適正）や、活動の構成要素が問われています。マーチャンダイジングとは、簡単にいえば、ターゲット顧客に、何を、いくらで、どのように提供するかを計画し、実行、管理していく活動です。</td></tr></table>[cite: 12][cite_start]<br/><b>Ａ：場所　Ｂ：価格</b><br/>AMA（アメリカ・マーケティング協会）によるマーチャンダイジングの定義では、「商品またはサービス」「場所」「時期」「数量」「価格」の5つの適正に関する諸計画（活動）としています。[cite: 13, 14][cite_start]<br/><br/><b>Ｃ：品揃え</b><br/>マーチャンダイジングは、充実した品揃えを実現し、販売するまでを中心とした活動です。顧客設定は含まれません。[cite: 15, 16][cite_start]<br/><br/><b>Ｄ：販売促進</b><br/>販売促進には、広告、パブリシティ、セールスプロモーション、人的販売の活動が含まれます。宣伝活動も販売促進の一つではありますが、ここではより広い活動として「販売促進」を選択するのが適切です。[cite: 17, 18, 19]"
  },
  {
    id: 2,
    [cite_start]title: "品揃え [cite: 20]",
    [cite_start]text: "品揃えに関する記述として、最も不適切なものはどれか。[cite: 21]",
    options: [
      [cite_start]"ア 経営資源の少ない中小小売店では、限定ライン戦略を取り、大型店との差別化を図るのが望ましい。[cite: 22]",
      [cite_start]"イ 商品アイテムを深くしすぎると、ストアコンセプトが不明確になりやすいので注意が必要である。[cite: 23]",
      [cite_start]"ウ 百貨店などに代表される大型店では、フルライン戦略をとり、さまざまな品種を取り扱うことが多い。[cite: 24]",
      [cite_start]"エ 商品ミックスとは、扱う品種とアイテムをどのように揃えるかということである。[cite: 25]"
    ],
    answerIndex: 1,
    [cite_start]explanation: "解答：イ [cite: 27][cite_start]<br/><br/><table class='w-full border-collapse border border-gray-300 mb-4'><tr><th class='border border-gray-300 bg-blue-100 p-2'>ここが重要</th><td class='border border-gray-300 p-2'>本問では品揃えについて問われています。<br/>●商品ミックス：商品ラインと商品アイテムをどのように組み合わせて、品揃えするかということ。<br/>●限定ライン戦略：商品ラインの幅を狭く絞り込み、商品アイテムを深くし、特定の品種の品揃えを豊富にする戦略。<br/>●フルライン戦略：商品ラインの幅を広くする戦略。</td></tr></table>[cite: 28][cite_start]<br/>ア ○：限定ライン戦略とは特定の品種の品揃えを豊富にする戦略です。中小小売店が大型店に対抗していくためには望ましいと言えます。[cite: 29, 30][cite_start]<br/>イ ×：商品アイテムを深くすることで、専門性が増しストアコンセプトがより明確になります。ストアコンセプトが不明確になるのは、「商品ラインの幅」を広げた場合です。よって不適切です。[cite: 31, 32][cite_start]<br/>ウ ○：百貨店に代表される大型店は、一般的にフルライン戦略をとります。[cite: 33, 34][cite_start]<br/>エ ○：商品ミックスとは、商品ライン（扱う品種）と商品アイテム（扱う品目）をどのように揃えるかということです。[cite: 35, 36]"
  },
  {
    id: 3,
    [cite_start]title: "データの相関関係 [cite: 37]",
    [cite_start]text: "商品A～Dの１年間における日別の売上金額について、２商品間の売上金額の相関係数を計算したところ、下表のようになった。これらの結果の解釈および相関係数の一般的な知識に関する記述として、最も適切なものを下記の解答群から選べ。[cite: 38][cite_start]<br/><br/><table class='w-full border-collapse border border-gray-300 my-4'><tr><th class='border border-gray-300 bg-gray-100 p-2'>組み合わせ</th><th class='border border-gray-300 bg-gray-100 p-2'>相関係数</th></tr><tr><td class='border border-gray-300 p-2'>商品Aの売上金額と商品Bの売上金額</td><td class='border border-gray-300 p-2'>0.3</td></tr><tr><td class='border border-gray-300 p-2'>商品Bの売上金額と商品Cの売上金額</td><td class='border border-gray-300 p-2'>0.5</td></tr><tr><td class='border border-gray-300 p-2'>商品Aの売上金額と商品Dの売上金額</td><td class='border border-gray-300 p-2'>-0.6</td></tr></table>[cite: 39]",
    options: [
      [cite_start]"ア 相関係数は、－100から100までの範囲の値として計算される。[cite: 40]",
      [cite_start]"イ 相関係数がマイナスの場合は、相関が弱いと判断される。[cite: 41]",
      [cite_start]"ウ 売上金額の相関関係の強さを見ると、商品Bは商品Aとの相関よりも、商品Cとの相関の方が強いと言える。[cite: 42]",
      [cite_start]"エ 商品Aと商品Dの相関関係をみると、どちらか一方の売上金額が増えても、もう一方の売上金額は影響を受けないと言える。[cite: 43]"
    ],
    answerIndex: 2,
    [cite_start]explanation: "解答：ウ [cite: 45][cite_start]<br/><br/>相関係数とは、２つのデータの関係を示す指標です。－１～１までの値を採ります。相関関係の絶対値が大きいほど、動きの関係性は強くなります。[cite: 46][cite_start]<br/>ア ×：相関係数は－1～1の数値をとります。[cite: 47, 48][cite_start]<br/>イ ×：相関係数がマイナスの場合は負の相関があることを示します。[cite: 49, 50][cite_start]<br/>ウ 〇：商品BとAの相関係数は0.3で、BとCの相関係数は0.5です。値（絶対値）が大きいほど相関が強いことを示しますので、適切な記述です。[cite: 51, 52][cite_start]<br/>エ ×：商品Aと商品Dは負の相関係数ですので、商品Aの売上が増えると、商品Dの売上が減るといった関係にあります。[cite: 53, 54]"
  },
  {
    id: 4,
    [cite_start]title: "仕入 [cite: 55]",
    [cite_start]text: "仕入の形態に関する記述として、最も適切なものはどれか。[cite: 56]",
    options: [
      [cite_start]"ア 消化仕入れにおいては、売れ残り商品を返品することができるため、返品処理の会計システムが必要になる。[cite: 57]",
      [cite_start]"イ 消化仕入れにおいては、商品の入荷時点で仕入計上を行うと共に、必要に応じて買掛金の会計処理を行う。[cite: 58]",
      [cite_start]"ウ 委託仕入れにおいては、売り手などから商品を仕入れた時点で、その商品の所有権は小売店側が持つことになる。[cite: 59]",
      [cite_start]"エ 消化仕入においては、在庫の資金負担や盗難リスクは、メーカーなどの納入業者が持つことになる。[cite: 60]"
    ],
    answerIndex: 3,
    [cite_start]explanation: "解答：エ [cite: 62][cite_start]<br/><br/><table class='w-full border-collapse border border-gray-300 mb-4'><tr><th class='border border-gray-300 bg-blue-100 p-2'>ここが重要</th><td class='border border-gray-300 p-2'>●買取仕入：小売業が商品を買い取って仕入れる方法。<br/>●委託仕入れ：メーカーなどの委託者が在庫の所有権を持ったまま、小売業が販売を行う方法。<br/>●消化仕入（売上仕入）：店頭に商品を置き、売れた分を同時に仕入として計上する方法。</td></tr></table>[cite: 63][cite_start]<br/>ア ×：消化仕入では財産の所有権はメーカー側にあるので、小売店側の資産としての返品処理は必要なく、複雑な会計処理は発生しません。[cite: 64, 65][cite_start]<br/>イ ×：消化仕入においては、販売と同時に仕入計上を行います。入荷時点で買掛金が発生することはありません。[cite: 66, 67][cite_start]<br/>ウ ×：委託仕入においては、メーカーなどの委託者が在庫の所有権を持ったまま、小売店が販売を行います。[cite: 68, 69][cite_start]<br/>エ ○：消化仕入れにおいては、販売と同時に仕入計上が行われますから、消費者が商品を購入するまでの間は、メーカーなどの納入業者側に商品の所有権があります。在庫の資金負担や盗難などのリスク負担も納入業者側が持つことになります。[cite: 70, 71]"
  },
  {
    id: 5,
    [cite_start]title: "価格決定 1 [cite: 72]",
    [cite_start]text: "小売業の価格決定に関する記述として、最も不適切なものはどれか。[cite: 73]",
    options: [
      [cite_start]"ア ある紳士服店のネクタイの売価（カッコ内は販売数）が、2,000円（35本）、5,000円（20本）、8,000円（8本）、10,000円（4本）であった場合、プライスポイントは5,000円である。[cite: 74]",
      [cite_start]"イ EDLP政策を採用した場合は、オペレーションコストをいかに下げ、高回転で商品を販売できるかが、小売店の利益を大きく左右する。[cite: 75]",
      [cite_start]"ウ 毎週特定の曜日に特売品を用意して低価格で販売することで集客し、特売以外の商品も購入してもらうことを意図した政策は、ロスリーダー政策にあたる。[cite: 76]",
      [cite_start]"エ ある靴店で、5,000円で仕入れたジョギングシューズの、値入額を1,000円に設定した。この時のジョギングシューズの販売価格は6,000円である。[cite: 77]"
    ],
    answerIndex: 0,
    [cite_start]explanation: "解答：ア [cite: 79][cite_start]<br/><br/>ア ×：プライスポイントとは、プライスラインの中で最も売れる価格帯のことです。選択肢の例では、販売数が最も多い2,000円となります。よって記述は不適切です。[cite: 81, 82][cite_start]<br/>イ ○：EDLP政策（エブリデーロープライス政策）を採用する小売店では、全体的に商品の値入率を下げ安価で販売します。オペレーションコストを徹底的に削減し大量に販売することで利益確保を目指します。[cite: 83, 84][cite_start]<br/>ウ ○：ロスリーダー政策では、目玉商品（ロスリーダー）の値入率を下げて集客し、他の値入率の高い商品も購入してもらうことで利益を確保します。[cite: 85, 86][cite_start]<br/>エ ○：「販売価格 ＝ 仕入価格 ＋ 値入額 」となるので、6,000円となります。[cite: 87, 88]"
  },
  {
    id: 6,
    [cite_start]title: "価格決定 2 [cite: 89]",
    [cite_start]text: "ある紳士服店で、単品で商品を販売した場合の価格と値入高が次のようになっている。今、スーツ・Ｙシャツ・ネクタイの3点をセット販売したときの売価を50,000円で設定した。この場合の売価値入率として、最も適切なものを下記の解答群から選べ。[cite: 90]<br/><br/><table class='w-full border-collapse border border-gray-300 my-4'><tr><th class='border border-gray-300 bg-orange-100 p-2'></th><th class='border border-gray-300 bg-orange-100 p-2'>スーツ</th><th class='border border-gray-300 bg-orange-100 p-2'>Yシャツ</th><th class='border border-gray-300 bg-orange-100 p-2'>ネクタイ</th></tr><tr><td class='border border-gray-300 p-2'>販売価格</td><td class='border border-gray-300 p-2'>45,000 円</td><td class='border border-gray-300 p-2'>7,000 円</td><td class='border border-gray-300 p-2'>3,000 円</td></tr><tr><td class='border border-gray-300 p-2'>値入高</td><td class='border border-gray-300 p-2'>10,000 円</td><td class='border border-gray-300 p-2'>3,000 円</td><td class='border border-gray-300 p-2'>2,000 円</td></tr></table>",
    options: [
      [cite_start]"ア 10% [cite: 92]",
      [cite_start]"イ 15% [cite: 93]",
      [cite_start]"ウ 20% [cite: 94]",
      [cite_start]"エ 25% [cite: 95]",
      [cite_start]"オ 30% [cite: 96]"
    ],
    answerIndex: 2,
    [cite_start]explanation: "解答：ウ [cite: 98][cite_start]<br/><br/>それぞれの商品の原価を求めると次のようになり、その合計は40,000円となります。<br/>・スーツ原価：45,000 - 10,000 = 35,000円<br/>・Yシャツ原価：7,000 - 3,000 = 4,000円<br/>・ネクタイ原価：3,000 - 2,000 = 1,000円<br/>原価合計 = 40,000円[cite: 101][cite_start]<br/><br/>セット販売の価格は50,000円ですから、値入額は10,000円(＝ 50,000円 － 40,000円）となり、売価値入率は 20%（＝ 10,000円 ÷ 50,000円）となります。[cite: 102]"
  },
  {
    id: 7,
    [cite_start]title: "価格決定 3 [cite: 104]",
    [cite_start]text: "ある店舗のTシャツの売価は、1000円、2000円、3000円、5000円であり、それぞれの販売数量が、30点、40点、20点、10点であった。プライスラインとプライスポイントの組み合わせとして、最も適切なものを下記の解答群から選べ。<br/>a 1000円、2000円、3000円、5000円<br/>b 4つ<br/>c 1000円<br/>d 2000円<br/>e 5000円[cite: 105, 106, 107, 108, 109, 110]",
    options: [
      [cite_start]"ア プライスライン：ａ、プライスポイント：ｃ [cite: 112]",
      [cite_start]"イ プライスライン：ａ、プライスポイント：ｄ [cite: 113]",
      [cite_start]"ウ プライスライン：ｂ、プライスポイント：ｅ [cite: 114]",
      [cite_start]"エ プライスライン：ｃ、プライスポイント：ｄ [cite: 115]",
      [cite_start]"オ プライスライン：ｅ、プライスポイント：ｄ [cite: 116]"
    ],
    answerIndex: 1,
    [cite_start]explanation: "解答：イ [cite: 118][cite_start]<br/><br/>プライスラインとは、段階的な価格帯の事を指します。[cite: 119][cite_start]<br/>プライスポイントとは、プライスラインの中で最も売れる価格帯の事を指します。[cite: 119][cite_start]<br/>ａ プライスライン：「1000円、2000円、3000円、5000円」は、段階的な価格帯といえます。[cite: 121][cite_start]<br/>ｄ プライスポイント：「2000円」は販売数量が40点で最も売れる価格帯です。[cite: 124][cite_start]<br/>よって正解はイです。[cite: 126]"
  },
  {
    id: 8,
    [cite_start]title: "陳列の原則 [cite: 127]",
    [cite_start]text: "商品陳列の原則の説明として、最も適切なものの組合せを下記の解答群から選べ。<br/>&lt;商品陳列の原則&gt;<br/>①:探しやすい陳列<br/>②:見やすい陳列<br/>③:選びやすい陳列<br/>④:手に取りやすい陳列<br/>&lt;陳列についての説明&gt;<br/>ａ:顧客が商品を触っても、崩れないように安定して配置すること。<br/>ｂ:商品が顧客の目につきやすいように、陳列の高さや陳列の量などを工夫すること。<br/>ｃ:顧客の立場から、どこに何があるかがすぐに分かるように工夫すること。<br/>ｄ:顧客が一目で似たような商品を比較できるよう、同じ用途の商品をまとめること。[cite: 128-138]",
    options: [
      [cite_start]"ア ①とｂ　②とc [cite: 139]",
      [cite_start]"イ ①とｃ　④とａ [cite: 140]",
      [cite_start]"ウ ②とｂ　③とｃ [cite: 141]",
      [cite_start]"エ ③とｄ　④とｂ [cite: 142]",
      [cite_start]"オ ④とａ　②とｃ [cite: 143]"
    ],
    answerIndex: 1,
    [cite_start]explanation: "解答：イ [cite: 145][cite_start]<br/><br/>正しい組合せは次のようになります。<br/>①:探しやすい陳列 － ｃ:顧客の立場から、どこに何があるかがすぐに分かるように工夫すること。[cite: 149][cite_start]<br/>②:見やすい陳列 － ｂ:商品が顧客の目につきやすいように、陳列の高さや陳列の量などを工夫すること。[cite: 150][cite_start]<br/>③:選びやすい陳列 － ｄ:顧客が一目で似たような商品を比較できるように、同じ用途の商品をまとめること。[cite: 151][cite_start]<br/>④:手に取りやすい陳列 － ａ:顧客が商品を触っても、崩れないように安定して配置すること。[cite: 152]"
  },
  {
    id: 9,
    [cite_start]title: "陳列の種類と方法 [cite: 153]",
    [cite_start]text: "陳列の種類と方法に関する記述として、最も不適切なものはどれか。[cite: 154]",
    options: [
      [cite_start]"ア 展示陳列は、テーマを設定して小物などと商品を一緒に陳列することで、商品を演出する方法で、洋服のコーディネートの提案などに向いている。[cite: 155]",
      [cite_start]"イ ゴンドラ陳列で用いられる前進立体陳列とは、一番手前に商品を積み重ねて陳列し、陳列しきれなくなったら、後ろ側に補充用の商品として置く陳列方法である。[cite: 156]",
      [cite_start]"ウ エンド陳列とは、ゴンドラエンドで行う陳列で、マグネットポイントとして利用することで、副通路への誘導が可能である。[cite: 157]",
      [cite_start]"エ 量感陳列は、商品の豊富さを顧客にアピールすることで購買意欲を高める効果があり、買回品の陳列によく用いられる。[cite: 158]"
    ],
    answerIndex: 3,
    [cite_start]explanation: "解答：エ [cite: 160][cite_start]<br/><br/>ア ○：展示陳列は、テーマを決めて商品を演出する陳列方法です。洋服のコーディネートの提案などに向いています。[cite: 162][cite_start]<br/>イ ○：前進立体陳列とは、手前の方に商品が積み上がるように陳列する方法です。[cite: 163][cite_start]<br/>ウ ○：ゴンドラエンドに特売品などを陳列し、マグネットポイントとして利用することで副通路に誘導できます。[cite: 164][cite_start]<br/>エ ×：量感陳列が適用される主な商品は、食料品や日用雑貨などの「最寄品」です。買回品ではありません。よって記述は不適切です。[cite: 165]"
  },
  {
    id: 10,
    [cite_start]title: "陳列方法 [cite: 166]",
    [cite_start]text: "陳列方法に関する記述として、最も不適切なものはどれか。[cite: 167]",
    options: [
      [cite_start]"ア カットケース陳列は、陳列の手間がかからず、安さを訴求できることから、ディスカウントストアなどでよく用いられる。[cite: 168]",
      [cite_start]"イ 島出し陳列は、陳列に変化を与えることで売場に活気を出し、顧客に注目させることができる。[cite: 169]",
      [cite_start]"ウ レジ前陳列は、顧客の目につきやすく、衝動買いを促進することができるため、高利益率の商品が陳列されるケースがよく見受けられる。[cite: 170]",
      [cite_start]"エ ジャンブル陳列は、高級腕時計や宝飾品など、高額商品のディスプレイでよく見受けられる。[cite: 171]"
    ],
    answerIndex: 3,
    [cite_start]explanation: "解答：エ [cite: 173][cite_start]<br/><br/>ア ○：カットケース陳列は、商品が入っていたダンボール箱をカットしてそのまま陳列する方法です。陳列の手間がかからず、ディスカウントストアなどでよく用いられます。[cite: 176][cite_start]<br/>イ ○：島出し陳列は、一部を通路側にはみ出して陳列する方法です。陳列に変化を与えることで活気を出し、顧客に注目させることができます。[cite: 177][cite_start]<br/>ウ ○：レジ周辺の商品は顧客の目に触れやすくなります。ついで買いや衝動買いを促進でき、高利益率の商品が陳列されるケースがよく見受けられます。[cite: 178][cite_start]<br/>エ ×：ジャンブル陳列は、投げ込み陳列とも呼ばれ、カゴの中に商品が大量に投げ込まれている陳列方法です。お買い得で安いといった印象を与えるため、電池やガムなど単価の安い商品に適していますが、高額商品の陳列には適していません。[cite: 179]"
  },
  {
    id: 11,
    [cite_start]title: "陳列の範囲 [cite: 180]",
    [cite_start]text: "陳列の範囲と方向に関する記述として、最も適切なものはどれか。[cite: 181]",
    options: [
      [cite_start]"ア 有効陳列範囲とは、顧客の手に届く範囲を指し、一般的にゴールデンゾーンよりも広い。[cite: 182]",
      [cite_start]"イ ゴールデンゾーンは、顧客が無理なく手に取ることができる範囲を指し、一般的に有効陳列範囲よりも広い。[cite: 183]",
      [cite_start]"ウ ホリゾンタル陳列は、同じ種類の商品を縦に並べる手法で、顧客はサイズや色の違いなどを立ち止まったまま縦方向に比較することができる。[cite: 184]",
      [cite_start]"エ バーチカル陳列は、同じ種類の商品を横に並べる手法で、顧客はサイズや色の違いなどを同じ目線の高さで横方向に比較することができる。[cite: 185]"
    ],
    answerIndex: 0,
    [cite_start]explanation: "解答：ア [cite: 187][cite_start]<br/><br/>ア ○：有効陳列範囲は、顧客の手に届く範囲（床から60cm～210cm）を指します。ゴールデンゾーンは、その中でさらに手に取りやすい範囲を指すため、有効陳列範囲の方が広いと言えます。[cite: 189][cite_start]<br/>イ ×：ゴールデンゾーンは有効陳列範囲よりも狭くなります。[cite: 190][cite_start]<br/>ウ ×：ホリゾンタル陳列は「横」に並べる手法です。縦方向に並べる手法はバーチカル陳列です。[cite: 191][cite_start]<br/>エ ×：バーチカル陳列は「縦」に並べる手法です。横方向に並べる手法はホリゾンタル陳列です。[cite: 192]"
  },
  {
    id: 12,
    [cite_start]title: "フェイシング管理 [cite: 193]",
    [cite_start]text: "商品のフェイス配分に関する記述として、最も不適切なものはどれか。[cite: 194]",
    options: [
      [cite_start]"ア ある商品のフェイス数を増やすほど、その商品の販売数はフェイス数に比例して増加する。[cite: 195]",
      [cite_start]"イ フェイス数を増やすことによって、機会損失を少なくすることができる。[cite: 196]",
      [cite_start]"ウ フェイス数の決定は、各品目の売上高をABC分析して行うのが効果的である。[cite: 197]",
      [cite_start]"エ フェイシングをより効果的に実現するため、天気や気温、季節なども考慮することが重要である。[cite: 198]"
    ],
    answerIndex: 0,
    [cite_start]explanation: "解答：ア [cite: 200][cite_start]<br/><br/>ア ×：フェイス数が増えると、一般的にはある範囲までは売上も増加します。しかし、ある範囲を超えると「限界効用逓減の法則」により、微増もしくは横ばいとなります。完全に比例し続けるわけではありません。[cite: 202, 203][cite_start]<br/>イ ○：フェイス数は店頭在庫量を意味するため、増やすと欠品が起こりにくくなり機会損失を防止できます。[cite: 204, 205][cite_start]<br/>ウ ○：ABC分析により売れ筋商品や死に筋商品が明確になり、効果的にフェイス数を決定できます。[cite: 206, 207][cite_start]<br/>エ ○：同じ品目でも天気や季節によって売れ行きが変わるため、これらの要素を加味することが重要です。[cite: 208, 209]"
  },
  {
    id: 13,
    [cite_start]title: "ビジュアルマーチャンダイジング(VMD) [cite: 210]",
    [cite_start]text: "ビジュアルマーチャンダイジング（VMD）について、文中の空欄A～Cに入る用語の組合せとして、最も適切なものを下記の解答群より選べ。[cite: 211][cite_start]<br/><br/>店舗コンセプトやシーズンテーマに基づくメッセージなど、常に新鮮な情報を視覚的に発信し、顧客を店内へ誘導するための売場をＡという。<br/>Ａに興味を持って入店した顧客に、商品の特徴や機能、型や色、コーディネートなどのバリエーションを提示し、商品の魅力を強調して見せる売場がＢである。<br/>顧客が商品を選びやすく、買いやすいように、サイズ・色・デザインなどをわかりやすく分類して陳列し、購買意欲を高めるための売場をＣという。[cite: 212, 213, 214]",
    options: [
      [cite_start]"ア Ａ：IP　Ｂ：PP　Ｃ：VP [cite: 216]",
      [cite_start]"イ Ａ：PP　Ｂ：IP　Ｃ：VP [cite: 217]",
      [cite_start]"ウ Ａ：VP　Ｂ：IP　Ｃ：PP [cite: 218]",
      [cite_start]"エ Ａ：VP　Ｂ：PP　Ｃ：IP [cite: 219]"
    ],
    answerIndex: 3,
    [cite_start]explanation: "解答：エ [cite: 221][cite_start]<br/><br/>Ａ：店舗コンセプト等を視覚的に発信し顧客を店内へ誘導する売場はVP（Visual Presentation）です。[cite: 224][cite_start]<br/>Ｂ：商品の特徴やバリエーションを提示し魅力を強調する売場はPP（Point of Sales Presentation）です。[cite: 226][cite_start]<br/>Ｃ：サイズ・色などを分類し、選びやすく買いやすく陳列する売場はIP（Item Presentation）です。[cite: 228][cite_start]<br/>以上より、選択肢エが正解です。[cite: 229]"
  },
  {
    id: 14,
    [cite_start]title: "インストアマーチャンダイジング 1 [cite: 230]",
    [cite_start]text: "インストアマーチャンダイジングについて、文中の空欄A～Dに入る用語の組合せとして、最も適切なものを下記の解答群より選べ。[cite: 231][cite_start]<br/><br/>インストアマーチャンダイジングは、小売店内での顧客の購買を高めるためのＡ手法であり、売上高を構成する要素のうち、Ｂを増やすための活動を展開する。インストアマーチャンダイジングの活動は、店内が中心になるため、あまり費用をかけずに実行できるというメリットがある。 この考えが生まれた背景には、調査の結果、買い物のうちＣが占める割合はわずか1割であり、残りの9割は店内で購買決定をするＤだったということがある。[cite: 232]",
    options: [
      [cite_start]"ア Ａ：経済的　Ｂ：客単価　Ｃ：最寄品購買　Ｄ：買回品購買 [cite: 233]",
      [cite_start]"イ Ａ：科学的　Ｂ：客単価　Ｃ：計画購買　　Ｄ：非計画購買 [cite: 234]",
      [cite_start]"ウ Ａ：科学的　Ｂ：来店客数　Ｃ：非計画購買　Ｄ：計画購買 [cite: 235]",
      [cite_start]"エ Ａ：経済的　Ｂ：来店客数　Ｃ：買回品購買　Ｄ：最寄品購買 [cite: 236]"
    ],
    answerIndex: 1,
    [cite_start]explanation: "解答：イ [cite: 238][cite_start]<br/><br/>Ａ：インストアマーチャンダイジングは、顧客への販売を促進するための「科学的」手法です。[cite: 240, 241][cite_start]<br/>Ｂ：売上高（来店客数×客単価）のうち、店内が中心となる活動は「客単価」を上げるための活動です。[cite: 242, 243][cite_start]<br/>Ｃ、Ｄ：来店前に決まっている「計画購買」は1割で、店内で決める「非計画購買」が9割を占めるという背景があります。[cite: 244, 245]"
  },
  {
    id: 15,
    [cite_start]title: "インストアマーチャンダイジング 2 [cite: 247]",
    [cite_start]text: "来店客の客単価を上げるためには、いくつかの要素がある。インストアマーチャンダイジングでは、これらの各要素を高めるための活動を実施するが、その内容に関する説明として、最も適切なものの組合せを下記の解答群から選べ。<br/>&lt;客単価を上げる構成要素の説明&gt;<br/>①:動線長の向上<br/>②:買上個数の向上<br/>③:商品単価の向上<br/>④:買上率の向上<br/>&lt;構成要素を向上する具体策の説明&gt;<br/>ａ:店内食材を利用した、ミールソリューションの実施<br/>ｂ:調理実演、および試食提供の実施<br/>ｃ:マグネットポイントの利用による副通路への誘導の実施<br/>ｄ:セット販売による値引きの実施。[cite: 248-258]",
    options: [
      [cite_start]"ア ①－ｃ　②－ｄ [cite: 260]",
      [cite_start]"イ ②－ａ　③－ｃ [cite: 261]",
      [cite_start]"ウ ①－ａ　④－ｂ [cite: 262]",
      [cite_start]"エ ④－ｃ　③－ａ [cite: 263]"
    ],
    answerIndex: 0,
    [cite_start]explanation: "解答：ア [cite: 265][cite_start]<br/><br/>①動線長の向上 － ｃ:マグネットポイントの利用による副通路への誘導の実施。顧客に店内を長く歩いてもらうための施策です。[cite: 268, 269][cite_start]<br/>②買上個数の向上 － ｄ:セット販売による値引きの実施。複数購入を促す施策です。[cite: 270, 271][cite_start]<br/>③商品単価の向上 － ａ:店内食材を利用したミールソリューションの実施。付加価値を付け単価を上げます。[cite: 272, 273][cite_start]<br/>④買上率の向上 － ｂ:調理実演、および試食提供の実施。購買を迷っている顧客を後押しします。[cite: 274, 275][cite_start]<br/>以上より、正しい組合せはアです。[cite: 276]"
  },
  {
    id: 16,
    [cite_start]title: "インストアマーチャンダイジング 3 [cite: 277]",
    [cite_start]text: "インストアマーチャンダイジングにおける、インストアプロモーション（以下、「ISP」という。）と、スペースマネジメントに関する記述として、最も不適切なものはどれか。[cite: 278]",
    options: [
      [cite_start]"ア スペースマネジメントとは、売り場生産性を高めるための手法である。[cite: 279]",
      [cite_start]"イ 価格弾力性の高い商品は、価格プロモーションを中心としたISPが有効である。[cite: 280]",
      [cite_start]"ウ プラノグラムでは、販売データに基づき店内の商品配置を決定する。[cite: 281]",
      [cite_start]"エ クロスマーチャンダイジングは、非価格主導型のISPに含まれる。[cite: 282]"
    ],
    answerIndex: 2,
    [cite_start]explanation: "解答：ウ [cite: 284][cite_start]<br/><br/>ア ○：スペースマネジメントは、販売データに基づき陳列場所や量を計画し、売場の生産性を向上させる活動です。[cite: 286, 287][cite_start]<br/>イ ○：価格弾力性の高い（価格変更で需要が大きく変わる）商品は、特売などの価格プロモーションが有効です。[cite: 288, 289][cite_start]<br/>ウ ×：プラノグラムとは「棚割り計画」のことで、棚の中の陳列位置やフェイス数を決める活動です。店内の商品配置（レイアウト）を決める活動は「スペースアロケーション」です。[cite: 290, 291][cite_start]<br/>エ ○：クロスマーチャンダイジング（関連商品をまとめて陳列する活動）は、価格を変えずに売上増加を目指すため、非価格主導型の活動に該当します。[cite: 292, 293]"
  },
  {
    id: 17,
    [cite_start]title: "カテゴリーマネジメント [cite: 294]",
    [cite_start]text: "カテゴリーマネジメントに関する記述として、最も適切なものはどれか。[cite: 295]",
    options: [
      [cite_start]"ア 清涼飲料水というカテゴリーを作り、複数あった配置場所を一箇所にまとめた。[cite: 296]",
      [cite_start]"イ 小売の視点で売れそうなカテゴリーを作り、そのカテゴリー単位で商品を管理する。[cite: 297]",
      [cite_start]"ウ 商品の品揃え･陳列･販売促進など、すべて小売業者が単独で決めて実施できる内容のため、比較的導入がしやすい。[cite: 298]",
      [cite_start]"エ カテゴリーを戦略的なビジネス単位として、商品構成などを管理する必要がある。[cite: 299]"
    ],
    answerIndex: 3,
    [cite_start]explanation: "解答：エ [cite: 301][cite_start]<br/><br/>ア ×：顧客の視点に立って（例「生活習慣病予防」など）カテゴリーを構築するものであり、単に飲料水をまとめただけではカテゴリーマネジメントとは言えません。[cite: 303, 304][cite_start]<br/>イ ×：「小売の視点」ではなく、「顧客の視点」から見たカテゴリーを作ります。[cite: 305, 306][cite_start]<br/>ウ ×：小売単独ではなく、メーカーや卸が参加してSCM全体が連動する必要があります。[cite: 307, 308][cite_start]<br/>エ ○：カテゴリーを戦略的ビジネス単位として管理し、消費者に価値を提供することによって業績を改善していきます。よって適切です。[cite: 309, 310]"
  },
  {
    id: 18,
    [cite_start]title: "人時生産性 [cite: 311]",
    [cite_start]text: "ある売場において、商品を400万円で仕入れ、５日間ですべての商品を販売することを計画している。この売場で４人の従業員が毎日それぞれ５時間ずつ労働し、売上高が800万円であった場合、この期間の人時生産性として、最も適切なものはどれか。[cite: 312]",
    options: [
      [cite_start]"ア 4万円 [cite: 313]",
      [cite_start]"イ 16万円 [cite: 314]",
      [cite_start]"ウ 20万円 [cite: 315]",
      [cite_start]"エ 80万円 [cite: 316]"
    ],
    answerIndex: 0,
    [cite_start]explanation: "解答：ア [cite: 318][cite_start]<br/><br/>人時生産性＝粗利益 ÷ 総労働時間 で計算します。[cite: 320][cite_start]<br/>粗利益 ＝ 売上高 － 売上原価（仕入） ＝ 800万円 － 400万円 ＝ 400万円 [cite: 321][cite_start]<br/>総労働時間 ＝ ５日 × ４人 × ５時間 ＝ 100時間 [cite: 322][cite_start]<br/>人時生産性 ＝ 400万円 ÷ 100時間 ＝ 4万円 [cite: 323][cite_start]<br/>よって、アが正解になります。[cite: 324]"
  },
  {
    id: 19,
    [cite_start]title: "GMROI（商品投下資本粗利益率） [cite: 325]",
    [cite_start]text: "ある小売店の営業実績は次の通りであった。この小売店のGMROIとして、最も適切なものを下記の解答群より選べ。<br/>売上高 2,000万<br/>仕入れ高 900万<br/>期首棚卸高(原価) 200万<br/>期末棚卸高(原価) 300万 [cite: 326-330]",
    options: [
      [cite_start]"ア 380% [cite: 332]",
      [cite_start]"イ 400% [cite: 333]",
      [cite_start]"ウ 480% [cite: 334]",
      [cite_start]"エ 500% [cite: 335]",
      [cite_start]"オ 550% [cite: 336]"
    ],
    answerIndex: 2,
    [cite_start]explanation: "解答：ウ [cite: 338][cite_start]<br/><br/>GMROI ＝ 粗利益 ÷ 平均在庫高（原価）[cite: 341][cite_start]<br/>粗利益 ＝ 売上高 － （期首棚卸高(原価) ＋ 仕入高 － 期末棚卸高(原価)）<br/>＝ 2,000万 － （200万 ＋ 900万 － 300万） ＝ 1,200万 [cite: 342, 343, 344][cite_start]<br/>平均在庫高（原価） ＝ （期首棚卸高(原価) ＋ 期末棚卸高(原価)） ÷ ２<br/>＝ （200万 ＋ 300万） ÷ ２ ＝ 250万 [cite: 345, 346, 347][cite_start]<br/>GMROI ＝ 1,200万 ÷ 250万 ＝ 480（％）[cite: 348]"
  },
  {
    id: 20,
    [cite_start]title: "交差比率（交差主義比率） [cite: 350]",
    [cite_start]text: "ある小売店の売上高粗利益率が30%、商品回転率（売価）が6回、商品回転率（原価）が4回である場合の交差比率（交差主義比率）の値として、最も適切なものはどれか。[cite: 351]",
    options: [
      "ア. [cite_start]120% [cite: 352]",
      "イ. [cite_start]180% [cite: 353]",
      "ウ. [cite_start]300% [cite: 354]",
      "エ. [cite_start]500% [cite: 355]"
    ],
    answerIndex: 1,
    [cite_start]explanation: "解答：イ [cite: 357][cite_start]<br/><br/>交差比率は次の式で求められます。<br/>交差比率 ＝ 売上高粗利益率 × 商品回転率（売価）[cite: 361, 363][cite_start]<br/>売上高粗利益率は30%、商品回転率（売価）は6回なので、これを用いて計算します。[cite: 364][cite_start]<br/>交差比率 ＝ 30% × 6回 ＝ 180% [cite: 366, 367][cite_start]<br/>※設問には商品回転率（原価）の値も与えられていますが、商品回転率（売価）を用いて計算する点に注意しましょう。[cite: 369]"
  },
  {
    id: 21,
    [cite_start]title: "商品予算計画 [cite: 370]",
    [cite_start]text: "ある小売店の商品予算計画に関する算出数値として、最も不適切なものはどれか。[cite: 371]",
    options: [
      [cite_start]"ア 1年間の粗利益が2,400万円、年間平均在庫高（原価）が800万円であった場合、GMROIは300%である。[cite: 372]",
      [cite_start]"イ 2,000円で仕入れた商品を、売価値入率20%で販売した場合、販売価格は2,500円である。[cite: 373]",
      [cite_start]"ウ 1年間の売上が1,800万円、期首と期末の棚卸高（売価）がそれぞれ、200万円、400万円であった場合、商品回転率（売価）は6回転である。[cite: 374]",
      [cite_start]"エ 当月売上高予算が300万円、年間売上高予算が3,600万円、年間予定商品回転数が4回転である場合、基準在庫法による月初適正在庫高は、800万円である。[cite: 375]",
      [cite_start]"オ 年間売上高予算が2,400万円、期首と期末の在庫高予算（売価）がそれぞれ、300万円、500万円であった場合、仕入高予算（売価）は、2,600万円である。[cite: 376]"
    ],
    answerIndex: 3,
    [cite_start]explanation: "解答：エ [cite: 378][cite_start]<br/><br/>ア ○：GMROI＝粗利益÷平均在庫高（原価）＝2,400万円÷800万円 ＝300% [cite: 380][cite_start]<br/>イ ○：売価＝原価÷（１－売価値入率）＝2,000円÷（１－0.2）＝2,500円 [cite: 381][cite_start]<br/>ウ ○：平均在庫（売価）＝(200万＋400万)÷2＝300万円。商品回転率（売価）＝売上÷平均在庫（売価)＝1,800万÷300万＝6回転 [cite: 382][cite_start]<br/>エ ×：月初在庫高予算＝当月売上高予算＋(年間売上高予算÷年間予定商品回転率)－(年間売上高予算÷12)＝300万円＋(3,600万÷4)－(3,600万÷12)＝900万円。800万円ではありません。[cite: 383][cite_start]<br/>オ ○：仕入高予算（売価）＝売上高予算＋期末在庫高予算（売価）－期首在庫高予算（売価）＝2,400万＋500万－300万＝2,600万円 [cite: 384]"
  },
  {
    id: 22,
    [cite_start]title: "相乗積 [cite: 385]",
    [cite_start]text: "3つの店舗からなる小売店がある。A店舗（粗利益率：10% ／ 売上高構成比：50%)、B店舗（粗利益率：15% ／ 売上高構成比：30%)、C店舗（粗利益率：20% ／ 売上高構成比：20%)の時、この小売店における相乗積に関する記述として、最も適切なものはどれか。[cite: 386]",
    options: [
      [cite_start]"ア 小売店全体の粗利益率は、15%である。[cite: 387]",
      [cite_start]"イ ある店舗の相乗積は、小売店全体の粗利益高に占める当該店舗の粗利益高の割合を示す。[cite: 388]",
      [cite_start]"ウ B店舗の相乗積は4.5%である。[cite: 389]",
      [cite_start]"エ 小売店全体の中で最も利益貢献度の高い店舗はC店舗である。[cite: 390]"
    ],
    answerIndex: 2,
    [cite_start]explanation: "解答：ウ [cite: 392][cite_start]<br/><br/>相乗積 ＝ 各部門の粗利益率 × 各部門の売上高構成比 [cite: 393][cite_start]<br/>・A店舗の相乗積＝10％×50％＝5％ [cite: 395][cite_start]<br/>・B店舗の相乗積＝15％×30％＝4.5％ [cite: 396][cite_start]<br/>・C店舗の相乗積＝20％×20％＝4％ [cite: 397][cite_start]<br/>ア ×：小売店全体の粗利益率は各店舗の相乗積の総和(13.5％)となります。[cite: 394][cite_start]<br/>イ ×：相乗積は、売上高構成比×粗利益率で求めます。選択肢の説明は構成比のことです。[cite: 398][cite_start]<br/>ウ ○：B店舗の相乗積は4.5％となります。[cite: 399][cite_start]<br/>エ ×：最も利益貢献度（相乗積）が高いのはA店舗(5%)です。[cite: 400]"
  }
];

// --- アプリケーション本体 ---
export default function App() {
  const [view, setView] = useState('home'); // 'home', 'quiz', 'result', 'history'
  const [quizMode, setQuizMode] = useState('all'); // 'all', 'incorrect', 'review'
  const [currentQuestions, setCurrentQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionResults, setSessionResults] = useState([]);
  
  // ユーザーデータのステート
  const [userData, setUserData] = useState({ history: [], review: [] });

  // 起動時にLocalStorageからデータ読み込み
  useEffect(() => {
    try {
      const stored = localStorage.getItem('smartQuizUserData');
      if (stored) {
        setUserData(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
      setUserData({ history: [], review: [] });
    }
  }, []);

  // userDataが更新されたらLocalStorageに保存
  useEffect(() => {
    try {
      localStorage.setItem('smartQuizUserData', JSON.stringify(userData));
      console.log("UserData saved to localStorage", userData);
    } catch (error) {
      console.error("Failed to save user data", error);
    }
  }, [userData]);

  // クイズ開始処理
  const startQuiz = (mode) => {
    let targetQuestions = [];
    if (mode === 'all') {
      targetQuestions = [...questionsData];
    } else if (mode === 'review') {
      targetQuestions = questionsData.filter(q => userData.review?.includes(q.id));
    } else if (mode === 'incorrect') {
      // 過去に不正解だったことがある問題（直近の結果のみで判定するなどの応用も可能）
      const incorrectIds = userData.history
        ?.filter(h => !h.isCorrect)
        .map(h => h.id);
      const uniqueIncorrectIds = [...new Set(incorrectIds)];
      targetQuestions = questionsData.filter(q => uniqueIncorrectIds.includes(q.id));
    }

    if (targetQuestions.length === 0) {
      alert('該当する問題がありません！');
      return;
    }

    setQuizMode(mode);
    setCurrentQuestions(targetQuestions);
    setCurrentIndex(0);
    setSessionResults([]);
    setIsAnswered(false);
    setSelectedOption(null);
    setView('quiz');
    console.log(`Started quiz in ${mode} mode with ${targetQuestions.length} questions`);
  };

  // 解答処理
  const handleAnswer = (index) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);
    
    const question = currentQuestions[currentIndex];
    const isCorrect = index === question.answerIndex;
    
    // 現在のセッションの記録
    setSessionResults(prev => [...prev, { id: question.id, isCorrect }]);
    
    // 履歴データの更新
    setUserData(prev => ({
      ...prev,
      history: [
        ...prev.history || [],
        { id: question.id, isCorrect, timestamp: new Date().toISOString() }
      ]
    }));
  };

  // 次の問題へ
  const handleNext = () => {
    if (currentIndex + 1 < currentQuestions.length) {
      setCurrentIndex(prev => prev + 1);
      setIsAnswered(false);
      setSelectedOption(null);
    } else {
      setView('result');
    }
  };

  // 要復習フラグの切り替え
  const toggleReview = (id) => {
    setUserData(prev => {
      const reviewList = prev.review || [];
      const newReview = reviewList.includes(id) 
        ? reviewList.filter(item => item !== id)
        : [...reviewList, id];
      return { ...prev, review: newReview };
    });
  };

  // --- 画面レンダリング ---
  
  const renderHome = () => (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
      <h1 className="text-2xl font-bold text-center mb-8 text-blue-800 border-b pb-4">
        スマート問題集：3-8 マーチャンダイジング
      </h1>
      
      <div className="space-y-4">
        <button 
          onClick={() => startQuiz('all')}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-between transition-colors"
        >
          <span className="flex items-center"><BookOpen className="mr-3" /> 全ての問題から出題 ({questionsData.length}問)</span>
          <ChevronRight />
        </button>
        
        <button 
          onClick={() => startQuiz('incorrect')}
          className="w-full py-4 px-6 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-semibold flex items-center justify-between transition-colors"
        >
          <span className="flex items-center"><RotateCcw className="mr-3" /> 前回不正解の問題</span>
          <ChevronRight />
        </button>
        
        <button 
          onClick={() => startQuiz('review')}
          className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold flex items-center justify-between transition-colors"
        >
          <span className="flex items-center"><Check className="mr-3" /> 要復習の問題のみ</span>
          <ChevronRight />
        </button>

        <button 
          onClick={() => setView('history')}
          className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-semibold flex items-center justify-between transition-colors mt-8"
        >
          <span className="flex items-center"><BarChart2 className="mr-3" /> 学習履歴を見る</span>
          <ChevronRight />
        </button>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const question = currentQuestions[currentIndex];
    const isReview = userData.review?.includes(question.id);

    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 bg-white rounded-xl shadow-lg mt-6">
        <div className="flex justify-between items-center mb-6 text-gray-500 text-sm">
          <span className="font-semibold text-blue-600">
            問題 {currentIndex + 1} / {currentQuestions.length}
          </span>
          <button onClick={() => setView('home')} className="flex items-center hover:text-gray-800">
            <Home size={16} className="mr-1" /> 中断
          </button>
        </div>

        <h2 className="text-xl font-bold mb-4 text-gray-800">{question.title}</h2>
        
        <div 
          className="mb-6 text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100"
          dangerouslySetInnerHTML={{ __html: question.text }}
        />

        <div className="space-y-3">
          {question.options.map((opt, idx) => {
            let btnClass = "w-full text-left p-4 rounded-lg border-2 transition-all ";
            
            if (!isAnswered) {
              btnClass += "border-gray-200 hover:border-blue-400 hover:bg-blue-50";
            } else {
              if (idx === question.answerIndex) {
                btnClass += "border-emerald-500 bg-emerald-50 font-bold";
              } else if (idx === selectedOption) {
                btnClass += "border-rose-500 bg-rose-50";
              } else {
                btnClass += "border-gray-200 opacity-50";
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={isAnswered}
                className={btnClass}
              >
                <div className="flex items-start">
                  <span className="mr-3 mt-1 flex-shrink-0">
                    {isAnswered && idx === question.answerIndex && <Check className="text-emerald-500" size={20} />}
                    {isAnswered && idx === selectedOption && idx !== question.answerIndex && <X className="text-rose-500" size={20} />}
                    {(!isAnswered || (idx !== question.answerIndex && idx !== selectedOption)) && <span className="w-5 inline-block" />}
                  </span>
                  <span>{opt}</span>
                </div>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <div className="mt-8 animate-fade-in">
            <div className={`p-4 rounded-t-lg font-bold text-lg text-white ${selectedOption === question.answerIndex ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {selectedOption === question.answerIndex ? '正解！' : '不正解...'}
            </div>
            <div className="border border-t-0 rounded-b-lg p-6 bg-white">
              <div 
                className="prose max-w-none text-gray-700 text-sm md:text-base"
                dangerouslySetInnerHTML={{ __html: question.explanation }}
              />
              
              <div className="mt-6 flex flex-col md:flex-row items-center justify-between pt-4 border-t border-gray-100">
                <label className="flex items-center cursor-pointer mb-4 md:mb-0 select-none">
                  <input
                    type="checkbox"
                    checked={isReview}
                    onChange={() => toggleReview(question.id)}
                    className="w-5 h-5 text-amber-500 rounded border-gray-300 focus:ring-amber-500"
                  />
                  <span className="ml-2 font-semibold text-gray-700">「要復習」に追加する</span>
                </label>
                
                <button
                  onClick={handleNext}
                  className="w-full md:w-auto px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex justify-center items-center"
                >
                  {currentIndex + 1 < currentQuestions.length ? '次の問題へ' : '結果を見る'} <ChevronRight className="ml-2" size={20} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderResult = () => {
    const correctCount = sessionResults.filter(r => r.isCorrect).length;
    const accuracy = Math.round((correctCount / currentQuestions.length) * 100);

    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10 text-center">
        <h2 className="text-3xl font-bold mb-6 text-gray-800">学習結果</h2>
        
        <div className="text-6xl font-black text-blue-600 mb-4">
          {accuracy}<span className="text-3xl text-gray-500 font-bold">%</span>
        </div>
        <p className="text-xl text-gray-600 mb-8">
          {currentQuestions.length}問中 <span className="font-bold text-gray-800">{correctCount}</span>問 正解
        </p>

        <div className="space-y-4 max-w-md mx-auto">
          <button 
            onClick={() => setView('home')}
            className="w-full py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-bold transition-colors flex justify-center items-center"
          >
            <Home className="mr-2" /> トップへ戻る
          </button>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    // 過去の回答状況を集計
    const stats = questionsData.map(q => {
      const histories = userData.history?.filter(h => h.id === q.id) || [];
      const correctTimes = histories.filter(h => h.isCorrect).length;
      return {
        id: q.id,
        title: q.title,
        totalAttempts: histories.length,
        correctTimes,
        accuracy: histories.length > 0 ? Math.round((correctTimes / histories.length) * 100) : 0,
        isReview: userData.review?.includes(q.id)
      };
    });

    return (
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg mt-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <BarChart2 className="mr-2" /> 学習履歴
          </h2>
          <button onClick={() => setView('home')} className="flex items-center text-blue-600 hover:underline font-semibold">
            <Home size={18} className="mr-1" /> トップへ戻る
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-sm">
                <th className="p-3 border-b">問題</th>
                <th className="p-3 border-b text-center">要復習</th>
                <th className="p-3 border-b text-center">正解率</th>
                <th className="p-3 border-b text-center">挑戦回数</th>
              </tr>
            </thead>
            <tbody>
              {stats.map(stat => (
                <tr key={stat.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-800 text-sm">{stat.title}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleReview(stat.id)}>
                      {stat.isReview ? <Check className="mx-auto text-amber-500" size={20} /> : <span className="text-gray-300">-</span>}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    {stat.totalAttempts > 0 ? (
                      <span className={`font-bold ${stat.accuracy >= 80 ? 'text-emerald-600' : stat.accuracy < 50 ? 'text-rose-500' : 'text-gray-700'}`}>
                        {stat.accuracy}%
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="p-3 text-center text-gray-600">{stat.totalAttempts}回</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 pb-12 font-sans">
      {view === 'home' && renderHome()}
      {view === 'quiz' && renderQuiz()}
      {view === 'result' && renderResult()}
      {view === 'history' && renderHistory()}
    </div>
  );
}