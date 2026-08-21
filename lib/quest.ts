export type Category = 'STR' | 'INT' | 'CHA' | 'VIT' | 'LUK';
export type Stats = Record<Category, number>;
export type Rank = 'F' | 'D' | 'C' | 'B' | 'A' | 'S';

export interface Quest {
  title: string;
  category: Category;
  rank: Rank;
  objective: string;
  rewards: {
    exp: number;
    gold: number;
    loot: string;
  };
  flavor_text: string;
  debuff: string;
  completed: boolean;

  // ── 도구가 채우는 선택 필드 ──
  // 도구를 장착하면 AI가 여기에 값을 넣는다. 담을 곳이 없으면
  // AI는 지시를 받아도 JSON 형식을 지키느라 정보를 버린다.
  /** 「첫걸음의 신발」 — 처음 5분에 할 일 */
  first_step?: string;
  /** 「시간의 모래시계」 — 예상 소요 시간(분) */
  estimated_minutes?: number;
  /** 「훈련 일지」·「대화의 실마리」 등 — 도구가 덧붙이는 부가 정보 */
  tips?: string[];

  /**
   * 완료 시점에 실제로 받은 양. 장비 보너스와 디버프가 반영된 값이다.
   * 나중에 장비가 바뀌어도 그날의 기록은 그대로여야 하므로 저장해 둔다.
   */
  earned?: { exp: number; gold: number };

  /**
   * 완수하며 남긴 한 줄.
   *
   * 완료 버튼은 **누르는 것**을 보상할 뿐 실제로 한 일과 아무 연결이 없다.
   * 한 줄을 적게 하면 자기기만이 조금 어려워지고, 나중에 사가의 서에서
   * 그날 무엇을 했는지 실제 문장으로 남는다.
   */
  note?: string;
}

/**
 * 카테고리 → 파스텔 틴트 매핑. DESIGN.md의 고정 테이블.
 * 색은 오직 데이터를 나타낼 때만 쓴다 — 장식으로 쓰지 않는다.
 */
export const CATEGORY: Record<
  Category,
  {
    /** 세계관 이름. 화면에 크게 나오는 쪽 */
    name: string;
    /** 현실에서 무슨 일인지. 괄호로 따라붙는다 — 투두 앱이므로 뜻이 흐려지면 안 된다 */
    label: string;
    /** 그 자질이 무엇을 재는지 */
    lore: string;
    icon: string;
    tint: string;
    ink: string;
    bar: string;
  }
> = {
  // label은 QUEST_SYSTEM_PROMPT가 AI에게 지시하는 분류와 반드시 일치해야 한다
  STR: {
    name: '완력', label: '운동', lore: '몸을 밀어붙인 만큼 쌓인다',
    icon: '⚔', tint: 'bg-tint-rose', ink: 'text-str', bar: 'bg-str',
  },
  INT: {
    name: '지혜', label: '공부', lore: '읽고 익히고 만들어낸 흔적',
    icon: '✦', tint: 'bg-tint-sky', ink: 'text-int', bar: 'bg-int',
  },
  CHA: {
    name: '인망', label: '사교', lore: '사람과 마주 앉은 시간이 남긴 것',
    icon: '♥', tint: 'bg-tint-lavender', ink: 'text-cha', bar: 'bg-cha',
  },
  VIT: {
    name: '생명력', label: '건강', lore: '잘 자고 잘 먹은 날들의 총합',
    icon: '✚', tint: 'bg-tint-mint', ink: 'text-vit', bar: 'bg-vit',
  },
  LUK: {
    name: '여흥', label: '취미', lore: '쓸모없어 보이지만 결국 남는 것',
    icon: '★', tint: 'bg-tint-yellow', ink: 'text-luk', bar: 'bg-luk',
  },
};

export const CATEGORY_ORDER: Category[] = ['STR', 'INT', 'CHA', 'VIT', 'LUK'];

/**
 * 랭크는 틴트가 아니라 '보더 두께 + 브랜드 컬러'로 표현한다.
 * 색을 더 쓰면 카테고리 칩과 싸우기 때문.
 */
export const RANK: Record<Rank, { border: string; badge: string }> = {
  F: { border: 'border-2 border-ink', badge: 'border-2 border-ink bg-sunken text-ink-muted' },
  D: { border: 'border-2 border-ink', badge: 'border-2 border-ink bg-sunken text-ink-muted' },
  C: { border: 'border-[3px] border-ink', badge: 'border-2 border-ink bg-surface text-ink' },
  B: { border: 'border-[3px] border-ink', badge: 'border-2 border-ink bg-surface text-ink' },
  A: { border: 'border-[3px] border-primary', badge: 'border-2 border-primary bg-surface text-primary' },
  S: { border: 'border-[3px] border-primary', badge: 'border-2 border-primary bg-primary text-white animate-blink' },
};

export const EXP_PER_LEVEL = 100;

export const levelFromExp = (exp: number) => Math.floor(exp / EXP_PER_LEVEL) + 1;
export const expInLevel = (exp: number) => exp % EXP_PER_LEVEL;
