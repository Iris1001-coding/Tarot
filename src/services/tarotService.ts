import { GoogleGenAI } from '@google/genai';

export interface DrawnCard {
  index: number;
  isReversed: boolean;
  positionName: string;
}

export type ApiProvider = 'gemini' | 'openai';

function buildPrompt(question: string, spreadName: string, cards: DrawnCard[]): string {
  const cardsDescription = cards
    .map(c => `位置: ${c.positionName}, 抽到的牌编号: ${c.index}, 状态: ${c.isReversed ? '逆位' : '正位'}`)
    .join('\n');
  return `你是一位资深、神秘且充满智慧的塔罗师。
用户选择的牌阵是: "${spreadName}"。
用户的问题是: "${question}"。

用户抽到的牌如下（基于78张标准韦特塔罗牌）:
${cardsDescription}

请根据用户选择的牌阵、每个位置的含义以及抽到的牌，为用户提供深刻、充满诗意且富有洞察力的解读。
请保持语言优美、神秘，字数适中（大约3-5个段落）。
请使用中文回答。`.trim();
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: model || 'gemini-2.0-flash-exp',
    contents: prompt,
  });
  return response.text || '星辰今日沉默不语...';
}

async function callOpenAI(
  apiKey: string,
  model: string,
  baseUrl: string,
  prompt: string,
): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/v1/chat/completions`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content || '星辰今日沉默不语...';
}

export async function getInterpretation(
  question: string,
  spreadName: string,
  cards: DrawnCard[],
): Promise<string> {
  const apiKey =
    localStorage.getItem('tarot_api_key') ||
    (import.meta.env.VITE_GEMINI_API_KEY as string | undefined);
  if (!apiKey) {
    return '星辰今日沉默不语——请点击右上角钥匙图标，输入你的 API Key 以启用解读功能。';
  }

  const provider = (localStorage.getItem('tarot_api_provider') as ApiProvider) || 'gemini';
  const model = localStorage.getItem('tarot_api_model') || '';
  const baseUrl = localStorage.getItem('tarot_api_base_url') || 'https://api.deepseek.com';
  const prompt = buildPrompt(question, spreadName, cards);

  try {
    if (provider === 'openai') {
      return await callOpenAI(apiKey, model, baseUrl, prompt);
    }
    return await callGemini(apiKey, model, prompt);
  } catch (error) {
    console.error('获取解读失败:', error);
    return '与宇宙的连接中断了，请稍后再试。';
  }
}
