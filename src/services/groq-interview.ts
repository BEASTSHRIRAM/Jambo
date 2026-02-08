/**
 * Groq AI Service for Interview Responses
 * Generates intelligent interviewer feedback using Groq's LLM
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface InterviewContext {
    companyName: string;
    roleName: string;
    currentQuestion: string;
    questionType: 'intro' | 'technical' | 'behavioral' | 'situational' | 'closing';
    userResponse: string;
    questionNumber: number;
    totalQuestions: number;
}

/**
 * Generate an AI response to the user's interview answer
 */
export async function generateInterviewerResponse(context: InterviewContext): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
        console.warn('Groq API key not found, using fallback response');
        return getFallbackResponse(context.questionType);
    }

    const systemPrompt = `You are a professional interviewer for ${context.companyName} conducting a mock interview for a ${context.roleName} position. 

Your role is to:
1. Briefly acknowledge the candidate's response (1-2 sentences max)
2. Provide constructive feedback if relevant
3. Keep responses SHORT - under 30 words total
4. Be encouraging but professional
5. Don't repeat the question back

Current question type: ${context.questionType}
Question ${context.questionNumber} of ${context.totalQuestions}

Important: Keep your response VERY brief as it will be spoken aloud.`;

    const userPrompt = `Question asked: "${context.currentQuestion}"

Candidate's response: "${context.userResponse}"

Provide a brief, encouraging response (max 30 words).`;

    try {
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                max_tokens: 100,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error('Groq API error:', error);
            return getFallbackResponse(context.questionType);
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content?.trim();

        if (!aiResponse) {
            return getFallbackResponse(context.questionType);
        }

        return aiResponse;
    } catch (error) {
        console.error('Groq API request failed:', error);
        return getFallbackResponse(context.questionType);
    }
}

/**
 * Fallback responses when API is unavailable
 */
function getFallbackResponse(questionType: string): string {
    const responses: Record<string, string[]> = {
        intro: [
            "Great introduction! I appreciate you sharing that.",
            "Thank you for that overview. That's helpful context.",
            "Nice to learn more about your background.",
        ],
        technical: [
            "Good technical explanation. I like your approach.",
            "Interesting solution. You've demonstrated solid reasoning.",
            "That shows good technical understanding.",
        ],
        behavioral: [
            "That's a great example. I can see your problem-solving skills.",
            "Thank you for sharing that experience.",
            "That demonstrates strong professional qualities.",
        ],
        situational: [
            "Good thinking through that scenario.",
            "I like your approach to handling that situation.",
            "That shows good judgment and decision-making.",
        ],
        closing: [
            "Those are thoughtful questions.",
            "I appreciate your curiosity about the role.",
            "Great questions to ask.",
        ],
    };

    const typeResponses = responses[questionType] || responses.behavioral;
    return typeResponses[Math.floor(Math.random() * typeResponses.length)];
}

export default generateInterviewerResponse;
