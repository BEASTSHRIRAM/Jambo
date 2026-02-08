"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLink, MapPin, Building2, Clock, Briefcase, DollarSign } from "lucide-react";

/**
 * Zod schema for JobCard props
 */
export const jobCardSchema = z.object({
    job_id: z.string().describe("Unique job identifier"),
    job_title: z.string().describe("Job title"),
    employer_name: z.string().describe("Company name"),
    employer_logo: z.string().nullable().describe("Company logo URL"),
    job_location: z.string().describe("Job location"),
    job_employment_type: z.string().describe("Employment type (FULLTIME, PARTTIME, etc.)"),
    job_is_remote: z.boolean().describe("Whether the job is remote"),
    job_posted_human_readable: z.string().describe("Human readable posting date"),
    job_description: z.string().describe("Job description (truncated)"),
    job_apply_link: z.string().describe("Link to apply for the job"),
    job_min_salary: z.number().nullable().describe("Minimum salary"),
    job_max_salary: z.number().nullable().describe("Maximum salary"),
    job_salary_currency: z.string().nullable().describe("Salary currency"),
    job_salary_period: z.string().nullable().describe("Salary period (YEAR, MONTH, etc.)"),
    job_highlights: z.object({
        qualifications: z.array(z.string()).optional(),
        responsibilities: z.array(z.string()).optional(),
        benefits: z.array(z.string()).optional(),
    }).nullable().describe("Job highlights"),
});

export type JobCardProps = z.infer<typeof jobCardSchema>;

/**
 * JobCard Component - Displays a job listing card
 */
export const JobCard = React.forwardRef<HTMLDivElement, JobCardProps & { className?: string }>(
    (
        {
            job_title,
            employer_name,
            employer_logo,
            job_location,
            job_employment_type,
            job_is_remote,
            job_posted_human_readable,
            job_description,
            job_apply_link,
            job_min_salary,
            job_max_salary,
            job_salary_currency,
            job_salary_period,
            job_highlights,
            className,
        },
        ref
    ) => {
        // Defensive defaults
        const safeEmploymentType = job_employment_type || "FULLTIME";
        const safeDescription = job_description || "";
        const safeHighlights = job_highlights || {};

        // Format employment type
        const formatEmploymentType = (type: string) => {
            const types: Record<string, string> = {
                FULLTIME: "Full-time",
                PARTTIME: "Part-time",
                CONTRACTOR: "Contract",
                INTERN: "Internship",
            };
            return types[type] || type;
        };

        // Format salary
        const formatSalary = () => {
            if (!job_min_salary && !job_max_salary) return null;
            const currency = job_salary_currency || "USD";
            const period = job_salary_period?.toLowerCase() || "year";

            if (job_min_salary && job_max_salary) {
                return `${currency} ${(job_min_salary / 1000).toFixed(0)}k - ${(job_max_salary / 1000).toFixed(0)}k / ${period}`;
            }
            if (job_min_salary) {
                return `${currency} ${(job_min_salary / 1000).toFixed(0)}k+ / ${period}`;
            }
            if (job_max_salary) {
                return `Up to ${currency} ${(job_max_salary / 1000).toFixed(0)}k / ${period}`;
            }
            return null;
        };

        const salary = formatSalary();

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={cn(
                    "relative overflow-hidden rounded-2xl",
                    "bg-gradient-to-br from-slate-900/90 to-slate-800/90",
                    "border border-white/10 backdrop-blur-xl",
                    "p-4 sm:p-5 hover:border-blue-500/50 transition-all duration-300",
                    "hover:shadow-lg hover:shadow-blue-500/10",
                    "w-full min-w-0",
                    className
                )}
            >
                {/* Header with logo and company */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
                        {employer_logo ? (
                            <img
                                src={employer_logo}
                                alt={employer_name}
                                className="w-full h-full object-contain p-2"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        ) : (
                            <Building2 className="w-6 h-6 text-blue-400" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-white truncate">{job_title || "Job Title"}</h3>
                        <p className="text-blue-300 font-medium truncate">{employer_name || "Company"}</p>
                    </div>

                    {/* Remote badge */}
                    {job_is_remote && (
                        <span className="px-2 py-1 text-xs font-medium bg-green-500/20 text-green-400 rounded-md border border-green-500/30">
                            Remote
                        </span>
                    )}
                </div>

                {/* Job details */}
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-white truncate max-w-[150px] sm:max-w-none">{job_location || "Location not specified"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-white">{formatEmploymentType(safeEmploymentType)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="text-white">{job_posted_human_readable || "Recently"}</span>
                    </div>
                </div>

                {/* Salary if available */}
                {salary && (
                    <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-green-300 font-medium">{salary}</span>
                    </div>
                )}

                {/* Description */}
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">{safeDescription}</p>

                {/* Highlights */}
                {safeHighlights.benefits && safeHighlights.benefits.length > 0 && (
                    <div className="mb-4">
                        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Benefits</p>
                        <div className="flex flex-wrap gap-2">
                            {safeHighlights.benefits.slice(0, 3).map((benefit, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 text-xs bg-blue-500/10 text-blue-300 rounded-md border border-blue-500/20"
                                >
                                    {benefit.length > 30 ? benefit.slice(0, 30) + "..." : benefit}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Apply button */}
                <a
                    href={job_apply_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300"
                >
                    Apply Now
                    <ExternalLink className="w-4 h-4" />
                </a>
            </motion.div>
        );
    }
);

JobCard.displayName = "JobCard";

/**
 * Zod schema for JobList props
 */
export const jobListSchema = z.object({
    jobs: z.array(jobCardSchema).describe("Array of job listings"),
    total_results: z.number().describe("Total number of results"),
    search_query: z.string().describe("The search query used"),
});

export type JobListProps = z.infer<typeof jobListSchema>;

/**
 * JobList Component - Displays a grid of job cards
 */
export const JobList = React.forwardRef<HTMLDivElement, JobListProps & { className?: string }>(
    ({ jobs, total_results, search_query, className }, ref) => {
        const safeJobs = jobs || [];
        const safeTotal = total_results || 0;
        const safeQuery = search_query || "jobs";

        if (safeJobs.length === 0) {
            return (
                <div
                    ref={ref}
                    className={cn(
                        "rounded-2xl bg-slate-900/50 border border-white/10 p-8 text-center",
                        className
                    )}
                >
                    <Briefcase className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
                    <p className="text-gray-400">
                        Try adjusting your search criteria or broadening your location.
                    </p>
                </div>
            );
        }

        return (
            <div ref={ref} className={cn("space-y-4", className)}>
                {/* Results header */}
                <div className="flex items-center justify-between px-1">
                    <p className="text-gray-400">
                        Found <span className="text-white font-medium">{safeTotal}</span> jobs for{" "}
                        <span className="text-blue-400">{safeQuery}</span>
                    </p>
                </div>

                {/* Job cards grid */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                    {safeJobs.map((job, index) => (
                        <motion.div
                            key={job.job_id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <JobCard {...job} />
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }
);

JobList.displayName = "JobList";
