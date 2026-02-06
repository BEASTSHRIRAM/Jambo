"use client";

import * as React from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { ExternalLink, MapPin, Building2, Users, BookOpen, Star } from "lucide-react";

/**
 * Zod schema for CandidateCard props
 */
export const candidateCardSchema = z.object({
    name: z.string().describe("Full name of the candidate"),
    username: z.string().describe("GitHub username"),
    github_url: z.string().describe("Link to GitHub profile"),
    avatar_url: z.string().describe("URL to avatar image"),
    bio: z.string().optional().describe("Short bio"),
    location: z.string().optional().describe("Location"),
    company: z.string().optional().describe("Current company"),
    languages: z.array(z.string()).describe("Programming languages"),
    public_repos: z.number().describe("Number of public repos"),
    followers: z.number().describe("Number of followers"),
    confidence_score: z.number().describe("AI confidence score 0-1"),
});

export type CandidateCardProps = z.infer<typeof candidateCardSchema>;

/**
 * CandidateCard - Tambo generative component
 * Displays a GitHub developer profile card
 */
export const CandidateCard = React.forwardRef<HTMLDivElement, CandidateCardProps & { className?: string }>(
    (
        {
            name,
            username,
            github_url,
            avatar_url,
            bio,
            location,
            company,
            languages,
            public_repos,
            followers,
            confidence_score,
            className,
        },
        ref
    ) => {
        // Defensive defaults for props that may be undefined during streaming
        const safeLanguages = languages || [];
        const safeConfidenceScore = confidence_score || 0;
        const safePublicRepos = public_repos || 0;
        const safeFollowers = followers || 0;

        const confidencePercent = Math.round(safeConfidenceScore * 100);
        const confidenceColor =
            confidencePercent >= 70 ? "from-green-500 to-emerald-500" :
                confidencePercent >= 40 ? "from-yellow-500 to-orange-500" :
                    "from-red-500 to-pink-500";

        return (
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                    "group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300",
                    className
                )}
            >
                {/* Confidence Badge */}
                <div className="absolute top-4 right-4 z-10">
                    <div className={cn(
                        "px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r",
                        confidenceColor
                    )}>
                        {confidencePercent}% match
                    </div>
                </div>

                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4 mb-4">
                        <img
                            src={avatar_url}
                            alt={name}
                            className="w-16 h-16 rounded-xl object-cover ring-2 ring-purple-500/20"
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                {name}
                            </h3>
                            <p className="text-sm text-purple-600 dark:text-purple-400">@{username}</p>
                            {(location || company) && (
                                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                    {location && (
                                        <span className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" />
                                            {location}
                                        </span>
                                    )}
                                    {company && (
                                        <span className="flex items-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            {company}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bio */}
                    {bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                            {bio}
                        </p>
                    )}

                    {/* Skills */}
                    {safeLanguages.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {safeLanguages.slice(0, 4).map((lang, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md"
                                >
                                    {lang}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Stats */}
                    <div className="flex items-center gap-4 mb-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            {safePublicRepos} repos
                        </span>
                        <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {safeFollowers} followers
                        </span>
                    </div>

                    {/* Confidence Bar */}
                    <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-500">Match Score</span>
                            <span className="font-medium text-gray-700 dark:text-gray-300">{confidencePercent}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${confidencePercent}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className={cn("h-full bg-gradient-to-r", confidenceColor)}
                            />
                        </div>
                    </div>

                    {/* Action */}
                    <a
                        href={github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all"
                    >
                        View Profile
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>
            </motion.div>
        );
    }
);

CandidateCard.displayName = "CandidateCard";

/**
 * Zod schema for CandidateList props
 */
export const candidateListSchema = z.object({
    candidates: z.array(candidateCardSchema).describe("List of candidates to display"),
    search_query: z.string().optional().describe("The search query used"),
    total_repos_searched: z.number().optional().describe("Number of repos searched"),
});

export type CandidateListProps = z.infer<typeof candidateListSchema>;

/**
 * CandidateList - Tambo generative component
 * Displays a grid of candidate cards
 */
export const CandidateList = React.forwardRef<HTMLDivElement, CandidateListProps & { className?: string }>(
    ({ candidates, search_query, total_repos_searched, className }, ref) => {
        if (!candidates || candidates.length === 0) {
            return (
                <div ref={ref} className={cn("p-8 text-center", className)}>
                    <div className="text-gray-500 dark:text-gray-400">
                        No candidates found. Try adjusting your search criteria.
                    </div>
                </div>
            );
        }

        return (
            <div ref={ref} className={cn("space-y-6", className)}>
                {/* Search Summary */}
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between px-4 py-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800"
                >
                    <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <span className="font-medium text-purple-900 dark:text-purple-100">
                            Found {candidates.length} candidates
                        </span>
                        {search_query && (
                            <span className="text-sm text-purple-600 dark:text-purple-400">
                                for &ldquo;{search_query}&rdquo;
                            </span>
                        )}
                    </div>
                    {total_repos_searched && (
                        <span className="text-sm text-purple-600 dark:text-purple-400">
                            {total_repos_searched} repos analyzed
                        </span>
                    )}
                </motion.div>

                {/* Candidates Grid */}
                <div className="grid gap-4 md:grid-cols-2">
                    {candidates.map((candidate, index) => (
                        <motion.div
                            key={candidate.username}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                        >
                            <CandidateCard {...candidate} />
                        </motion.div>
                    ))}
                </div>
            </div>
        );
    }
);

CandidateList.displayName = "CandidateList";
