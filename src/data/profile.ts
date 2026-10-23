// サイトのコンテンツはこのファイルだけで管理する。
// 公開してよい情報だけを書くこと(電話番号・番地は載せない)。

export const profile = {
  name: 'Yuta Yamane',
  title: 'AIエンジニア',
  headline: ['AIエンジニア。'],
  lead: [
    'IT業界で約6年、フロントエンドを軸に開発してきました。React・TypeScript・Next.js を使い、Java でのバックエンドも経験しています。',
    '設計書づくりから実装、保守運用までを担当し、最近は Claude Code を使った AI 駆動開発に取り組んでいます。',
  ],
} as const;

export type Work = {
  title: string;
  kind: string;
  url: string;
  host: string;
  image: string;
  imageAlt: string;
  role: string;
  description: string;
  features: string[];
  tech: string[];
};

export const works: Work[] = [
  {
    title: 'Gotchahuman',
    kind: 'アーティストの公式サイト',
    url: 'https://gotchahuman.com/',
    host: 'gotchahuman.com',
    image: '/works/gotchahuman.webp',
    imageAlt: 'Gotchahuman のトップページ。作家の肖像と「Shigeru Hama」の見出しが並ぶ',
    role: 'デザイン・実装・運用',
    description:
      '京都を拠点に、紙・金属・蝋・昆虫などを使ったミクストメディアを制作する現代アート作家、ハマ シゲルさんの公式サイトです。作品、プロフィール、展覧会のお知らせを、作品の静けさを損なわない落ち着いた見た目でまとめました。作家本人が作品やお知らせを更新できる管理画面と、アクセス解析も備えています。',
    features: ['シリーズ別の作品ページ', 'コラム', 'プロフィール', 'お知らせ', 'Facebook の投稿表示', '更新用の管理画面', 'アクセス解析'],
    tech: ['Laravel 12', 'React 19', 'TypeScript', 'Inertia.js', 'Tailwind CSS v4', 'Vite', 'さくらのレンタルサーバ'],
  },
  {
    title: '出雲市お役立ちWEBサイト',
    kind: '地域の生活情報サイト(個人制作)',
    url: 'https://izumocity-support.vercel.app/',
    host: 'izumocity-support.vercel.app',
    image: '/works/izumocity-support.webp',
    imageAlt: '出雲市お役立ちWEBサイトのトップページ。稲佐の浜の写真と、機能への入口が並ぶ',
    role: 'デザイン・実装・運用',
    description:
      '出雲市の公式データとオープンデータを使い、暮らしに役立つ情報を1か所にまとめた非公式サイトです。品目からゴミの分別を調べたり、AED や避難所を地図で探したり、市の最新のお知らせを読んだりできます。お知らせは市の公式 RSS から取り込み、1時間ごとに自動で更新します。',
    features: ['ゴミ分別検索', 'リサイクルステーション', 'AED・避難所の地図', 'お知らせ(市公式 RSS)', '公共施設', '人口・世帯統計', '財政のグラフ'],
    tech: ['Next.js 16', 'React 19', 'TypeScript', 'Tailwind CSS v4', 'Mapbox GL', 'Recharts', 'Zod', 'Vercel'],
  },
];

export type Job = {
  role: string;
  start: string;
  end: string;
  duration: string;
  project: string;
  summary: string;
  result: string;
  tech: string[];
};

// 新しい順
export const jobs: Job[] = [
  {
    role: 'フロントエンドエンジニア',
    start: '2025.04',
    end: '2026.07',
    duration: '1年4ヶ月',
    project: '越境EC Webシステムの新規開発',
    summary:
      '主にフロントエンド開発を担当し、基本設計書・詳細設計書の作成にも携わりました。Claude Code を用いた AI 駆動開発に取り組み、直近ではバックエンド開発にも担当範囲を広げ、小規模な機能を一貫して対応しています。',
    result:
      'モダンなフロントエンド開発の経験が限られていたため、Udemy を個人契約して技術をキャッチアップし、実務に必要な知識を身につけながら開発を進めました。',
    tech: ['React', 'TypeScript', 'Next.js', 'Spring Boot', 'Java', 'MySQL', 'Cloud Spanner', 'Git / GitHub', 'Claude Code', 'Mermaid'],
  },
  {
    role: '社内SE・情報システム担当',
    start: '2024.09',
    end: '2025.02',
    duration: '6ヶ月',
    project: '社内業務改善・在庫管理Webシステムの新規開発',
    summary:
      '社内の情報システム担当として、RPA を使った手芸品の出品業務の開発・保守と、少人数体制での社内向け在庫管理 Web システムの新規開発を担当しました。',
    result: 'Java Servlet、JSP、PostgreSQL で、社内で使う在庫管理 Web システムを構築しました。',
    tech: ['Java', 'Java Servlet', 'JSP', 'PostgreSQL', 'RPA'],
  },
  {
    role: 'バックエンドエンジニア',
    start: '2022.07',
    end: '2023.03',
    duration: '9ヶ月',
    project: '銀行向け為替送金システムの新規開発',
    summary:
      '銀行の為替送金に関する新規システム開発に参加し、Java と、2000年代初期のフレームワーク WACs を使ったバックエンド開発を担当しました。',
    result: 'バックエンドの実装を中心に担当し、フロントエンドは JSP による仮画面の作成にも携わりました。',
    tech: ['Java', 'WACs', 'JSP'],
  },
  {
    role: 'システムエンジニア',
    start: '2019.04',
    end: '2022.05',
    duration: '3年2ヶ月',
    project: '鉄道会社向けチケット販売Webシステムの新規開発 / 官公庁Webシステムのリプレイス',
    summary:
      '鉄道会社のチケット販売 Web システムの新規開発に6ヶ月間従事し、多言語対応とバックエンド開発を担当しました。その後、官公庁 Web システムのリプレイスに伴うデータ移行作業に従事しました。',
    result: 'Web システム開発の基礎と、既存システムの改修・データ移行を経験しました。',
    tech: ['C#', 'ASP.NET', 'jQuery', 'Git'],
  },
];

export const skillGroups = [
  { name: 'フロントエンド', icon: 'web', items: ['React', 'TypeScript', 'Next.js', 'jQuery'] },
  { name: 'バックエンド', icon: 'dns', items: ['Java', 'Spring Boot', 'Java Servlet / JSP', 'C# / ASP.NET'] },
  { name: 'データベース', icon: 'database', items: ['MySQL', 'PostgreSQL', 'Cloud Spanner'] },
  { name: '開発の進め方', icon: 'account_tree', items: ['基本設計・詳細設計', 'Git / GitHub', 'Mermaid による設計図', 'Claude Code / Codex'] },
] as const;

export const certifications = [
  '基本情報技術者',
  'Ruby Association Certified Ruby Programmer Gold version 2.1',
] as const;
