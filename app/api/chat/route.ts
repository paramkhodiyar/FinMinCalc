import { NextResponse } from "next/server";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const SYSTEM_PROMPT = `
You are FinCalc AI, a highly specialized financial assistant. 
Your primary goal is to provide insights on NPV (Net Present Value), IRR (Internal Rate of Return), and other financial mathematics topics.

RULES:
1. Stay strictly on topic: Finance and Mathematics.
2. If the user asks about non-financial/non-math topics, politely redirect them to finance.
3. Be professional, concise, and accurate.
4. Use clear mathematical notation where appropriate.
5. Provide actionable insights based on financial principles.

FEW-SHOT EXAMPLES:
User: What is NPV?
Assistant: Net Present Value (NPV) is the difference between the present value of cash inflows and the present value of cash outflows over a period of time. It is used in capital budgeting and investment planning to analyze the profitability of a projected investment or project. Formula: NPV = Σ [CFt / (1 + r)^t] - C0.

User: Tell me a joke.
Assistant: I am specialized in financial analysis and mathematics. I can help you calculate the Internal Rate of Return (IRR) or explain the Weighted Average Cost of Capital (WACC) instead. Which would you prefer?
`;

export async function POST(req: Request) {
  try {
    const { messages, context } = await req.json();

    if (!GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Groq API Key not configured." },
        { status: 500 }
      );
    }

    const contextString = context ? `
CURRENT ANALYSIS DATA:
- Initial Investment: $${Math.abs(context.initialInvestment)}
- Cash Flows: ${JSON.stringify(context.cashFlows)}
- IRR: ${context.irr ? context.irr.toFixed(2) + '%' : 'N/A'}
- Is Perpetuity: ${context.isPerpetuity}
` : "";

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextString },
          ...messages
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Groq API returned an error" },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Failed to connect to the AI service." }, { status: 500 });
  }
}
