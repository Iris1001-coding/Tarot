import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DrawnCard {
  index: number;
  isReversed: boolean;
  positionName: string;
}

export async function getInterpretation(question: string, spreadName: string, cards: DrawnCard[]): Promise<string> {
  const cardsDescription = cards.map(c => `位置: ${c.positionName}, 抽到的牌编号: ${c.index}, 状态: ${c.isReversed ? '逆位' : '正位'}`).join('\n');
  
  const prompt = `
    你是一位资深、神秘且充满智慧的塔罗师。
    用户选择的牌阵是: "${spreadName}"。
    用户的问题是: "${question}"。
    
    用户抽到的牌如下（基于78张标准韦特塔罗牌）:
    ${cardsDescription}
    
    请根据用户选择的牌阵、每个位置的含义以及抽到的牌，为用户提供深刻、充满诗意且富有洞察力的解读。
    请保持语言优美、神秘，字数适中（大约3-5个段落）。
    请使用中文回答。
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "星辰今日沉默不语...";
  } catch (error) {
    console.error("获取解读失败:", error);
    return "与宇宙的连接中断了，请稍后再试。";
  }
}
