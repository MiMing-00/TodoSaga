'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { shiftDay, todayKey } from './date';
import { levelFromExp, type Category, type Quest, type Stats } from './quest';
import {
  EMPTY_MATERIALS,
  RECIPES,
  canCraft,
  craft,
  payCost,
  type Materials,
} from './craft';
import {
  STREAK_REWARDS,
  activeDebuffPercent,
  datesToClose,
  debuffPercentFor,
  fullyMissed,
  hasRestCharm,
  REST_CHARM_ID,
  type ActiveDebuff,
} from './daily';
import {
  GACHA_PITY,
  GACHA_PRICE,
  GACHA_PRICE_10,
  rollDrop,
  rollGacha,
  scalesFor,
  type GachaOutcome,
} from './drop';
import {
  alreadyToday,
  routinesFor,
  toRoutine,
  type Routine,
} from './routine';
import { AFFECTION_LEVELS, PET_LIMIT } from './nabi';
import { REROLL_COST, priceOf, sellValue } from './shop';
import {
  addItem,
  computeBonus,
  withDebuff,
  equip as equipItem,
  equippedUids,
  pruneEquipped,
  unequip as unequipItem,
  type Equipped,
  type OwnedItem,
} from './inventory';
import {
  MAX_ENHANCE,
  PROTECT_PRICE,
  enhanceCost,
  enhanceOdds,
  getItem,
  isObtainable,
  shardsOnDestroy,
  type EquipContext,
} from './items';
import { classChangeCost, isClassUnlocked } from './sprite';

export type { Stats };

/** 파괴 방지 부적을 파편으로 대신 낼 때의 개수 */
export const PROTECT_SHARDS = 50;

export type ProtectMode = 'none' | 'gold' | 'shards';

export type EnhanceResult =
  | { kind: 'success'; level: number }
  | { kind: 'keep'; nextRate: number }
  | { kind: 'destroy'; shards: number; name: string };

const EMPTY_STATS: Stats = { STR: 0, INT: 0, CHA: 0, VIT: 0, LUK: 0 };

interface SagaState {
  hydrated: boolean;
  /** AI에게 퀘스트 맥락으로 넘기는 현실 직업. 캐릭터 클래스와는 무관하다. */
  job: string;
  /** 유저가 직접 고른 캐릭터 클래스. 'NONE'이면 아직 안 고른 견습생. */
  charClass: Category | 'NONE';
  /** 골드를 내고 갈아탄 횟수. 첫 전직은 여기 포함되지 않는다. */
  classChanges: number;
  exp: number;
  gold: number;
  stats: Stats;
  /** 날짜(YYYY-MM-DD) → 그날의 퀘스트. 하루 단위로 끊어야 '루틴'이 성립한다. */
  days: Record<string, Quest[]>;
  streak: number;
  bestStreak: number;
  /** 보유 아이템. AI가 짓는 rewards.loot 기념품과는 별개다 */
  inventory: OwnedItem[];
  /** 슬롯 → 장착 개체 uid */
  equipped: Equipped;
  /** 꽝과 중복으로 모이는 재료들 */
  materials: Materials;
  /** 강화 파괴로 모인 유물의 파편 */
  shards: number;
  /** A 이상이 안 나온 연속 뽑기 횟수 (천장) */
  gachaPity: number;
  /** 정산을 마친 날짜들 */
  closedDays: string[];
  /** 활성 디버프. 하루만 산다 */
  debuff: ActiveDebuff | null;
  /** 상시 의뢰 — 매일 같은 걸 입력하지 않게 해준다 */
  routines: Routine[];
  /** 이미 수령한 연속 기록 보상 (일수) */
  claimedStreaks: number[];
  /** 나비와의 호감도 */
  affection: number;
  /** 수령한 호감도 단계 */
  claimedAffection: number[];
  /** 오늘 쓰다듬은 횟수 */
  petLog: { date: string; count: number };
  /** 나비에게 입힌 것 */
  nabiFur: string | null;
  nabiAccessory: string | null;
  /** 화면 전체가 공유하는 토스트. 페이지를 나눠도 알림은 이어져야 한다 */
  toast: { text: string; id: number } | null;
  /** 직전 퀘스트 완료로 얻은 아이템 id — 연출용, 저장하지 않는다 */
  lastDrop: string | null;
  /** 마지막으로 퀘스트를 1개 이상 완료한 날 */
  lastClearedDate: string | null;
  /**
   * 사가의 서 「책장」에서 마지막으로 확인한 달(YYYY-MM).
   * 이 값보다 지금 달이 앞서 있으면, 그 사이에 최소 한 권이 새로 엮였다는
   * 뜻이라 "챠르륵" 연출을 한 번 보여준다. 본 뒤 이 값을 오늘 달로 올린다.
   */
  lastSeenBookMonth: string | null;

  markHydrated: () => void;
  /** 책장 연출을 봤다고 표시한다 */
  markBookSeen: (monthKey: string) => void;
  setJob: (job: string) => void;
  /** 전직. 첫 선택은 무료, 이후에는 골드가 모자라면 아무 일도 일어나지 않는다. */
  changeClass: (charClass: Category) => void;
  equip: (uid: string) => string | null;
  unequip: (uid: string) => void;
  clearDrop: () => void;
  /** 상점 구매. 성공하면 null, 실패하면 이유 */
  buyItem: (itemId: string) => string | null;
  /** 장비 강화. 성공/유지/파괴 중 하나를 돌려준다 */
  enhanceItem: (
    uid: string,
    protect: ProtectMode,
  ) => EnhanceResult | { error: string };
  /** 「나비의 상자」를 연다. 성공하면 결과 목록, 실패하면 이유 */
  pullGacha: (count: 1 | 10) => GachaOutcome[] | { error: string };
  /** 보유 아이템 판매. 성공하면 받은 골드, 실패하면 이유 */
  sellItem: (uid: string) => { gold: number } | { error: string };
  /** 퀘스트 다시 뽑기 — 골드를 먼저 차감하고 교체는 호출부가 한다 */
  payReroll: () => boolean;
  replaceQuest: (date: string, index: number, quest: Quest) => void;
  /** 나비를 쓰다듬는다. 호감도가 올랐으면 true */
  petNabi: (date: string) => boolean;
  /** 호감도 단계 보상 수령 */
  claimAffection: (at: number) => string | null;
  /** 나비에게 털색·목장식을 입힌다. 같은 걸 다시 고르면 벗긴다 */
  dressNabi: (itemId: string) => void;
  /** 연속 기록 보상 수령. 성공하면 보상 이름 */
  claimStreak: (days: number) => string | null;
  addRoutine: (quest: Quest) => void;
  removeRoutine: (id: string) => void;
  toggleRoutineDay: (id: string, day: number) => void;
  /** 오늘 해당하는 상시 의뢰를 받아온다. 이미 있는 건 건너뛴다 */
  summonRoutines: (date: string) => number;
  showToast: (text: string) => void;
  dismissToast: () => void;
  /** 조합. 성공하면 얻은 아이템 id, 재료가 모자라면 null */
  craftRecipe: (recipeId: string) => string | null;
  /** 하루를 닫는다. 놓친 퀘스트 수만큼 다음 날 EXP가 깎인다 */
  closeDay: (date: string, nextDate: string) => void;
  addQuests: (date: string, quests: Quest[]) => void;
  completeQuest: (date: string, index: number, note?: string) => void;
  removeQuest: (date: string, index: number) => void;
  reset: () => void;
}

export const useSagaStore = create<SagaState>()(
  persist(
    (set, get) => ({
      hydrated: false,
      job: '',
      charClass: 'NONE',
      classChanges: 0,
      exp: 0,
      gold: 0,
      stats: { ...EMPTY_STATS },
      days: {},
      streak: 0,
      bestStreak: 0,
      lastClearedDate: null,
      lastSeenBookMonth: null,
      inventory: [],
      equipped: {},
      materials: { ...EMPTY_MATERIALS },
      shards: 0,
      gachaPity: 0,
      lastDrop: null,
      closedDays: [],
      debuff: null,
      routines: [],
      claimedStreaks: [],
      affection: 0,
      claimedAffection: [],
      petLog: { date: '', count: 0 },
      nabiFur: null,
      nabiAccessory: null,
      toast: null,

      markHydrated: () => set({ hydrated: true }),

      markBookSeen: (monthKey) => set({ lastSeenBookMonth: monthKey }),

      setJob: (job) => set({ job }),

      equip: (uid) => {
        const s = get();
        const result = equipItem(s.equipped, s.inventory, uid, equipContext(s));
        if (!result.ok) return result.reason;
        set({ equipped: result.equipped });
        return null;
      },

      unequip: (uid) =>
        set((s) => ({ equipped: unequipItem(s.equipped, uid) })),

      clearDrop: () => set({ lastDrop: null }),

      buyItem: (itemId) => {
        const s = get();
        const item = getItem(itemId);
        if (!item?.price) return '판매하지 않는 물건이에요';
        if (!isObtainable(item, s.charClass)) return '지금 직업으로는 살 수 없어요';
        if (!item.consumable && s.inventory.some((o) => o.itemId === itemId)) {
          return '이미 가지고 있어요';
        }

        // 진열가와 결제가가 다르면 안 된다. 화면과 같은 함수로 값을 구한다
        const price = priceOf(item, s.charClass, todayKey());
        if (s.gold < price) {
          return `${(price - s.gold).toLocaleString()} G 부족해요`;
        }

        set({
          gold: s.gold - price,
          inventory: addItem(s.inventory, itemId).inventory,
        });
        return null;
      },

      enhanceItem: (uid, protect) => {
        const s = get();
        const owned = s.inventory.find((o) => o.uid === uid);
        if (!owned) return { error: '보유하지 않은 아이템' };

        const def = getItem(owned.itemId);
        if (!def || def.axis !== 'equipment') {
          return { error: '장비만 강화할 수 있어요' };
        }
        if (owned.enhance >= MAX_ENHANCE) return { error: '이미 한계입니다' };

        const next = owned.enhance + 1;
        const cost = enhanceCost(def.rank, next);
        const protectGold = protect === 'gold' ? PROTECT_PRICE[def.rank] : 0;
        const protectShards = protect === 'shards' ? PROTECT_SHARDS : 0;

        if (s.gold < cost + protectGold) {
          return {
            error: `${(cost + protectGold - s.gold).toLocaleString()} G 부족해요`,
          };
        }
        if (s.shards < protectShards) {
          return { error: `유물의 파편 ${protectShards - s.shards}개 부족해요` };
        }

        const odds = enhanceOdds(next);
        // 유지가 쌓일수록 성공률이 붙는다. 확률은 속도를 정할 뿐, 도달 여부는 아니다
        const success = Math.min(odds.success + owned.fails * 0.05, 1);
        const rest = Math.max(0, 1 - success);
        const share = odds.keep + odds.destroy;
        const destroy =
          protect === 'none' && share > 0 ? rest * (odds.destroy / share) : 0;

        const roll = Math.random();
        const spent = { gold: s.gold - cost - protectGold, shards: s.shards - protectShards };

        if (roll < success) {
          set({
            ...spent,
            inventory: s.inventory.map((o) =>
              o.uid === uid ? { ...o, enhance: next, fails: 0 } : o,
            ),
          });
          return { kind: 'success', level: next };
        }

        if (roll < success + destroy) {
          // 부어넣은 골드가 통째로 증발하지는 않는다
          const shards = shardsOnDestroy(def.rank, owned.enhance);
          set({
            ...spent,
            shards: spent.shards + shards,
            inventory: s.inventory.filter((o) => o.uid !== uid),
            equipped: unequipItem(s.equipped, uid),
          });
          return { kind: 'destroy', shards, name: def.name };
        }

        set({
          ...spent,
          inventory: s.inventory.map((o) =>
            o.uid === uid ? { ...o, fails: o.fails + 1 } : o,
          ),
        });
        return {
          kind: 'keep',
          nextRate: Math.min(odds.success + (owned.fails + 1) * 0.05, 1),
        };
      },

      pullGacha: (count) => {
        const s = get();
        const price = count === 10 ? GACHA_PRICE_10 : GACHA_PRICE;
        if (s.gold < price) {
          return { error: `${(price - s.gold).toLocaleString()} G 부족해요` };
        }

        let inventory = s.inventory;
        const materials = { ...s.materials };
        let pity = s.gachaPity;
        const outcomes: GachaOutcome[] = [];

        for (let i = 0; i < count; i += 1) {
          const owned = new Set(inventory.map((o) => o.itemId));
          const pull = rollGacha(s.charClass, owned, pity);
          if (!pull) break;

          if (pull.kind === 'dud') {
            // 꽝도 빈손은 아니다. 모으면 「삼재 합성」으로 A등급이 확정으로 나온다
            materials[pull.material] += 1;
            pity += 1;
            outcomes.push({ kind: 'dud', material: pull.material, shakes: 2 });
            continue;
          }

          const high = pull.item.rank === 'A' || pull.item.rank === 'S';
          pity = high ? 0 : Math.min(pity + 1, GACHA_PITY);

          if (pull.duplicate) {
            const scales = scalesFor(pull.item.rank);
            materials.m_scale += scales;
            outcomes.push({
              kind: 'duplicate',
              itemId: pull.item.id,
              name: pull.item.name,
              rank: pull.item.rank,
              scales,
              shakes: pull.shakes,
            });
          } else {
            inventory = addItem(inventory, pull.item.id).inventory;
            outcomes.push({
              kind: 'item',
              itemId: pull.item.id,
              name: pull.item.name,
              rank: pull.item.rank,
              shakes: pull.shakes,
            });
          }
        }

        set({ gold: s.gold - price, inventory, materials, gachaPity: pity });
        return outcomes;
      },

      sellItem: (uid) => {
        const s = get();
        const owned = s.inventory.find((o) => o.uid === uid);
        if (!owned) return { error: '보유하지 않은 아이템' };

        const def = getItem(owned.itemId);
        if (!def) return { error: '알 수 없는 아이템' };

        // 장착 중인 건 못 판다. 먼저 벗어야 한다
        if (equippedUids(s.equipped).includes(uid)) {
          return { error: '장착 중이에요. 먼저 해제하세요' };
        }

        const gained = sellValue(def, owned.enhance);

        // 소모품은 한 개씩 판다
        const inventory = def.consumable && owned.count > 1
          ? s.inventory.map((o) =>
              o.uid === uid ? { ...o, count: o.count - 1 } : o,
            )
          : s.inventory.filter((o) => o.uid !== uid);

        set({ gold: s.gold + gained, inventory });
        return { gold: gained };
      },

      payReroll: () => {
        const s = get();
        if (s.gold < REROLL_COST) return false;
        set({ gold: s.gold - REROLL_COST });
        return true;
      },

      replaceQuest: (date, index, quest) =>
        set((s) => {
          const list = s.days[date];
          if (!list?.[index] || list[index].completed) return s;
          return {
            days: {
              ...s.days,
              [date]: list.map((q, i) => (i === index ? quest : q)),
            },
          };
        }),

      petNabi: (date) => {
        const s = get();
        const log = s.petLog.date === date ? s.petLog : { date, count: 0 };
        // 상한이 없으면 그냥 클릭 노가다가 된다
        if (log.count >= PET_LIMIT) return false;

        set({
          affection: s.affection + 1,
          petLog: { date, count: log.count + 1 },
        });
        return true;
      },

      claimAffection: (at) => {
        const s = get();
        const level = AFFECTION_LEVELS.find((l) => l.at === at);
        if (!level) return null;
        if (s.affection < at || s.claimedAffection.includes(at)) return null;

        set({
          gold: s.gold + level.gold,
          claimedAffection: [...s.claimedAffection, at],
          materials: level.scales
            ? { ...s.materials, m_scale: s.materials.m_scale + level.scales }
            : s.materials,
          inventory: level.itemId
            ? addItem(s.inventory, level.itemId).inventory
            : s.inventory,
        });
        return level.name;
      },

      dressNabi: (itemId) =>
        set((s) => {
          const item = getItem(itemId);
          if (item?.axis !== 'nabi') return s;
          if (item.slot === 'fur') {
            return { nabiFur: s.nabiFur === itemId ? null : itemId };
          }
          return { nabiAccessory: s.nabiAccessory === itemId ? null : itemId };
        }),

      claimStreak: (days) => {
        const s = get();
        const reward = STREAK_REWARDS.find((r) => r.days === days);
        if (!reward) return null;
        // 한 번 이룬 기록은 끊겨도 뺏지 않는다 — bestStreak으로 본다
        if (s.bestStreak < days || s.claimedStreaks.includes(days)) return null;

        set({
          gold: s.gold + reward.gold,
          claimedStreaks: [...s.claimedStreaks, days],
          materials: reward.scales
            ? { ...s.materials, m_scale: s.materials.m_scale + reward.scales }
            : s.materials,
          inventory: reward.itemId
            ? addItem(s.inventory, reward.itemId).inventory
            : s.inventory,
        });
        return reward.label;
      },

      addRoutine: (quest) =>
        set((s) =>
          s.routines.some((r) => r.quest.title === quest.title)
            ? s
            : { routines: [...s.routines, toRoutine(quest)] },
        ),

      removeRoutine: (id) =>
        set((s) => ({ routines: s.routines.filter((r) => r.id !== id) })),

      toggleRoutineDay: (id, day) =>
        set((s) => ({
          routines: s.routines.map((r) => {
            if (r.id !== id) return r;

            // 빈 배열은 '매일'이라 화면에는 전부 켜져 보인다.
            // 그 상태에서 하나를 누르면 **그 요일이 꺼져야** 한다 —
            // 누른 것만 남으면 기대와 정반대다
            const current = r.days.length === 0 ? [0, 1, 2, 3, 4, 5, 6] : r.days;
            const next = current.includes(day)
              ? current.filter((d) => d !== day)
              : [...current, day].sort();

            // 다시 이레 전부가 되면 '매일'로 되돌린다
            return { ...r, days: next.length === 7 ? [] : next };
          }),
        })),

      summonRoutines: (date) => {
        const s = get();
        const today = s.days[date] ?? [];
        const due = routinesFor(s.routines, date).filter(
          (r) => !alreadyToday(today, r),
        );
        if (due.length === 0) return 0;

        set({
          days: {
            ...s.days,
            [date]: [
              ...today,
              ...due.map((r) => ({ ...r.quest, completed: false })),
            ],
          },
        });
        return due.length;
      },

      showToast: (text) => set({ toast: { text, id: Date.now() } }),

      dismissToast: () => set({ toast: null }),

      craftRecipe: (recipeId) => {
        const s = get();
        const recipe = RECIPES.find((r) => r.id === recipeId);
        if (!recipe || !canCraft(recipe, s.materials)) return null;

        // 조합 결과도 직업 필터를 통과한다 —
        // 애써 모은 재료로 못 쓰는 템이 나오면 꽝보다 나쁘다
        const item = craft(recipe, s.charClass);
        if (!item) return null;

        set({
          materials: payCost(recipe, s.materials),
          inventory: addItem(s.inventory, item.id).inventory,
          lastDrop: item.id,
        });
        return item.id;
      },

      closeDay: (date, nextDate) =>
        set((s) => {
          const quests = s.days[date] ?? [];
          const missed = quests.filter((q) => !q.completed).length;
          const percent = debuffPercentFor(missed);

          // 정산 대상보다 오래된 미정산 날짜도 함께 닫는다.
          // 일주일을 비웠다고 정산 화면을 일곱 번 띄울 수는 없다
          const toClose = datesToClose(s.days, s.closedDays, date);

          // 「쉬어가기 부적」— 그날 하나도 완수하지 못했으면 연속 기록이 끊기는데,
          // 부적을 갖고 있으면 1개를 써서 그 하루를 넘겨준다. EXP 디버프는 그대로 받는다 —
          // 부적이 지켜주는 건 연속 기록뿐이다
          let inventory = s.inventory;
          let lastClearedDate = s.lastClearedDate;
          if (fullyMissed(quests) && hasRestCharm(s.inventory)) {
            const charm = s.inventory.find((o) => o.itemId === REST_CHARM_ID)!;
            inventory =
              charm.count > 1
                ? s.inventory.map((o) =>
                    o.uid === charm.uid ? { ...o, count: o.count - 1 } : o,
                  )
                : s.inventory.filter((o) => o.uid !== charm.uid);
            // 그날을 이어낸 것으로 쳐서 사슬을 끊지 않는다 — streak 수치 자체는 올리지 않는다
            lastClearedDate = date;
          }

          return {
            closedDays: [...s.closedDays, ...toClose],
            debuff: percent > 0 ? { date: nextDate, percent } : null,
            inventory,
            lastClearedDate,
          };
        }),

      changeClass: (charClass) =>
        set((s) => {
          if (charClass === s.charClass) return s;

          // 이전 직업 전용은 벗겨지지만 인벤토리에는 남는다 —
          // 그 직업으로 돌아오면 되살아난다
          const equipped = pruneEquipped(
            s.equipped,
            s.inventory,
            equipContext({ ...s, charClass }),
          );

          // 첫 전직은 무료. 대신 견습생으로는 돌아갈 수 없다.
          if (s.charClass === 'NONE') return { charClass, equipped };

          const cost = classChangeCost(s.classChanges);
          if (s.gold < cost) return s;

          return {
            charClass,
            equipped,
            gold: s.gold - cost,
            classChanges: s.classChanges + 1,
          };
        }),

      addQuests: (date, quests) =>
        set((s) => ({
          days: { ...s.days, [date]: [...(s.days[date] ?? []), ...quests] },
        })),

      completeQuest: (date, index, note) =>
        set((s) => {
          const list = s.days[date];
          const quest = list?.[index];
          if (!quest || quest.completed) return s;

          // 그날의 첫 완료일 때만 연속 기록을 갱신한다
          const isFirstClearToday = !list.some((q) => q.completed);
          let { streak, bestStreak, lastClearedDate } = s;

          if (isFirstClearToday && lastClearedDate !== date) {
            streak = lastClearedDate === shiftDay(date, -1) ? streak + 1 : 1;
            bestStreak = Math.max(bestStreak, streak);
            lastClearedDate = date;
          }

          // 장착 효과와 디버프를 실제로 적용한다. 표시만 하고 안 주면 그건 거짓말이다
          const bonus = withDebuff(
            computeBonus(s.inventory, s.equipped, quest.category),
            activeDebuffPercent(s.debuff, date),
          );
          const gainedExp = Math.round(quest.rewards.exp * bonus.expMult);
          const gainedGold = Math.round(quest.rewards.gold * bonus.goldMult);

          // 드랍 풀은 항상 직업 필터를 통과한다 — 못 쓰는 템은 나올 수 없다
          const drop = rollDrop({
            charClass: s.charClass,
            questRank: quest.rank,
          });
          const inventory = drop
            ? addItem(s.inventory, drop.id).inventory
            : s.inventory;

          return {
            days: {
              ...s.days,
              [date]: list.map((q, i) =>
                i === index
                  ? {
                      ...q,
                      completed: true,
                      // 그날 실제로 받은 양을 남긴다 (마감 정산·회고용)
                      earned: { exp: gainedExp, gold: gainedGold },
                      ...(note?.trim() ? { note: note.trim() } : {}),
                    }
                  : q,
              ),
            },
            inventory,
            lastDrop: drop?.id ?? null,
            exp: s.exp + gainedExp,
            gold: s.gold + gainedGold,
            // 능력치는 그 분야로 쌓은 누적 경험치다 — 보너스도 같이 반영한다
            stats: {
              ...s.stats,
              [quest.category]: (s.stats[quest.category] ?? 0) + gainedExp,
            },
            streak,
            bestStreak,
            lastClearedDate,
          };
        }),

      removeQuest: (date, index) =>
        set((s) => {
          const list = s.days[date];
          if (!list) return s;
          // 완료한 퀘스트는 지워도 보상을 회수하지 않는다 — 기록은 되돌리지 않는다
          return { days: { ...s.days, [date]: list.filter((_, i) => i !== index) } };
        }),

      reset: () =>
        set({
          exp: 0,
          gold: 0,
          stats: { ...EMPTY_STATS },
          days: {},
          streak: 0,
          bestStreak: 0,
          lastClearedDate: null,
          charClass: 'NONE',
          classChanges: 0,
          inventory: [],
          equipped: {},
          materials: { ...EMPTY_MATERIALS },
          shards: 0,
          gachaPity: 0,
          lastDrop: null,
          closedDays: [],
          debuff: null,
          routines: [],
          claimedStreaks: [],
          affection: 0,
          claimedAffection: [],
          petLog: { date: '', count: 0 },
          nabiFur: null,
          nabiAccessory: null,
        }),
    }),
    {
      name: 'todosaga',
      version: 1,
      // 서버 HTML과 클라이언트 첫 렌더를 일치시키기 위해 자동 복원을 끄고,
      // 마운트 후 명시적으로 rehydrate 한다 (page.tsx 참조)
      skipHydration: true,
      onRehydrateStorage: () => (state, error) => {
        // 에러/예외가 나도 hydrated는 반드시 올린다.
        // 안 그러면 「사가의 서를 펼치는 중」에 영원히 갇힌다.
        try {
          if (error) {
            console.error('todosaga rehydrate failed', error);
          }
          if (!state) return;

          // 스토어 도입 이전에 쓰던 키에서 직업을 한 번 넘겨받는다
          if (!state.job) {
            const legacy = localStorage.getItem('todosaga_userJob');
            if (legacy) {
              state.setJob(legacy);
              localStorage.removeItem('todosaga_userJob');
            }
          }
          // 저장된 직업이 아직 해금 조건을 못 채웠다면 견습생으로 되돌린다
          if (!isClassUnlocked(state.charClass, state.stats)) {
            state.charClass = 'NONE';
          }
          // 저장된 장착 상태가 지금 조건에 안 맞으면 조용히 벗긴다
          state.equipped = pruneEquipped(
            state.equipped,
            state.inventory,
            equipContext(state),
          );
        } finally {
          useSagaStore.getState().markHydrated();
        }
      },
      // hydrated는 런타임 플래그라 저장하지 않는다
      partialize: (s) => ({
        job: s.job,
        charClass: s.charClass,
        classChanges: s.classChanges,
        exp: s.exp,
        gold: s.gold,
        stats: s.stats,
        days: s.days,
        streak: s.streak,
        bestStreak: s.bestStreak,
        lastClearedDate: s.lastClearedDate,
        lastSeenBookMonth: s.lastSeenBookMonth,
        inventory: s.inventory,
        equipped: s.equipped,
        materials: s.materials,
        shards: s.shards,
        gachaPity: s.gachaPity,
        closedDays: s.closedDays,
        debuff: s.debuff,
        routines: s.routines,
        claimedStreaks: s.claimedStreaks,
        affection: s.affection,
        claimedAffection: s.claimedAffection,
        petLog: s.petLog,
        nabiFur: s.nabiFur,
        nabiAccessory: s.nabiAccessory,
      }),
    },
  ),
);

// 탭을 두 개 이상 열어두면 나중에 저장되는 탭이 먼저 탭의 변경을 조용히 덮어썼다 —
// zustand persist는 기본적으로 storage 이벤트를 구독하지 않는다.
// 다른 탭이 저장한 걸 감지하면 이 탭도 다시 읽어와 맞춘다.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'todosaga') {
      void useSagaStore.persist.rehydrate();
    }
  });
}

function equipContext(s: {
  charClass: Category | 'NONE';
  exp: number;
  stats: Stats;
  streak: number;
  lastClearedDate: string | null;
}): EquipContext {
  return {
    charClass: s.charClass,
    level: levelFromExp(s.exp),
    stats: s.stats,
    streak: activeStreak(s.streak, s.lastClearedDate),
  };
}

/** 연속 기록은 '오늘 또는 어제까지 이어졌을 때'만 살아있다. 하루라도 건너뛰면 0. */
export function activeStreak(
  streak: number,
  lastClearedDate: string | null,
): number {
  if (!lastClearedDate) return 0;
  const today = todayKey();
  if (lastClearedDate === today || lastClearedDate === shiftDay(today, -1)) {
    return streak;
  }
  return 0;
}

/**
 * 전리품은 따로 저장하지 않는다 — 완료한 퀘스트 기록에서 그때그때 뽑아낸다.
 * 같은 이름은 개수로 합치고, 많이 모은 순으로 정렬한다.
 */
export function collectLoot(
  days: Record<string, Quest[]>,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const list of Object.values(days)) {
    for (const quest of list) {
      const name = quest.completed ? quest.rewards?.loot?.trim() : '';
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
