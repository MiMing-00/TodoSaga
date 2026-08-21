import type { CosmeticArt } from './cosmetics';
import type { Category, Rank } from './quest';

/**
 * 아이템은 세 축으로 나뉜다 (docs/ITEMS.md).
 *   cosmetic  겉모습만 바꾼다
 *   equipment 게임 내 수치만 바꾼다 (강화 가능)
 *   tool      AI가 퀘스트를 만드는 방식을 바꾼다 — 실제로 쓸모 있는 축
 */
export type ItemAxis = 'cosmetic' | 'equipment' | 'tool' | 'nabi';

export type CosmeticSlot = 'head' | 'back' | 'hand';
export type EquipmentSlot = 'weapon' | 'armor' | 'trinket';
export type Slot = CosmeticSlot | EquipmentSlot | 'tool' | 'fur' | 'collar';

export const COSMETIC_SLOTS: CosmeticSlot[] = ['head', 'back', 'hand'];
export const EQUIPMENT_SLOTS: EquipmentSlot[] = ['weapon', 'armor', 'trinket'];
/** 도구는 2칸까지. 전부 켜면 AI 응답이 산만해진다. */
export const TOOL_SLOTS = 2;

export const SLOT_LABEL: Record<Slot, string> = {
  head: '머리',
  back: '등',
  hand: '손',
  weapon: '무기',
  armor: '방어구',
  trinket: '장신구',
  tool: '도구',
  fur: '털색',
  collar: '목장식',
};

export type EffectKind = 'exp' | 'gold' | 'categoryExp';

export interface ItemEffect {
  kind: EffectKind;
  /** categoryExp일 때만 */
  category?: Category;
  /** 기본 수치 (%). 강화 한 단계당 이 값의 10%p씩 오른다 */
  percent: number;
}

export interface ItemRequire {
  level?: number;
  stat?: { key: Category; value: number };
  /** 연속 기록 일수 — 시간으로 살 수 없는 유일한 조건 */
  streak?: number;
}

export interface Item {
  id: string;
  name: string;
  axis: ItemAxis;
  slot: Slot;
  rank: Rank;
  /** null이면 공용. Category면 그 직업만 장착 가능 */
  classLock: Category | null;
  require?: ItemRequire;
  /** equipment 전용 */
  effect?: ItemEffect;
  /** tool 전용 — QUEST_SYSTEM_PROMPT에 덧붙는 문장 */
  prompt?: string;
  /** 소모품이면 true (쉬어가기 부적 등) */
  consumable?: boolean;
  /** 상점 판매가. 없으면 상점에 없다 */
  price?: number;
  /** 뽑기에서만 나온다 */
  gachaOnly?: boolean;
  /** 연속 기록 보상으로만 얻는다. 뽑기·드랍·조합 어디에도 나오지 않는다 */
  streakOnly?: boolean;
  /** 치장 전용 — 캐릭터에 겹쳐 그릴 모양과 색 */
  art?: CosmeticArt;
  desc: string;
}

// ─────────────────────────────────────────────
// 치장 — 공용 70% / 직업 전용 30%
// ─────────────────────────────────────────────

const COSMETICS: Item[] = [
  // 공용
  { id: 'c_straw_hat', art: { shape: 'hat_brim', color: '#E3C67A', accent: '#B99A4C' }, name: '밀짚모자', axis: 'cosmetic', slot: 'head', rank: 'F', classLock: null, price: 100, desc: '햇볕은 막아준다.' },
  { id: 'c_hood', art: { shape: 'hood', color: '#8C7A5B', accent: '#63553E' }, name: '여행자의 두건', axis: 'cosmetic', slot: 'head', rank: 'D', classLock: null, price: 200, desc: '어디로든 갈 수 있을 것 같다.' },
  { id: 'c_cat_ears', art: { shape: 'ears', color: '#6B6154', accent: '#4A4239' }, name: '고양이 귀', axis: 'cosmetic', slot: 'head', rank: 'C', classLock: null, gachaOnly: true, desc: '왜 쓰는지는 묻지 말자.' },
  { id: 'c_crown', art: { shape: 'crown', color: '#F5C542', accent: '#B8880F' }, name: '나비 왕관', axis: 'cosmetic', slot: 'head', rank: 'A', classLock: null, gachaOnly: true, desc: '나비가 인정한 자에게만.' },
  { id: 'c_worn_cape', art: { shape: 'cape', color: '#9A8A6B', accent: '#6F624A' }, name: '낡은 망토', axis: 'cosmetic', slot: 'back', rank: 'F', classLock: null, price: 100, desc: '많이 걸어본 천.' },
  { id: 'c_traveler_cape', art: { shape: 'cape', color: '#6B7A8C', accent: '#4A5666' }, name: '여행자의 망토', axis: 'cosmetic', slot: 'back', rank: 'D', classLock: null, price: 250, desc: '먼지 냄새가 밴다.' },
  { id: 'c_butterfly_wings', art: { shape: 'tail', color: '#D9A05B', accent: '#A9773A' }, name: '나비의 꼬리', axis: 'cosmetic', slot: 'back', rank: 'S', classLock: null, gachaOnly: true, desc: '나비가 제 꼬리를 하나 내어주었다. 뽑기에서만 만날 수 있다.' },
  { id: 'c_lantern', art: { shape: 'held_small', color: '#F5C542', accent: '#7C5A12' }, name: '작은 등불', axis: 'cosmetic', slot: 'hand', rank: 'D', classLock: null, price: 200, desc: '밤에도 한 걸음은 보인다.' },
  { id: 'c_flower', art: { shape: 'held_small', color: '#FF8FBF', accent: '#2E7D32' }, name: '들꽃 한 송이', axis: 'cosmetic', slot: 'hand', rank: 'C', classLock: null, price: 400, desc: '오는 길에 주웠다.' },
  { id: 'c_ribbon', art: { shape: 'band', color: '#FF6FA5', accent: '#C43C74' }, name: '리본', axis: 'cosmetic', slot: 'head', rank: 'F', classLock: null, price: 100, desc: '묶으면 기분이 산다.' },
  { id: 'c_scarf', art: { shape: 'scarf', color: '#E05C5C', accent: '#A33A3A' }, name: '목도리', axis: 'cosmetic', slot: 'back', rank: 'D', classLock: null, price: 200, desc: '목이 따뜻하면 하루가 길어진다.' },
  { id: 'c_sign', art: { shape: 'held_flat', color: '#A97F4E', accent: '#6E5030' }, name: '나무 팻말', axis: 'cosmetic', slot: 'hand', rank: 'F', classLock: null, price: 100, desc: '아무것도 안 적혀 있다.' },
  { id: 'c_bell', art: { shape: 'held_small', color: '#E0C060', accent: '#8A6E1E' }, name: '작은 종', axis: 'cosmetic', slot: 'hand', rank: 'D', classLock: null, price: 200, desc: '걸을 때마다 딸랑거린다.' },
  { id: 'c_old_map', art: { shape: 'held_flat', color: '#E8DFC0', accent: '#A2925F' }, name: '낡은 지도', axis: 'cosmetic', slot: 'hand', rank: 'C', classLock: null, price: 400, desc: '어디 지도인지는 모른다.' },
  { id: 'c_hundred_crown', streakOnly: true, art: { shape: 'crown', color: '#F5C542', accent: '#7C5A12' }, name: '백일의 화관', axis: 'cosmetic', slot: 'head', rank: 'S', classLock: null, require: { streak: 100 }, desc: '백 일을 하루도 빠지지 않은 사람만 쓴다.' },
  { id: 'c_star_shard', art: { shape: 'held_small', color: '#FFF2A8', accent: '#E0B93A' }, name: '별 조각', axis: 'cosmetic', slot: 'hand', rank: 'A', classLock: null, gachaOnly: true, desc: '밤에 조금 빛난다.' },

  // 직업 전용
  { id: 'c_horned_helm', art: { shape: 'helm', color: '#9F1239', accent: '#5E0A22' }, name: '뿔투구', axis: 'cosmetic', slot: 'head', rank: 'C', classLock: 'STR', price: 500, desc: '무겁지만 폼은 난다.' },
  { id: 'c_battle_cape', art: { shape: 'cape', color: '#9F1239', accent: '#5E0A22' }, name: '붉은 전투 망토', axis: 'cosmetic', slot: 'back', rank: 'B', classLock: 'STR', price: 900, desc: '휘날릴 때가 가장 좋다.' },
  { id: 'c_star_hat', art: { shape: 'cap_pointy', color: '#1E40AF', accent: '#7DD3FC' }, name: '별무늬 고깔', axis: 'cosmetic', slot: 'head', rank: 'C', classLock: 'INT', price: 500, desc: '뾰족할수록 지혜롭다는 미신.' },
  { id: 'c_star_robe', art: { shape: 'cape', color: '#1E40AF', accent: '#152C7A' }, name: '별의 로브', axis: 'cosmetic', slot: 'back', rank: 'B', classLock: 'INT', price: 900, desc: '밤하늘을 잘라 만들었다.' },
  { id: 'c_feather_hat', art: { shape: 'band', color: '#5B21B6', accent: '#D9A05B' }, name: '깃털 모자', axis: 'cosmetic', slot: 'head', rank: 'C', classLock: 'CHA', price: 500, desc: '인사할 때 벗으면 좋다.' },
  { id: 'c_score_cape', art: { shape: 'cape', color: '#5B21B6', accent: '#3F1580' }, name: '악보 망토', axis: 'cosmetic', slot: 'back', rank: 'B', classLock: 'CHA', price: 900, desc: '펼치면 노래가 적혀 있다.' },
  { id: 'c_monk_hood', art: { shape: 'hood', color: '#166534', accent: '#0E4021' }, name: '수도 두건', axis: 'cosmetic', slot: 'head', rank: 'C', classLock: 'VIT', price: 500, desc: '고요해지는 기분이 든다.' },
  { id: 'c_holy_cloth', art: { shape: 'cape', color: '#166534', accent: '#86EFAC' }, name: '성포', axis: 'cosmetic', slot: 'back', rank: 'B', classLock: 'VIT', price: 900, desc: '아침마다 빨아 입는다.' },
  { id: 'c_bandana', art: { shape: 'hood', color: '#854D0E', accent: '#5A3308' }, name: '삼각 두건', axis: 'cosmetic', slot: 'head', rank: 'C', classLock: 'LUK', price: 500, desc: '바람을 덜 맞는다.' },
  { id: 'c_backpack', art: { shape: 'pack', color: '#854D0E', accent: '#5A3308' }, name: '여행 배낭', axis: 'cosmetic', slot: 'back', rank: 'B', classLock: 'LUK', price: 900, desc: '뭐가 들었는지는 본인도 모른다.' },
];

// ─────────────────────────────────────────────
// 장비 — 수치만 바꾼다. 강화 대상
// ─────────────────────────────────────────────

const EQUIPMENT: Item[] = [
  // 공용
  { id: 'e_old_sword', name: '낡은 검', axis: 'equipment', slot: 'weapon', rank: 'F', classLock: null, effect: { kind: 'gold', percent: 5 }, desc: '이가 좀 나갔다.' },
  { id: 'e_plain_sword', name: '무명의 검', axis: 'equipment', slot: 'weapon', rank: 'C', classLock: null, effect: { kind: 'gold', percent: 10 }, desc: '이름은 없지만 잘 든다.' },
  { id: 'e_leather_armor', name: '가죽 갑옷', axis: 'equipment', slot: 'armor', rank: 'D', classLock: null, effect: { kind: 'exp', percent: 8 }, desc: '적당히 튼튼하다.' },
  { id: 'e_iron_armor', name: '무쇠 갑옷', axis: 'equipment', slot: 'armor', rank: 'B', classLock: null, effect: { kind: 'exp', percent: 15 }, require: { level: 10 }, desc: '무겁지만 믿음직하다.' },
  { id: 'e_ring', name: '수행자의 반지', axis: 'equipment', slot: 'trinket', rank: 'D', classLock: null, effect: { kind: 'exp', percent: 5 }, desc: '손가락에 자국이 남는다.' },
  { id: 'e_lucky_coin', name: '행운의 동전', axis: 'equipment', slot: 'trinket', rank: 'B', classLock: null, effect: { kind: 'gold', percent: 15 }, desc: '앞면이 자주 나온다.' },
  { id: 'e_proof_of_streak', streakOnly: true, name: '꾸준함의 증표', axis: 'equipment', slot: 'trinket', rank: 'S', classLock: null, effect: { kind: 'gold', percent: 20 }, require: { streak: 30 }, desc: '30일을 하루도 빠지지 않은 사람만 가진다.' },

  // 직업 전용 — 자기 분야 경험치를 크게 올린다
  { id: 'e_greatsword', name: '전사의 대검', axis: 'equipment', slot: 'weapon', rank: 'A', classLock: 'STR', effect: { kind: 'categoryExp', category: 'STR', percent: 20 }, require: { level: 10, stat: { key: 'STR', value: 500 } }, desc: '들 수 있다면 당신은 전사다.' },
  { id: 'e_grimoire', name: '현자의 서', axis: 'equipment', slot: 'weapon', rank: 'A', classLock: 'INT', effect: { kind: 'categoryExp', category: 'INT', percent: 20 }, require: { level: 10, stat: { key: 'INT', value: 500 } }, desc: '읽을수록 두꺼워지는 것 같다.' },
  { id: 'e_lute', name: '음유시인의 류트', axis: 'equipment', slot: 'weapon', rank: 'A', classLock: 'CHA', effect: { kind: 'categoryExp', category: 'CHA', percent: 20 }, require: { level: 10, stat: { key: 'CHA', value: 500 } }, desc: '줄이 여섯 개나 된다.' },
  { id: 'e_prayer_beads', name: '수도사의 염주', axis: 'equipment', slot: 'weapon', rank: 'A', classLock: 'VIT', effect: { kind: 'categoryExp', category: 'VIT', percent: 20 }, require: { level: 10, stat: { key: 'VIT', value: 500 } }, desc: '한 알씩 세다 보면 마음이 가라앉는다.' },
  { id: 'e_dice', name: '방랑자의 주사위', axis: 'equipment', slot: 'weapon', rank: 'A', classLock: 'LUK', effect: { kind: 'categoryExp', category: 'LUK', percent: 20 }, require: { level: 10, stat: { key: 'LUK', value: 500 } }, desc: '어디로 갈지 이걸로 정한다.' },
];

// ─────────────────────────────────────────────
// 도구 — AI 프롬프트를 바꾼다. 이 앱의 핵심 가치
// ─────────────────────────────────────────────

const TOOLS: Item[] = [
  // 공용
  { id: 't_first_step', name: '첫걸음의 신발', axis: 'tool', slot: 'tool', rank: 'A', classLock: null, price: 800,
    prompt: '각 퀘스트 JSON에 "first_step" 필드(문자열)를 추가하고, 처음 5분에 할 일을 한 문장으로 적으세요.',
    desc: '미루는 이유의 대부분은 시작이 막막해서다.' },
  { id: 't_hourglass', name: '시간의 모래시계', axis: 'tool', slot: 'tool', rank: 'B', classLock: null, price: 600,
    prompt: '각 퀘스트 JSON에 "estimated_minutes" 필드(숫자)를 추가하고 예상 소요 시간을 분 단위로 적으세요.',
    desc: '하루에 뭘 얼마나 넣을 수 있는지 감이 생긴다.' },
  { id: 't_magnifier', name: '현자의 돋보기', axis: 'tool', slot: 'tool', rank: 'A', classLock: null, price: 1000,
    prompt: '2시간 이상 걸릴 퀘스트는 30분 이하 단위로 3개까지 쪼개세요.',
    desc: '덩어리에 압도되지 않게.' },
  { id: 't_scale', name: '균형의 저울', axis: 'tool', slot: 'tool', rank: 'A', classLock: null, price: 1200,
    prompt: '최근 비어 있는 능력치 분야의 퀘스트를 하나 이상 포함하세요.',
    desc: '운동만 하고 잠은 안 자는 편식을 막는다.' },
  { id: 't_feather', name: '나비의 수염', axis: 'tool', slot: 'tool', rank: 'C', classLock: null, price: 400,
    prompt: 'flavor_text를 더 단호하고 스파르타적인 톤으로 작성하세요.',
    desc: '수염 한 올. 동기부여 방식은 사람마다 다르다.' },
  { id: 't_charm_3day', name: '작심삼일의 부적', axis: 'tool', slot: 'tool', rank: 'B', classLock: null, price: 900,
    prompt: '최근 반복해서 실패한 분야는 난이도를 한 단계 낮춰 다시 제안하세요.',
    desc: '실패한 목표를 조용히 재조정해준다.' },
  { id: 't_focus_weight', name: '집중의 모래주머니', axis: 'tool', slot: 'tool', rank: 'B', classLock: null, price: 700,
    prompt: '가장 중요한 퀘스트 하나를 배열의 맨 앞에 두고, 그 퀘스트의 "tips"에 왜 먼저인지 한 줄 적으세요.',
    desc: '한 번에 하나.' },
  { id: 't_rest_charm', name: '쉬어가기 부적', axis: 'tool', slot: 'tool', rank: 'B', classLock: null, price: 800, consumable: true,
    desc: '하루를 놓쳐도 연속 기록이 끊기지 않는다. 1회 소모.' },

  // 직업 전용 — 그 분야를 더 '잘하게' 돕는다. 수치는 안 올린다
  { id: 't_training_log', name: '훈련 일지', axis: 'tool', slot: 'tool', rank: 'S', classLock: 'STR', price: 1500,
    prompt: '운동(STR) 퀘스트의 "tips" 배열에 세트 수, 반복 횟수, 세트 간 휴식 시간을 각각 항목으로 적으세요.',
    desc: '전사 전용. 운동을 실제로 더 잘하게 된다.' },
  { id: 't_pocket_watch', name: '집중의 회중시계', axis: 'tool', slot: 'tool', rank: 'S', classLock: 'INT', price: 1500,
    prompt: '공부/업무(INT) 퀘스트는 25분 단위로 쪼개고, "tips" 배열에 휴식 시점을 적으세요.',
    desc: '현자 전용. 뽀모도로.' },
  { id: 't_conversation_thread', name: '대화의 실마리', axis: 'tool', slot: 'tool', rank: 'S', classLock: 'CHA', price: 1500,
    prompt: '사교(CHA) 퀘스트의 "tips" 배열에 꺼낼 만한 화제를 두 가지 적으세요.',
    desc: '음유시인 전용. 만나서 무슨 말을 할지 막막할 때.' },
  { id: 't_body_voice', name: '몸의 소리', axis: 'tool', slot: 'tool', rank: 'S', classLock: 'VIT', price: 1500,
    prompt: '건강(VIT) 퀘스트의 "tips" 배열에 수면 시간과 수분 섭취 체크 항목을 적으세요.',
    desc: '수도사 전용.' },
  { id: 't_chance_dice', name: '우연의 주사위', axis: 'tool', slot: 'tool', rank: 'S', classLock: 'LUK', price: 1500,
    prompt: '취미(LUK) 퀘스트는 여러 개 나열하지 말고 무작위로 하나만 제안하세요.',
    desc: '방랑자 전용. 고르는 것도 피곤하다.' },
];


// ─────────────────────────────────────────────
// 나비 — 안내자를 꾸민다. 뽑기에서만, 낮은 확률로 나온다
// ─────────────────────────────────────────────

const NABI_ITEMS: Item[] = [
  { id: 'n_fur_tabby', name: '고등어 털', axis: 'nabi', slot: 'fur', rank: 'B', classLock: null, gachaOnly: true, desc: '등에 물결무늬가 있다.' },
  { id: 'n_fur_tuxedo', name: '턱시도 털', axis: 'nabi', slot: 'fur', rank: 'A', classLock: null, gachaOnly: true, desc: '늘 정장 차림이다.' },
  { id: 'n_fur_snow', name: '눈송이 털', axis: 'nabi', slot: 'fur', rank: 'A', classLock: null, gachaOnly: true, desc: '흰 눈 같은 털.' },
  { id: 'n_fur_calico', name: '삼색 털', axis: 'nabi', slot: 'fur', rank: 'A', classLock: null, gachaOnly: true, desc: '세 가지 색이 섞였다.' },
  { id: 'n_fur_shadow', name: '그림자 털', axis: 'nabi', slot: 'fur', rank: 'S', classLock: null, gachaOnly: true, desc: '어두운 곳에서는 잘 보이지 않는다.' },
  { id: 'n_fur_gold', streakOnly: true, name: '금빛 털', axis: 'nabi', slot: 'fur', rank: 'S', classLock: null, desc: '백 일을 함께 걸은 사이에게만.' },
  { id: 'n_fur_gold', streakOnly: true, name: '금빛 털', axis: 'nabi', slot: 'fur', rank: 'S', classLock: null, desc: '오래 곁에 둔 사이에게만 보이는 빛.' },
  { id: 'n_acc_scarf', name: '나비의 목도리', axis: 'nabi', slot: 'collar', rank: 'B', classLock: null, gachaOnly: true, desc: '목이 따뜻하면 잘 잔다.' },
  { id: 'n_acc_ribbon', name: '나비의 리본', axis: 'nabi', slot: 'collar', rank: 'A', classLock: null, gachaOnly: true, desc: '싫어하는 눈치지만 잘 어울린다.' },
  { id: 'n_acc_bell', name: '나비의 방울', axis: 'nabi', slot: 'collar', rank: 'S', classLock: null, gachaOnly: true, desc: '어디 있는지 알 수 있다.' },
];

export const ITEMS: Item[] = [...COSMETICS, ...EQUIPMENT, ...TOOLS, ...NABI_ITEMS];

const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

export const getItem = (id: string): Item | undefined => BY_ID.get(id);

// ─────────────────────────────────────────────
// 풀 필터링
//
// 전사인데 현자 전용이 뽑히면 그건 꽝이다.
// "나왔지만 못 쓴다"가 아니라 "나올 수 없다"로 처리한다.
// ─────────────────────────────────────────────

/** 이 직업이 손에 넣을 수 있는가 (공용 + 내 직업 전용) */
export function isObtainable(item: Item, charClass: Category | 'NONE'): boolean {
  return item.classLock === null || item.classLock === charClass;
}

/** 획득 풀. 뽑기·드랍·상점 전부 이걸 통과한다 */
export function poolFor(
  charClass: Category | 'NONE',
  opts: { axis?: ItemAxis; gachaOnly?: boolean } = {},
): Item[] {
  return ITEMS.filter((item) => {
    if (!isObtainable(item, charClass)) return false;
    if (opts.axis && item.axis !== opts.axis) return false;
    if (opts.gachaOnly === undefined) return true;
    return Boolean(item.gachaOnly) === opts.gachaOnly;
  });
}

export interface EquipContext {
  charClass: Category | 'NONE';
  level: number;
  stats: Record<Category, number>;
  streak: number;
}

export type EquipBlock =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * 장착 가능 여부. 직업이 바뀌면 이전 직업 전용은 잠기지만 사라지지는 않는다 —
 * 그 직업으로 돌아오면 되살아난다. 이 '잠김'이 전직 억제력으로 작동한다.
 */
export function canEquip(item: Item, ctx: EquipContext): EquipBlock {
  if (item.classLock && item.classLock !== ctx.charClass) {
    return { ok: false, reason: `${CLASS_NAME[item.classLock]} 전용` };
  }
  const req = item.require;
  if (!req) return { ok: true };

  if (req.level && ctx.level < req.level) {
    return { ok: false, reason: `LV.${req.level} 필요` };
  }
  if (req.stat && (ctx.stats[req.stat.key] ?? 0) < req.stat.value) {
    return { ok: false, reason: `${req.stat.key} ${req.stat.value} 필요` };
  }
  if (req.streak && ctx.streak < req.streak) {
    return { ok: false, reason: `${req.streak}일 연속 필요` };
  }
  return { ok: true };
}

const CLASS_NAME: Record<Category, string> = {
  STR: '전사',
  INT: '현자',
  CHA: '음유시인',
  VIT: '수도사',
  LUK: '방랑자',
};

// ─────────────────────────────────────────────
// 강화
// ─────────────────────────────────────────────

export const MAX_ENHANCE = 10;

const RANK_MULT: Record<Rank, number> = {
  F: 0.4, D: 0.7, C: 1.0, B: 1.6, A: 2.6, S: 4.0,
};

/** 비용(n, 등급) = 50 × n² × 등급배율 */
export function enhanceCost(rank: Rank, nextLevel: number): number {
  return Math.round(50 * nextLevel * nextLevel * RANK_MULT[rank]);
}

/** 성공 / 유지 / 파괴. 확률은 등급과 무관하다 — 등급이 붙는 건 가격뿐 */
export function enhanceOdds(nextLevel: number): {
  success: number;
  keep: number;
  destroy: number;
} {
  if (nextLevel <= 3) return { success: 1, keep: 0, destroy: 0 };
  if (nextLevel <= 6) return { success: 0.8, keep: 0.2, destroy: 0 };
  if (nextLevel === 7) return { success: 0.5, keep: 0.45, destroy: 0.05 };
  if (nextLevel === 8) return { success: 0.5, keep: 0.42, destroy: 0.08 };
  if (nextLevel === 9) return { success: 0.25, keep: 0.63, destroy: 0.12 };
  return { success: 0.25, keep: 0.6, destroy: 0.15 };
}

/** 강화 한 단계당 기본 수치의 10%p가 붙는다 → +10이면 2배 */
export function effectPercent(item: Item, enhance: number): number {
  if (!item.effect) return 0;
  return item.effect.percent * (1 + enhance * 0.1);
}

/** 파괴 시 남는 파편. 뼈아픈 실패일수록 회수도 크다 */
export function shardsOnDestroy(rank: Rank, enhance: number): number {
  return Math.round(enhance * RANK_MULT[rank]);
}

export const PROTECT_PRICE: Record<Rank, number> = {
  F: 500, D: 500, C: 1500, B: 1500, A: 3000, S: 5000,
};
