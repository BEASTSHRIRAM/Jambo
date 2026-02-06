/**
 * JSearch Jobs Service
 * Uses RapidAPI's JSearch API to find job listings
 */

export interface Job {
    job_id: string;
    job_title: string;
    employer_name: string;
    employer_logo: string | null;
    employer_website: string | null;
    job_location: string;
    job_city: string;
    job_state: string;
    job_country: string;
    job_employment_type: string;
    job_is_remote: boolean;
    job_posted_human_readable: string;
    job_description: string;
    job_apply_link: string;
    job_min_salary: number | null;
    job_max_salary: number | null;
    job_salary_currency: string | null;
    job_salary_period: string | null;
    job_highlights: {
        qualifications?: string[];
        responsibilities?: string[];
        benefits?: string[];
    } | null;
}

export interface JobSearchResult {
    jobs: Job[];
    total_results: number;
    search_query: string;
}

const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || "30e1331ea5msh5f4be0f874d73eap1c2fd5jsn9a59b62b5953";
const RAPIDAPI_HOST = "jsearch.p.rapidapi.com";

/**
 * Search for jobs using JSearch API
 */
export async function searchJobs(params: {
    query: string;
    location?: string;
    remote_only?: boolean;
    employment_type?: "FULLTIME" | "PARTTIME" | "CONTRACTOR" | "INTERN";
    date_posted?: "all" | "today" | "3days" | "week" | "month";
}): Promise<JobSearchResult> {
    const { query, location, remote_only, employment_type, date_posted = "all" } = params;

    // Build search query
    let searchQuery = query;
    if (location) {
        searchQuery += ` in ${location}`;
    }

    // Build URL with parameters
    const url = new URL("https://jsearch.p.rapidapi.com/search");
    url.searchParams.set("query", searchQuery);
    url.searchParams.set("page", "1");
    url.searchParams.set("num_pages", "1");
    url.searchParams.set("date_posted", date_posted);

    if (remote_only) {
        url.searchParams.set("remote_jobs_only", "true");
    }
    if (employment_type) {
        url.searchParams.set("employment_types", employment_type);
    }

    try {
        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "x-rapidapi-host": RAPIDAPI_HOST,
                "x-rapidapi-key": RAPIDAPI_KEY,
            },
        });

        if (!response.ok) {
            console.error("JSearch API error:", response.status);
            return {
                jobs: [],
                total_results: 0,
                search_query: searchQuery,
            };
        }

        const data = await response.json();

        if (data.status !== "OK" || !data.data) {
            return {
                jobs: [],
                total_results: 0,
                search_query: searchQuery,
            };
        }

        // Transform API response to our Job interface
        const jobs: Job[] = (data.data || []).slice(0, 10).map((job: Record<string, unknown>) => ({
            job_id: job.job_id || "",
            job_title: job.job_title || "",
            employer_name: job.employer_name || "",
            employer_logo: job.employer_logo || null,
            employer_website: job.employer_website || null,
            job_location: job.job_location || "",
            job_city: job.job_city || "",
            job_state: job.job_state || "",
            job_country: job.job_country || "",
            job_employment_type: job.job_employment_type || "FULLTIME",
            job_is_remote: job.job_is_remote || false,
            job_posted_human_readable: job.job_posted_human_readable || "",
            job_description: typeof job.job_description === "string"
                ? job.job_description.slice(0, 500) + (job.job_description.length > 500 ? "..." : "")
                : "",
            job_apply_link: job.job_apply_link || "",
            job_min_salary: job.job_min_salary as number | null,
            job_max_salary: job.job_max_salary as number | null,
            job_salary_currency: job.job_salary_currency as string | null,
            job_salary_period: job.job_salary_period as string | null,
            job_highlights: job.job_highlights as Job["job_highlights"] || null,
        }));

        return {
            jobs,
            total_results: jobs.length,
            search_query: searchQuery,
        };
    } catch (error) {
        console.error("JSearch API error:", error);
        return {
            jobs: [],
            total_results: 0,
            search_query: searchQuery,
        };
    }
}
