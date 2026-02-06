/**
 * GitHub Talent Discovery Service
 * Simplified version for Tambo tools - searches GitHub for talented developers
 */

export interface GitHubRepo {
    owner: string;
    name: string;
    full_name: string;
    stars: number;
    url: string;
    description: string;
    language: string;
}

export interface Candidate {
    name: string;
    username: string;
    github_url: string;
    avatar_url: string;
    bio: string;
    location: string;
    company: string;
    email: string | null;
    languages: string[];
    public_repos: number;
    followers: number;
    confidence_score: number;
}

export interface SearchResult {
    candidates: Candidate[];
    total_repos_searched: number;
    search_query: string;
}

/**
 * Search GitHub for repositories by language and topic
 */
export async function searchRepositories(params: {
    language: string;
    topic?: string;
    minStars?: number;
}): Promise<GitHubRepo[]> {
    const { language, topic, minStars = 50 } = params;

    // Build search query
    let query = `language:${language} stars:>=${minStars}`;
    if (topic) {
        query += ` topic:${topic}`;
    }

    try {
        const response = await fetch(
            `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=stars&order=desc&per_page=10`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    ...(process.env.NEXT_PUBLIC_GITHUB_TOKEN && {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
                    }),
                },
            }
        );

        if (!response.ok) {
            console.error("GitHub API error:", response.status);
            return [];
        }

        const data = await response.json();
        return (data.items || []).map((repo: Record<string, unknown>) => ({
            owner: (repo.owner as Record<string, unknown>)?.login || "",
            name: repo.name || "",
            full_name: repo.full_name || "",
            stars: repo.stargazers_count || 0,
            url: repo.html_url || "",
            description: repo.description || "",
            language: repo.language || language,
        }));
    } catch (error) {
        console.error("GitHub search error:", error);
        return [];
    }
}

/**
 * Get contributors from a repository
 */
async function getContributors(owner: string, repo: string): Promise<string[]> {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contributors?per_page=5`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    ...(process.env.NEXT_PUBLIC_GITHUB_TOKEN && {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
                    }),
                },
            }
        );

        if (!response.ok) return [];

        const data = await response.json();
        return data.map((c: { login: string }) => c.login);
    } catch {
        return [];
    }
}

/**
 * Get detailed user profile
 */
async function getUserProfile(username: string): Promise<Candidate | null> {
    try {
        const response = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                Accept: "application/vnd.github+json",
                ...(process.env.NEXT_PUBLIC_GITHUB_TOKEN && {
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
                }),
            },
        });

        if (!response.ok) return null;

        const user = await response.json();

        // Calculate confidence score based on activity
        const confidence = Math.min(
            1,
            0.3 * Math.min((user.public_repos || 0) / 20, 1) +
            0.3 * Math.min((user.followers || 0) / 100, 1) +
            0.2 * (user.bio ? 1 : 0) +
            0.2 * (user.company ? 1 : 0)
        );

        return {
            name: user.name || username,
            username: user.login,
            github_url: user.html_url,
            avatar_url: user.avatar_url,
            bio: user.bio || "",
            location: user.location || "",
            company: user.company || "",
            email: user.email,
            languages: [],
            public_repos: user.public_repos || 0,
            followers: user.followers || 0,
            confidence_score: Math.round(confidence * 100) / 100,
        };
    } catch {
        return null;
    }
}

/**
 * Search GitHub Users directly (supports location filtering)
 */
async function searchUsers(params: {
    language?: string;
    location?: string;
    minRepos?: number;
    minFollowers?: number;
}): Promise<string[]> {
    const { language, location, minRepos = 5, minFollowers = 10 } = params;

    // Build search query using GitHub's user search syntax
    const queryParts: string[] = [];

    if (language) {
        queryParts.push(`language:${language}`);
    }
    if (location) {
        queryParts.push(`location:${location}`);
    }
    queryParts.push(`repos:>=${minRepos}`);
    queryParts.push(`followers:>=${minFollowers}`);
    queryParts.push(`type:user`);

    const query = queryParts.join(" ");

    try {
        const response = await fetch(
            `https://api.github.com/search/users?q=${encodeURIComponent(query)}&sort=followers&order=desc&per_page=15`,
            {
                headers: {
                    Accept: "application/vnd.github+json",
                    ...(process.env.NEXT_PUBLIC_GITHUB_TOKEN && {
                        Authorization: `Bearer ${process.env.NEXT_PUBLIC_GITHUB_TOKEN}`,
                    }),
                },
            }
        );

        if (!response.ok) {
            console.error("GitHub User Search API error:", response.status);
            return [];
        }

        const data = await response.json();
        return (data.items || []).map((user: { login: string }) => user.login);
    } catch (error) {
        console.error("GitHub user search error:", error);
        return [];
    }
}

/**
 * Main function: Search for GitHub talent
 * This is the Tambo tool that will be called by AI
 * Now supports location filtering via GitHub's User Search API
 */
export async function searchGitHubTalent(params: {
    language: string;
    skills?: string[];
    location?: string;
    experienceLevel?: "junior" | "mid" | "senior";
}): Promise<SearchResult> {
    const { language, skills = [], location, experienceLevel = "mid" } = params;

    // Adjust search parameters based on experience level
    const experienceConfig = {
        junior: { minRepos: 3, minFollowers: 5 },
        mid: { minRepos: 10, minFollowers: 20 },
        senior: { minRepos: 25, minFollowers: 100 },
    }[experienceLevel];

    let usernames: string[] = [];
    let searchMethod = "user_search";

    // If location is specified, use User Search API (supports location filter)
    if (location) {
        usernames = await searchUsers({
            language,
            location,
            minRepos: experienceConfig.minRepos,
            minFollowers: experienceConfig.minFollowers,
        });
        searchMethod = "location_based";
    } else {
        // Fallback to repository-based search for general queries
        const minStars = {
            junior: 10,
            mid: 50,
            senior: 200,
        }[experienceLevel];

        const repos = await searchRepositories({
            language,
            topic: skills[0],
            minStars,
        });

        if (repos.length === 0) {
            return {
                candidates: [],
                total_repos_searched: 0,
                search_query: `${language} developers${skills.length ? ` with ${skills.join(", ")}` : ""}`,
            };
        }

        // Get unique contributors from repos
        const contributorSet = new Set<string>();
        for (const repo of repos.slice(0, 5)) {
            const contributors = await getContributors(repo.owner, repo.name);
            contributors.forEach((c) => contributorSet.add(c));
        }
        usernames = Array.from(contributorSet).slice(0, 15);
    }

    // Get detailed profiles
    const candidates: Candidate[] = [];

    for (const username of usernames.slice(0, 10)) {
        const profile = await getUserProfile(username);
        if (profile) {
            // Add the search language to their skills
            profile.languages = [language, ...skills.slice(0, 3)];

            // Boost confidence for location match if location was specified
            if (location && profile.location) {
                const locationMatch = profile.location.toLowerCase().includes(location.toLowerCase());
                if (locationMatch) {
                    profile.confidence_score = Math.min(1, profile.confidence_score + 0.15);
                }
            }

            candidates.push(profile);
        }
    }

    // Sort by confidence score
    candidates.sort((a, b) => b.confidence_score - a.confidence_score);

    // Build search query description
    let searchQuery = `${language} developers`;
    if (location) {
        searchQuery += ` in ${location}`;
    }
    if (skills.length) {
        searchQuery += ` with ${skills.join(", ")}`;
    }

    return {
        candidates,
        total_repos_searched: searchMethod === "location_based" ? 0 : usernames.length,
        search_query: searchQuery,
    };
}
