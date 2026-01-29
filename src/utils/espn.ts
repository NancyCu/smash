/**
 * ESPN Team Fetcher Utility
 * Fetches official team names, logos, and colors from ESPN's public APIs
 */

export interface EspnTeam {
  name: string;
  displayName: string;
  abbreviation: string;
  logo: string;
  color: string;
  league: string;
}

interface EspnApiTeam {
  team: {
    id: string;
    displayName: string;
    name: string;
    abbreviation: string;
    logos?: { href: string }[];
    color?: string;
  };
}

// Cache for fetched teams (persists during session)
let teamsCache: EspnTeam[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const ESPN_ENDPOINTS = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
  ncaaf: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams?limit=200',
};

/**
 * Fetches all teams from ESPN APIs (NFL, NBA, NCAA Football)
 */
async function fetchAllTeams(): Promise<EspnTeam[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (teamsCache && (now - lastFetchTime) < CACHE_DURATION) {
    return teamsCache;
  }

  try {
    const [nflRes, nbaRes, ncaafRes] = await Promise.all([
      fetch(ESPN_ENDPOINTS.nfl),
      fetch(ESPN_ENDPOINTS.nba),
      fetch(ESPN_ENDPOINTS.ncaaf),
    ]);

    const [nflData, nbaData, ncaafData] = await Promise.all([
      nflRes.json(),
      nbaRes.json(),
      ncaafRes.json(),
    ]);

    const parseTeams = (data: any, league: string): EspnTeam[] => {
      if (!data?.sports?.[0]?.leagues?.[0]?.teams) return [];
      
      return data.sports[0].leagues[0].teams.map((t: EspnApiTeam) => ({
        name: t.team.displayName,
        displayName: t.team.displayName,
        abbreviation: t.team.abbreviation,
        logo: t.team.logos?.[0]?.href || '',
        color: t.team.color ? `#${t.team.color}` : '#333333',
        league,
      }));
    };

    const allTeams = [
      ...parseTeams(nflData, 'NFL'),
      ...parseTeams(nbaData, 'NBA'),
      ...parseTeams(ncaafData, 'NCAAF'),
    ];

    teamsCache = allTeams;
    lastFetchTime = now;
    
    return allTeams;
  } catch (error) {
    console.error('Failed to fetch ESPN teams:', error);
    return teamsCache || []; // Return stale cache if available
  }
}

/**
 * Search teams by query string
 * Matches against team name, display name, and abbreviation
 */
export async function searchTeams(query: string): Promise<EspnTeam[]> {
  if (!query || query.length < 2) return [];

  const allTeams = await fetchAllTeams();
  const lowerQuery = query.toLowerCase();

  return allTeams
    .filter(team => 
      team.name.toLowerCase().includes(lowerQuery) ||
      team.displayName.toLowerCase().includes(lowerQuery) ||
      team.abbreviation.toLowerCase().includes(lowerQuery)
    )
    .slice(0, 15); // Limit results for performance
}

/**
 * Get all teams (for pre-loading dropdown)
 */
export async function getAllTeams(): Promise<EspnTeam[]> {
  return fetchAllTeams();
}

/**
 * Clear the teams cache (useful for testing or force refresh)
 */
export function clearTeamsCache(): void {
  teamsCache = null;
  lastFetchTime = 0;
}
