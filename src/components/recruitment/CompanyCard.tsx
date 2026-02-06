"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Building2, Star, Briefcase, MessageSquare, DollarSign, ExternalLink } from "lucide-react";

/**
 * Zod schema for CompanyCard props
 */
export const companyCardSchema = z.object({
    id: z.number().describe("Glassdoor company ID"),
    shortName: z.string().describe("Company name"),
    squareLogoUrl: z.string().nullable().describe("Company logo URL"),
    overallRating: z.number().describe("Overall rating (0-5)"),
    jobCount: z.number().describe("Number of job listings"),
    reviewCount: z.number().describe("Number of reviews"),
    salaryCount: z.number().describe("Number of salary reports"),
});

export type CompanyCardProps = z.infer<typeof companyCardSchema>;

/**
 * Render star rating display
 */
const StarRating = ({ rating }: { rating: number }) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className="flex items-center gap-1">
            {[...Array(fullStars)].map((_, i) => (
                <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            ))}
            {hasHalfStar && (
                <Star className="w-4 h-4 fill-yellow-400/50 text-yellow-400" />
            )}
            {[...Array(emptyStars)].map((_, i) => (
                <Star key={`empty-${i}`} className="w-4 h-4 text-gray-600" />
            ))}
            <span className="ml-2 text-white font-semibold">{rating.toFixed(1)}</span>
        </div>
    );
};

/**
 * CompanyCard Component - Displays a company info card with Glassdoor data
 */
export const CompanyCard = React.forwardRef<HTMLDivElement, CompanyCardProps & { className?: string }>(
    (
        {
            id,
            shortName,
            squareLogoUrl,
            overallRating,
            jobCount,
            reviewCount,
            salaryCount,
            className,
        },
        ref
    ) => {
        const glassdoorUrl = `https://www.glassdoor.com/Overview/Working-at-${shortName.replace(/\s+/g, '-')}-EI_IE${id}.htm`;

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
                    "p-5 hover:border-green-500/50 transition-all duration-300",
                    "hover:shadow-lg hover:shadow-green-500/10",
                    className
                )}
            >
                {/* Header with logo and company name */}
                <div className="flex items-start gap-4 mb-4">
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-white/10 flex items-center justify-center overflow-hidden">
                        {squareLogoUrl ? (
                            <img
                                src={squareLogoUrl}
                                alt={shortName}
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                }}
                            />
                        ) : (
                            <Building2 className="w-8 h-8 text-green-400" />
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-xl text-white truncate">{shortName || "Company"}</h3>
                        <div className="mt-1">
                            <StarRating rating={overallRating} />
                        </div>
                    </div>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                        <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
                            <Briefcase className="w-4 h-4" />
                        </div>
                        <p className="text-white font-bold text-lg">{jobCount.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">Open Jobs</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                        <div className="flex items-center justify-center gap-1 text-purple-400 mb-1">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                        <p className="text-white font-bold text-lg">{reviewCount.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">Reviews</p>
                    </div>

                    <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
                        <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
                            <DollarSign className="w-4 h-4" />
                        </div>
                        <p className="text-white font-bold text-lg">{salaryCount.toLocaleString()}</p>
                        <p className="text-gray-400 text-xs">Salaries</p>
                    </div>
                </div>

                {/* Rating interpretation */}
                <div className="mb-4 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
                    <p className="text-green-300 text-sm">
                        {overallRating >= 4 && "⭐ Highly rated company - employees love working here!"}
                        {overallRating >= 3 && overallRating < 4 && "👍 Good company - generally positive employee reviews."}
                        {overallRating >= 2 && overallRating < 3 && "⚠️ Mixed reviews - consider researching more."}
                        {overallRating < 2 && overallRating > 0 && "⚠️ Low ratings - proceed with caution."}
                        {overallRating === 0 && "ℹ️ No ratings available yet."}
                    </p>
                </div>

                {/* View on Glassdoor button */}
                <a
                    href={glassdoorUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-xl transition-all duration-300"
                >
                    View on Glassdoor
                    <ExternalLink className="w-4 h-4" />
                </a>
            </motion.div>
        );
    }
);

CompanyCard.displayName = "CompanyCard";

/**
 * Zod schema for CompanyList props
 */
export const companyListSchema = z.object({
    companies: z.array(companyCardSchema).describe("Array of companies"),
    total_results: z.number().describe("Total number of results"),
    search_query: z.string().describe("The search query used"),
});

export type CompanyListProps = z.infer<typeof companyListSchema>;

/**
 * CompanyList Component - Displays a grid of company cards
 */
export const CompanyList = React.forwardRef<HTMLDivElement, CompanyListProps & { className?: string }>(
    ({ companies, total_results, search_query, className }, ref) => {
        const safeCompanies = companies || [];
        const safeTotal = total_results || 0;
        const safeQuery = search_query || "companies";

        if (safeCompanies.length === 0) {
            return (
                <div
                    ref={ref}
                    className={cn(
                        "rounded-2xl bg-slate-900/50 border border-white/10 p-8 text-center",
                        className
                    )}
                >
                    <Building2 className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No companies found</h3>
                    <p className="text-gray-400">
                        Try searching with a different company name.
                    </p>
                </div>
            );
        }

        return (
            <div ref={ref} className={cn("space-y-4", className)}>
                {/* Results header */}
                <div className="flex items-center justify-between px-1">
                    <p className="text-gray-400">
                        Found <span className="text-white font-medium">{safeTotal}</span> results for{" "}
                        <span className="text-green-400">&quot;{safeQuery}&quot;</span>
                    </p>
                </div>

                {/* Company cards grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    {safeCompanies.map((company, index) => (
                        <motion.div
                            key={company.id || index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <CompanyCard {...company} />
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }
);

CompanyList.displayName = "CompanyList";
