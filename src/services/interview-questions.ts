/**
 * Interview Questions Generator
 * Creates dynamic interview questions based on company and role
 */

export interface InterviewQuestion {
    id: string;
    type: 'intro' | 'technical' | 'behavioral' | 'situational' | 'closing';
    question: string;
    followUp?: string;
}

/**
 * Generate interview questions for a specific company and role
 */
export function generateInterviewQuestions(
    companyName: string,
    roleName?: string
): InterviewQuestion[] {
    const role = roleName || 'Software Engineer';

    return [
        // Introduction (30 seconds response expected)
        {
            id: 'q1',
            type: 'intro',
            question: `Hi! Welcome to your mock interview for ${companyName}. Let's start with a quick introduction. Tell me about yourself and why you're interested in the ${role} position at ${companyName}.`,
        },
        // Technical question (1 minute response expected)
        {
            id: 'q2',
            type: 'technical',
            question: `Great! Now let's talk about your technical skills. Can you describe a challenging technical problem you've solved recently and walk me through your approach?`,
            followUp: `What would you have done differently if you had more time?`,
        },
        // Behavioral question (1 minute response expected)
        {
            id: 'q3',
            type: 'behavioral',
            question: `Tell me about a time when you had to work under pressure to meet a tight deadline. How did you handle it?`,
        },
        // Situational question (1 minute response expected)
        {
            id: 'q4',
            type: 'situational',
            question: `Imagine you're working on a project and you realize the requirements have changed significantly. How would you handle this situation?`,
        },
        // Company-specific question (45 seconds response expected)
        {
            id: 'q5',
            type: 'behavioral',
            question: `What do you know about ${companyName}'s products or services? Why do you think you'd be a good fit for the team here?`,
        },
        // Closing (30 seconds response expected)
        {
            id: 'q6',
            type: 'closing',
            question: `We're almost at the end. Do you have any questions about the ${role} position or ${companyName}?`,
        },
    ];
}

/**
 * Generate AI responses based on user's answer
 */
export function generateTransitionResponse(questionType: string): string {
    const transitions: Record<string, string[]> = {
        intro: [
            "That's a great introduction!",
            "Wonderful, thanks for sharing.",
            "Excellent background!",
        ],
        technical: [
            "Interesting approach!",
            "That shows good problem-solving skills.",
            "Thanks for walking me through that.",
        ],
        behavioral: [
            "Great example!",
            "That demonstrates strong soft skills.",
            "I appreciate the detailed response.",
        ],
        situational: [
            "Good thinking!",
            "That's a practical approach.",
            "Nice way to handle that situation.",
        ],
        closing: [
            "Those are great questions!",
            "Thanks for asking.",
        ],
    };

    const options = transitions[questionType] || transitions.behavioral;
    return options[Math.floor(Math.random() * options.length)];
}

/**
 * Format time remaining as MM:SS
 */
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Default interview duration in seconds (5 minutes)
 */
export const INTERVIEW_DURATION = 5 * 60;
