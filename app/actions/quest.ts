'use server';

import { getItem } from '@/lib/items';
import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

/**
 * 용사님의 자연어 입력을 받아 구체적인 퀘스트 목록으로 변환합니다.
 * @param userInput - "오늘 헬스장 가고 영단어 20개 외울 거야"
 * @param userJob - 용사님의 현실 직업 (캐릭터 클래스와 무관)
 * @param toolIds - 장착 중인 도구 아이템 id. 각 도구가 프롬프트에 지시를 덧붙인다
 * @returns 퀘스트 객체 배열
 */
export async function generateQuests(
  userInput: string,
  userJob: string,
  toolIds: string[] = [],
) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { error: 'API 키가 설정되지 않았습니다.' };
    }

    // 도구는 우리 테이블에서만 나오므로 사용자 입력이 프롬프트에 섞이지 않는다
    const toolInstructions = toolIds
      .map((id) => getItem(id))
      .filter((item) => item?.axis === 'tool' && item.prompt)
      .map((item) => `- ${item!.prompt}`)
      .join('\n');

    const prompt = `
    ${process.env.QUEST_SYSTEM_PROMPT || ''}
    용사님의 직업: "${userJob}"
    용사님의 오늘 할 일: "${userInput}"
    ${toolInstructions ? `\n[용사님이 장착한 도구의 효과 — 아래 지시를 반드시 반영하고, 지정된 JSON 필드를 추가하세요]\n${toolInstructions}` : ''}
  `;

    const res = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });
    const response = res.text;
    if (!response) {
      return { error: '응답을 받을 수 없습니다.' };

    }

    // ```json과 ``` 제거하고 JSON 파싱
    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    // JSON 파싱
    interface QuestResponse {
      title: string;
      category: 'STR' | 'INT' | 'CHA' | 'VIT' | 'LUK';
      rank: 'F' | 'D' | 'C' | 'B' | 'A' | 'S';
      objective: string;
      rewards: {
        exp: number;
        gold: number;
        loot: string;
      };
      flavor_text: string;
      debuff: string;
      created_at?: string;
      // 도구가 장착됐을 때만 채워진다
      first_step?: string;
      estimated_minutes?: number;
      tips?: string[];
    }

    const quests: QuestResponse[] = JSON.parse(jsonText);
    
    // completed 필드 추가
    const questsWithCompleted = quests.map((quest) => ({
      ...quest,
      completed: false,
    }));

    return { quests: questsWithCompleted };  
  } catch (error) {
    console.error('퀘스트 생성 중 오류 발생:', error);
    return { error: '퀘스트 생성 중 오류가 발생했습니다.' };
  }
}

/**
 * 퀘스트 하나를 다시 뽑습니다.
 * AI가 엉뚱하게 잡았을 때 지우는 것 말고 다른 선택지를 준다.
 * @param original - 마음에 들지 않는 퀘스트의 제목·목표
 */
export async function rerollQuest(
  original: { title: string; objective: string },
  userJob: string,
  toolIds: string[] = [],
) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { error: 'API 키가 설정되지 않았습니다.' };
    }

    const toolInstructions = toolIds
      .map((id) => getItem(id))
      .filter((item) => item?.axis === 'tool' && item.prompt)
      .map((item) => `- ${item!.prompt}`)
      .join('\n');

    const prompt = `
    ${process.env.QUEST_SYSTEM_PROMPT || ''}
    용사님의 직업: "${userJob}"

    아래 퀘스트가 용사님 마음에 들지 않았습니다.
    같은 목적을 유지하되 **접근 방식과 난이도를 다르게** 하여 새 퀘스트 하나만 제안하세요.
    반드시 JSON 배열에 객체 1개만 담아 반환하세요.

    기존 퀘스트 제목: "${original.title}"
    기존 퀘스트 목표: "${original.objective}"
    ${toolInstructions ? `\n[용사님이 장착한 도구의 효과 — 아래 지시를 반드시 반영하고, 지정된 JSON 필드를 추가하세요]\n${toolInstructions}` : ''}
  `;

    const res = await genAI.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });
    const response = res.text;
    if (!response) return { error: '응답을 받을 수 없습니다.' };

    let jsonText = response.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(jsonText);
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    if (!first?.title) return { error: '새 퀘스트를 만들지 못했습니다.' };

    return { quest: { ...first, completed: false } };
  } catch (error) {
    console.error('퀘스트 리롤 중 오류 발생:', error);
    return { error: '퀘스트를 다시 뽑는 중 오류가 발생했습니다.' };
  }
}
