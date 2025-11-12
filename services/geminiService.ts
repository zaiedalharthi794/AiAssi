import { GoogleGenAI, Type } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const SMART_ASSISTANT_INSTRUCTION = `أنت "مساعدك الذكي"، خبير ذكاء اصطناعي متعدد الأوجه. عند الإجابة على استعلام المستخدم، فكّر فيه من ثلاث زوايا مختلفة:
1.  **الزاوية التحليلية:** قدم وجهة نظر منطقية ومنظمة ومبنية على البيانات.
2.  **الزاوية الإبداعية:** قدم أفكارًا مبتكرة وغير تقليدية ووجهات نظر جديدة.
3.  **الزاوية المتعاطفة:** ركز على الجوانب الإنسانية والعاطفية، وقدم نصائح عملية وداعمة.

مهمتك هي دمج هذه الزوايا الثلاث في إجابة واحدة شاملة ومتماسكة وسهلة الفهم. قدم الإجابة النهائية مباشرة دون الإشارة إلى وجهات النظر المنفصلة أو عملية التفكير الداخلية. كن ودودًا وداعمًا ومتعاطفًا في ردك. استخدم اللغة العربية الفصحى المبسطة. ابدأ دائمًا بترحيب لطيف. اجعل إجابتك واضحة وصريحة.`;


export const getAdvice = async (message: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
            systemInstruction: SMART_ASSISTANT_INSTRUCTION
        }
    });

    return response.text;

  } catch (error)
 {
    console.error("Error getting advice from Gemini:", error);
    return "عفوًا، حدث خطأ ما أثناء محاولة الحصول على نصيحة. يرجى المحاولة مرة أخرى لاحقًا.";
  }
};


export const getSuggestedQuestions = async (lastUserMessage: string, lastModelMessage: string): Promise<string[]> => {
    const prompt = `بناءً على المحادثة التالية:
    المستخدم: "${lastUserMessage}"
    أنت: "${lastModelMessage}"
  
    اقترح ثلاثة أسئلة متابعة ذات صلة قد يطرحها المستخدم. أجب فقط بمصفوفة JSON تحتوي على الأسئلة الثلاثة.
    مثال على التنسيق: ["ما هي الخطوة الأولى؟", "هل يمكنك التوضيح أكثر؟", "كيف أطبق هذا؟"]`;
  
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.STRING,
              description: "A follow-up question."
            }
          },
        },
      });
  
      const jsonText = response.text.trim();
      const questions = JSON.parse(jsonText);
  
      if (Array.isArray(questions) && questions.every(q => typeof q === 'string')) {
        return questions.slice(0, 3);
      }
      return [];
    } catch (error) {
      console.error("Error generating suggested questions:", error);
      return [];
    }
  };