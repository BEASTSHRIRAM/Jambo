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

export interface FeedbackContext {
    companyName: string;
    roleName: string;
    questions: string[];
    responses: string[];
    conversation: { speaker: 'ai' | 'user'; text: string }[];
}

export interface InterviewFeedback {
    overallRating: number;
    overallAssessment: string;
    strengths: string[];
    areasForImprovement: string[];
    tipsForNextTime: string[];
    questionFeedback: {
        question: string;
        userResponse: string;
        feedback: string;
    }[];
}

/**
 * Generate an AI response to the user's interview answer (for question transitions)
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
 * Generate a conversational response during the interview (within 2 seconds)
 * This creates natural back-and-forth dialogue
 */
export async function generateConversationalResponse(context: InterviewContext): Promise<string> {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
        return getConversationalFallback();
    }

    const systemPrompt = `You are a friendly, professional interviewer having a natural conversation with a candidate for the ${context.roleName} position at ${context.companyName}.

The candidate is answering a question. Your job is to:
1. React naturally to what they said (like a real conversation)
2. Show you're actively listening with short acknowledging phrases
3. Maybe ask a brief follow-up or clarification
4. Keep it VERY short - 10-20 words MAX
5. Be warm and encouraging
6. Don't move to the next question - just engage with their current answer

Examples of good responses:
- "That's interesting! Can you tell me more about how you handled that?"
- "I see, so you prioritized communication. What was the outcome?"
- "Good point. How did the team respond to that approach?"
- "Interesting perspective. What did you learn from that experience?"`;

    const userPrompt = `Current question: "${context.currentQuestion}"
What the candidate just said: "${context.userResponse}"

Give a brief, natural conversational response (10-20 words max).`;

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
                max_tokens: 50,
                temperature: 0.8,
            }),
        });

        if (!response.ok) {
            return getConversationalFallback();
        }

        const data = await response.json();
        const aiResponse = data.choices?.[0]?.message?.content?.trim();

        return aiResponse || getConversationalFallback();
    } catch (error) {
        console.error('Conversational response failed:', error);
        return getConversationalFallback();
    }
}

/**
 * Generate comprehensive interview feedback at the end
 */
export async function generateInterviewFeedback(context: FeedbackContext): Promise<InterviewFeedback> {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!apiKey) {
        return getDefaultFeedback(context);
    }

    const systemPrompt = `You are an expert interview coach analyzing a mock interview for a ${context.roleName} position at ${context.companyName}.

Analyze the candidate's responses and provide detailed, constructive feedback.

You MUST respond with ONLY a valid JSON object (no markdown, no code blocks, no extra text) in this exact format:
{
    "overallRating": <number 1-10>,
    "overallAssessment": "<2-3 sentence overall assessment>",
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "areasForImprovement": ["<area 1>", "<area 2>", "<area 3>"],
    "tipsForNextTime": ["<tip 1>", "<tip 2>", "<tip 3>"],
    "questionFeedback": [
        {
            "question": "<question text>",
            "userResponse": "<summary of user's response>",
            "feedback": "<specific feedback for this answer>"
        }
    ]
}`;

    // Build Q&A summary
    const qaSummary = context.questions.map((q, i) => {
        const response = context.responses[i] || 'No response provided';
        return `Q${i + 1}: ${q}\nA${i + 1}: ${response}`;
    }).join('\n\n');

    const userPrompt = `Here's the interview transcript:

${qaSummary}

Provide comprehensive feedback in the JSON format specified.`;

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
                max_tokens: 1500,
                temperature: 0.7,
            }),
        });

        if (!response.ok) {
            console.error('Feedback API error:', await response.text());
            return getDefaultFeedback(context);
        }

        const data = await response.json();
        let content = data.choices?.[0]?.message?.content?.trim();

        if (!content) {
            return getDefaultFeedback(context);
        }

        // Clean up potential markdown code blocks
        content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        try {
            const feedback = JSON.parse(content);
            return feedback as InterviewFeedback;
        } catch (parseError) {
            console.error('Failed to parse feedback JSON:', parseError);
            return getDefaultFeedback(context);
        }
    } catch (error) {
        console.error('Feedback generation failed:', error);
        return getDefaultFeedback(context);
    }
}

/**
 * Conversational fallback responses
 */
function getConversationalFallback(): string {
    const responses = [
        "That's interesting, tell me more.",
        "I see, how did that work out?",
        "Good point. What happened next?",
        "Interesting approach. Can you elaborate?",
        "I understand. What was the result?",
        "That makes sense. How did the team react?",
    ];
    return responses[Math.floor(Math.random() * responses.length)];
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

/**
 * Default feedback when API fails
 */
function getDefaultFeedback(context: FeedbackContext): InterviewFeedback {
    return {
        overallRating: 7,
        overallAssessment: `Thank you for completing this mock interview for the ${context.roleName} position at ${context.companyName}. You showed preparation and engagement throughout the interview.`,
        strengths: [
            "Demonstrated willingness to practice and improve",
            "Engaged with all interview questions",
            "Showed commitment to professional growth",
        ],
        areasForImprovement: [
            "Consider using the STAR method for behavioral questions",
            "Practice providing more specific examples",
            "Focus on quantifying your achievements where possible",
        ],
        tipsForNextTime: [
            "Research the company thoroughly before interviews",
            "Prepare 2-3 specific examples for common questions",
            "Practice your responses out loud to improve delivery",
        ],
        questionFeedback: context.questions.map((q, i) => ({
            question: q,
            userResponse: context.responses[i] || 'No response recorded',
            feedback: 'Continue practicing this type of question and focus on providing specific, relevant examples.',
        })),
    };
}

export default generateInterviewerResponse;
