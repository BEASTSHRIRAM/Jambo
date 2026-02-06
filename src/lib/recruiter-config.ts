/**
 * Recruiter-specific Tambo configuration
 * Custom components, tools, and AI system prompt for Jambo recruiter mode
 */

import { CandidateCard, candidateCardSchema, CandidateList, candidateListSchema } from "@/components/recruitment/CandidateCard";
import { searchGitHubTalent } from "@/services/github-talent";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * Jambo AI System Prompt for Recruiter Mode
 */
export const JAMBO_RECRUITER_SYSTEM_PROMPT = `You are Jambo, an AI assistant specially made for helping students find jobs and recruiters find talented candidates. You were created by a student. You are friendly, professional, and knowledgeable about the tech industry.

IDENTITY:
When anyone asks "Who are you?" or similar questions, respond with:
"I'm Jambo! I'm an AI assistant specially designed to help students find great job opportunities and help recruiters discover talented developers. I was created by a student who understands the challenges of job hunting and recruiting. How can I help you today?"

CAPABILITIES (for recruiters):
- Search GitHub for talented developers by programming language and skills
- Filter candidates by LOCATION (city, country, or region)
- Filter candidates by experience level (junior, mid, senior)
- Display candidate profiles with GitHub activity and match scores
- Provide insights about candidates' open source contributions

HOW TO USE TOOLS:
When a recruiter asks to find developers (e.g., "Find Python developers in Bangalore"):
1. Use the searchGitHubTalent tool with appropriate parameters including location if specified
2. Display the results using the CandidateList component
3. Provide a brief summary of the findings

TONE:
- Be professional and helpful
- Keep responses concise but informative
- Always offer to help further

EXAMPLE INTERACTIONS:
User: "Find me React developers in San Francisco"
Response: Use searchGitHubTalent with language="JavaScript", skills=["React"], location="San Francisco", then display results with CandidateList.

User: "I need senior Python developers in Bangalore with machine learning experience"
Response: Use searchGitHubTalent with language="Python", skills=["machine-learning"], location="Bangalore", experienceLevel="senior", then display results.

User: "Find Go developers"
Response: Use searchGitHubTalent with language="Go", then display results with CandidateList.`;

/**
 * Recruiter-specific Tambo tools
 */
export const recruiterTools: TamboTool[] = [
    {
        name: "searchGitHubTalent",
        description:
            "Search GitHub for talented developers based on programming language, skills, and experience level. Returns a list of candidates with their profiles, activity stats, and match scores.",
        tool: searchGitHubTalent,
        inputSchema: z.object({
            language: z
                .string()
                .describe("Primary programming language to search for (e.g., Python, JavaScript, Go, Rust)"),
            skills: z
                .array(z.string())
                .optional()
                .describe("Additional skills or technologies to filter by (e.g., React, Django, machine-learning)"),
            location: z
                .string()
                .optional()
                .describe("Location to filter candidates by (e.g., Bangalore, San Francisco, India, USA). Uses GitHub's location search."),
            experienceLevel: z
                .enum(["junior", "mid", "senior"])
                .optional()
                .describe("Target experience level - affects minimum repo/follower requirements"),
        }),
        outputSchema: z.object({
            candidates: z.array(
                z.object({
                    name: z.string(),
                    username: z.string(),
                    github_url: z.string(),
                    avatar_url: z.string(),
                    bio: z.string(),
                    location: z.string(),
                    company: z.string(),
                    email: z.string().nullable(),
                    languages: z.array(z.string()),
                    public_repos: z.number(),
                    followers: z.number(),
                    confidence_score: z.number(),
                })
            ),
            total_repos_searched: z.number(),
            search_query: z.string(),
        }),
    },
];

/**
 * Recruiter-specific Tambo components
 */
export const recruiterComponents: TamboComponent[] = [
    {
        name: "CandidateCard",
        description:
            "Displays a single GitHub developer profile card with their avatar, name, bio, skills, stats (repos, followers), and a match confidence score. Use for showing individual candidate details.",
        component: CandidateCard,
        propsSchema: candidateCardSchema,
    },
    {
        name: "CandidateList",
        description:
            "Displays a grid of candidate cards with a search summary header. Best used to show results from the searchGitHubTalent tool. Pass the entire result object as props.",
        component: CandidateList,
        propsSchema: candidateListSchema,
    },
];
