/**
 * Glassdoor Company Search Service
 * Uses RapidAPI's Glassdoor Real-Time API to search for company information
 */

export interface Company {
    id: number;
    shortName: string;
    squareLogoUrl: string | null;
    overallRating: number;
    jobCount: number;
    reviewCount: number;
    salaryCount: number;
}

export interface CompanySearchResult {
    companies: Company[];
    total_results: number;
    search_query: string;
}

const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || "30e1331ea5msh5f4be0f874d73eap1c2fd5jsn9a59b62b5953";
const RAPIDAPI_HOST = "glassdoor-real-time.p.rapidapi.com";

/**
 * Search for companies using Glassdoor Real-Time API
 * Use this when users ask about company ratings, reviews, or general company information
 */
export async function searchCompanies(params: {
    query: string;
}): Promise<CompanySearchResult> {
    const { query } = params;

    const url = new URL("https://glassdoor-real-time.p.rapidapi.com/companies/search");
    url.searchParams.set("query", query);

    try {
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "x-rapidapi-host": RAPIDAPI_HOST,
                "x-rapidapi-key": RAPIDAPI_KEY,
            },
        });

        if (!response.ok) {
            console.error("Glassdoor API error:", response.status);
            return {
                companies: [],
                total_results: 0,
                search_query: query,
            };
        }

        const data = await response.json();

        if (!data.status || !data.data?.employerResults) {
            return {
                companies: [],
                total_results: 0,
                search_query: query,
            };
        }

        // Transform API response to our Company interface
        const companies: Company[] = (data.data.employerResults || [])
            .slice(0, 10)
            .map((result: Record<string, unknown>) => {
                const employer = result.employer as Record<string, unknown> || {};
                const counts = employer.counts as Record<string, unknown> || {};
                const globalJobCount = counts.globalJobCount as Record<string, unknown> || {};
                const ratings = result.employerRatings as Record<string, unknown> || {};

                return {
                    id: employer.id || 0,
                    shortName: employer.shortName || "",
                    squareLogoUrl: (employer.squareLogoUrl as string) || null,
                    overallRating: (ratings.overallRating as number) || 0,
                    jobCount: (globalJobCount.jobCount as number) || 0,
                    reviewCount: (counts.reviewCount as number) || 0,
                    salaryCount: (counts.salaryCount as number) || 0,
                };
            });

        return {
            companies,
            total_results: data.data.numOfPagesAvailable || companies.length,
            search_query: query,
        };
    } catch (error) {
        console.error("Glassdoor API error:", error);
        return {
            companies: [],
            total_results: 0,
            search_query: query,
        };
    }
}
