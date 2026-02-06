/**
 * Job Seeker-specific Tambo configuration
 * Custom components, tools, and AI system prompt for Jambo job seeker mode
 */

import { JobCard, jobCardSchema, JobList, jobListSchema } from "@/components/recruitment/JobCard";
import { searchJobs } from "@/services/jsearch-jobs";
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
- Search for jobs by role, skills, and keywords
- Filter jobs by LOCATION (city, country, or region)
- Filter by job type (full-time, part-time, contract, internship)
- Filter remote-only positions
- Filter by date posted (today, 3 days, week, month)
- Display job listings with salary info and application links

HOW TO USE TOOLS:
When a job seeker asks to find jobs (e.g., "Find React developer jobs in Chicago"):
1. Use the searchJobs tool with appropriate parameters
2. Display the results using the JobList component
3. Provide a brief summary of the findings with helpful tips

TONE:
- Be encouraging and supportive
- Keep responses concise but informative
- Always offer to help refine the search

EXAMPLE INTERACTIONS:
User: "Find me software engineer jobs in San Francisco"
Response: Use searchJobs with query="software engineer", location="San Francisco", then display results with JobList.

User: "I need remote Python developer internships"
Response: Use searchJobs with query="Python developer", employment_type="INTERN", remote_only=true, then display results.

User: "Show me full-time React jobs posted this week"
Response: Use searchJobs with query="React developer", employment_type="FULLTIME", date_posted="week", then display results.`;

/**
 * Job Seeker-specific Tambo tools
 */
export const jobseekerTools: TamboTool[] = [
    {
        name: "searchJobs",
        description:
            "Search for job listings using JSearch API. Returns job listings with details like salary, company, location, and application links. Supports filtering by location, employment type, remote-only, and date posted.",
        tool: searchJobs,
        inputSchema: z.object({
            query: z
                .string()
                .describe("Job search query (e.g., 'React developer', 'Python engineer', 'Data scientist')"),
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
];
