/**
 * Job Seeker-specific Tambo configuration
 * Custom components, tools, and AI system prompt for Jambo job seeker mode
 */

import { JobCard, jobCardSchema, JobList, jobListSchema } from "@/components/recruitment/JobCard";
import { CompanyCard, companyCardSchema, CompanyList, companyListSchema } from "@/components/recruitment/CompanyCard";
import { InterviewPopup, interviewPopupSchema } from "@/components/interview/InterviewPopup";
import { searchJobs } from "@/services/jsearch-jobs";
import { searchCompanies } from "@/services/glassdoor-company";
import type { TamboComponent, TamboTool } from "@tambo-ai/react";
import { z } from "zod";

/**
 * Jambo AI System Prompt for Job Seeker Mode
 */
export const JAMBO_JOBSEEKER_SYSTEM_PROMPT = `You are Jambo, an AI assistant specially made for helping students find jobs and recruiters find talented candidates. You were created by a student. You are friendly, professional, and knowledgeable about the tech industry.

IDENTITY:
When anyone asks "Who are you?" or similar questions, respond with:
"I'm Jambo! I'm an AI assistant specially designed to help students and job seekers find great job opportunities. I was created by a student who understands the challenges of job hunting. How can I help you find your dream job today?"

CAPABILITIES (for job seekers):
- Search for jobs by role, skills, and keywords (use searchJobs)
- Filter jobs by LOCATION, job type, remote-only, date posted
- Display job listings with salary info and application links
- Search for company information and ratings (use searchCompanies)
- Show company reviews, ratings, and salary data from Glassdoor
- Offer mock interview practice with AI interviewer (use InterviewPopup)

TOOL SELECTION GUIDE - VERY IMPORTANT:
1. Use searchJobs for: Job listings, openings, hiring positions
   Examples: "Find SDE intern jobs", "React developer positions in NYC", "Remote Python jobs"

2. Use searchCompanies for: Company info, ratings, reviews, culture
   Examples: "Is Meta a good company?", "Tell me about Google", "What's the rating for Amazon?"

HOW TO USE TOOLS:
For job searches:
1. Use searchJobs with appropriate parameters
2. Display results using JobList component
3. Provide helpful tips about the results

For company information:
1. Use searchCompanies with the company name as query
2. Display results using CompanyList component
3. Summarize the rating and provide insights

INTERVIEW PRACTICE FLOW - PROACTIVELY OFFER THIS:
After showing job listings OR company information, ALWAYS proactively suggest:
"Would you like to practice for an interview with any of these companies? I can conduct a 5-minute mock interview! 🎤"

If user says "yes" or shows interest:
1. Ask: "Great! Which company would you like to practice interviewing for?"
2. Once they specify a company name, use the InterviewPopup component with:
   - companyName: the company they mentioned
   - roleName: the job role if known, otherwise use "Software Engineer"

Example:
User: "Yes, I'd like to practice for Google"
Action: Render InterviewPopup with companyName="Google", roleName="Software Engineer"

TONE:
- Be encouraging and supportive
- Keep responses concise but informative
- Always offer to help refine the search
- Proactively suggest interview practice after showing jobs/companies

EXAMPLE INTERACTIONS:
User: "Find me software engineer jobs in San Francisco"
Action: Use searchJobs with query="software engineer", location="San Francisco"
After showing results, say: "I found some great opportunities! Would you like to practice for an interview with any of these companies? 🎤"

User: "Is Meta a good company to work for?"
Action: Use searchCompanies with query="Meta", then display with CompanyList
After showing results, say: "Meta has a great rating! Would you like to practice for a Meta interview? I can help you prepare! 🎤"

User: "Tell me about companies hiring for SDE intern"
Action: Use searchJobs with query="SDE intern" (this is looking for job listings, not company info)`;

/**
 * Job Seeker-specific Tambo tools
 */
export const jobseekerTools: TamboTool[] = [
    {
        name: "searchJobs",
        description:
            "Search for job listings and openings. Use this when users ask for job positions, hiring opportunities, or want to find jobs. Returns job listings with salary, company, location, and application links.",
        tool: searchJobs,
        inputSchema: z.object({
            query: z
                .string()
                .describe("Job search query (e.g., 'React developer', 'SDE intern', 'Data scientist')"),
            location: z
                .string()
                .optional()
                .describe("Location to search in (e.g., 'Chicago', 'San Francisco', 'New York', 'India')"),
            remote_only: z
                .boolean()
                .optional()
                .describe("If true, only return remote job listings"),
            employment_type: z
                .enum(["FULLTIME", "PARTTIME", "CONTRACTOR", "INTERN"])
                .optional()
                .describe("Type of employment: FULLTIME, PARTTIME, CONTRACTOR, or INTERN"),
            date_posted: z
                .enum(["all", "today", "3days", "week", "month"])
                .optional()
                .describe("Filter by when the job was posted"),
        }),
        outputSchema: z.object({
            jobs: z.array(
                z.object({
                    job_id: z.string(),
                    job_title: z.string(),
                    employer_name: z.string(),
                    employer_logo: z.string().nullable(),
                    employer_website: z.string().nullable(),
                    job_location: z.string(),
                    job_city: z.string(),
                    job_state: z.string(),
                    job_country: z.string(),
                    job_employment_type: z.string(),
                    job_is_remote: z.boolean(),
                    job_posted_human_readable: z.string(),
                    job_description: z.string(),
                    job_apply_link: z.string(),
                    job_min_salary: z.number().nullable(),
                    job_max_salary: z.number().nullable(),
                    job_salary_currency: z.string().nullable(),
                    job_salary_period: z.string().nullable(),
                    job_highlights: z.object({
                        qualifications: z.array(z.string()).optional(),
                        responsibilities: z.array(z.string()).optional(),
                        benefits: z.array(z.string()).optional(),
                    }).nullable(),
                })
            ),
            total_results: z.number(),
            search_query: z.string(),
        }),
    },
    {
        name: "searchCompanies",
        description:
            "Search for company information and Glassdoor ratings. Use this when users ask about a specific company's reputation, ratings, reviews, or culture. DO NOT use for job listings - use searchJobs for that. Examples: 'Is Meta a good company?', 'Tell me about Google', 'What's Amazon's rating?'",
        tool: searchCompanies,
        inputSchema: z.object({
            query: z
                .string()
                .describe("Company name to search for (e.g., 'Meta', 'Google', 'Amazon', 'Microsoft')"),
        }),
        outputSchema: z.object({
            companies: z.array(
                z.object({
                    id: z.number(),
                    shortName: z.string(),
                    squareLogoUrl: z.string().nullable(),
                    overallRating: z.number(),
                    jobCount: z.number(),
                    reviewCount: z.number(),
                    salaryCount: z.number(),
                })
            ),
            total_results: z.number(),
            search_query: z.string(),
        }),
    },
];

/**
 * Job Seeker-specific Tambo components
 */
export const jobseekerComponents: TamboComponent[] = [
    {
        name: "JobCard",
        description:
            "Displays a single job listing card with company logo, job title, location, salary, description, and apply button. Use for showing individual job details.",
        component: JobCard,
        propsSchema: jobCardSchema,
    },
    {
        name: "JobList",
        description:
            "Displays a grid of job cards with a search summary header. Best used to show results from the searchJobs tool. Pass the entire result object as props.",
        component: JobList,
        propsSchema: jobListSchema,
    },
    {
        name: "CompanyCard",
        description:
            "Displays a single company card with logo, Glassdoor rating (stars), job count, review count, and salary count. Use for showing individual company details.",
        component: CompanyCard,
        propsSchema: companyCardSchema,
    },
    {
        name: "CompanyList",
        description:
            "Displays a grid of company cards with a search summary header. Best used to show results from the searchCompanies tool. Pass the entire result object as props.",
        component: CompanyList,
        propsSchema: companyListSchema,
    },
    {
        name: "InterviewPopup",
        description:
            "Opens a full-screen AI-powered mock interview popup. Use this when the user wants to practice interviewing for a specific company. The popup includes video chat with AI interviewer, 5-minute timer, mic/camera controls. Always ask which company before using this.",
        component: InterviewPopup,
        propsSchema: interviewPopupSchema,
    },
];
