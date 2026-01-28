// Sport-specific configuration for different game types

export type SportType = 'football' | 'basketball' | 'soccer' | 'default';
export type PeriodKey = 'p1' | 'p2' | 'p3' | 'p4' | 'final';

export interface SportConfig {
  type: SportType;
  periods: PeriodKey[];
  periodLabels: Record<PeriodKey, string>;
  periodCountForScoring: number; // How many periods to use for scoring calculation
  payoutStructure: Record<PeriodKey, number>; // Percentage of pot for each period
}

const SPORT_CONFIGS: Record<SportType, SportConfig> = {
  football: {
    type: 'football',
    periods: ['p1', 'p2', 'p3', 'p4', 'final'],
    periodLabels: {
      p1: 'Q1',
      p2: 'Q2',
      p3: 'Q3',
      p4: 'OT',
      final: 'Final'
    },
    periodCountForScoring: 4,
    payoutStructure: {
      p1: 0.10,
      p2: 0.20,
      p3: 0.20,
      p4: 0,     // No payout for OT
      final: 0.50
    }
  },
  basketball: {
    type: 'basketball',
    periods: ['p1', 'p2', 'p3', 'p4', 'final'],
    periodLabels: {
      p1: 'Q1',
      p2: 'Q2',
      p3: 'Q3',
      p4: 'Q4',
      final: 'Final'
    },
    periodCountForScoring: 4,
    payoutStructure: {
      p1: 0.10,
      p2: 0.20,
      p3: 0.20,
      p4: 0,     // No payout for Q4 (only final)
      final: 0.50
    }
  },
  soccer: {
    type: 'soccer',
    periods: ['p1', 'p2', 'p3', 'final'],
    periodLabels: {
      p1: '1st Half',
      p2: '2nd Half',
      p3: 'ET/Shootout',
      p4: 'Final', // Not used but kept for type consistency
      final: 'Final'
    },
    periodCountForScoring: 2, // Soccer only has 2 halves
    payoutStructure: {
      p1: 0.25,
      p2: 0.25,
      p3: 0,     // No payout for ET/Shootout
      p4: 0,
      final: 0.50
    }
  },
  default: {
    type: 'default',
    periods: ['p1', 'p2', 'p3', 'p4', 'final'],
    periodLabels: {
      p1: 'Q1',
      p2: 'Q2',
      p3: 'Q3',
      p4: 'Q4',
      final: 'Final'
    },
    periodCountForScoring: 4,
    payoutStructure: {
      p1: 0.10,
      p2: 0.20,
      p3: 0.20,
      p4: 0,
      final: 0.50
    }
  }
};

/**
 * Detect sport type from league identifier
 */
export function detectSportType(league?: string): SportType {
  if (!league) return 'default';
  
  const leagueLower = league.toLowerCase();
  
  if (leagueLower.includes('nfl') || leagueLower.includes('football')) {
    return 'football';
  }
  
  if (leagueLower.includes('nba') || leagueLower.includes('ncaam') || 
      leagueLower.includes('basketball')) {
    return 'basketball';
  }
  
  if (leagueLower.includes('uefa') || leagueLower.includes('soccer') || 
      leagueLower.includes('mls') || leagueLower.includes('premier')) {
    return 'soccer';
  }
  
  return 'default';
}

/**
 * Get sport configuration
 */
export function getSportConfig(sportType: SportType): SportConfig {
  return SPORT_CONFIGS[sportType] || SPORT_CONFIGS.default;
}

/**
 * Get active periods for UI display (excludes unused periods)
 */
export function getDisplayPeriods(sportType: SportType): PeriodKey[] {
  if (sportType === 'soccer') {
    return ['p1', 'p2', 'final']; // Only show halves and final for soccer
  }
  
  return ['p1', 'p2', 'p3', 'final']; // Show Q1, Q2, Q3, Final for others
}

/**
 * Convert old quarter-based keys (q1, q2, q3) to new period keys
 */
export function migrateQuarterToPeriod(quarterKey: string): PeriodKey {
  const mapping: Record<string, PeriodKey> = {
    'q1': 'p1',
    'q2': 'p2',
    'q3': 'p3',
    'q4': 'p4',
    'final': 'final'
  };
  return mapping[quarterKey] || 'final';
}

/**
 * Calculate payout amounts based on sport type
 */
export function calculatePayouts(totalPot: number, sportType: SportType): Record<string, number> {
  const config = getSportConfig(sportType);
  const payouts: Record<string, number> = {};
  
  config.periods.forEach(period => {
    const percentage = config.payoutStructure[period];
    payouts[period] = Math.floor(totalPot * percentage);
  });
  
  return payouts;
}

/**
 * Get period label for display
 */
export function getPeriodLabel(period: PeriodKey, sportType: SportType): string {
  const config = getSportConfig(sportType);
  return config.periodLabels[period] || period.toUpperCase();
}
