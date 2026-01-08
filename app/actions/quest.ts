'use server';

import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

/**
 * 용사님의 자연어 입력을 받아 구체적인 퀘스트 목록으로 변환합니다.
 * @param userInput - "오늘 헬스장 가고 영단어 20개 외울 거야"
 * @param userJob - 용사님의 직업
 * @returns 퀘스트 객체 배열
 */
export async function generateQuests(userInput: string, userJob: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return { error: 'API 키가 설정되지 않았습니다.' };
    }
    const prompt = `
    ${process.env.QUEST_SYSTEM_PROMPT || ''}
    용사님의 직업: "${userJob}"
    용사님의 오늘 할 일: "${userInput}"
  `;

    const res = await genAI.models.generateContent({
      model: 'gemini-2.5-flash',
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
