/**
 * differentialPrivacy.ts — Differential Privacy Analytics Layer
 * Design: Zero-Knowledge Glass — Dark Space Glassmorphism
 *
 * Implements the Laplace Mechanism for differential privacy:
 * - Adds calibrated random noise to statistics before reporting
 * - Noise magnitude is proportional to sensitivity / epsilon
 * - Epsilon (ε) controls the privacy-utility tradeoff:
 *   - Lower ε = more privacy, less accuracy
 *   - Higher ε = less privacy, more accuracy
 *
 * Use cases in this MVP:
 * - Page view counts (how many users visited a page)
 * - Feature usage statistics
 * - Aggregate behavioral metrics
 *
 * What this prevents:
 * - An adversary with access to the statistics CANNOT determine
 *   whether any specific user was in the dataset
 * - Individual user behavior is indistinguishable from noise
 */

export interface DPConfig {
  epsilon: number;      // Privacy budget (0.1 = very private, 1.0 = moderate, 10.0 = low privacy)
  sensitivity: number;  // Maximum change one user can cause (usually 1 for counts)
  mechanism: 'laplace' | 'gaussian';
}

export interface DPResult {
  trueValue: number;
  noisyValue: number;
  noise: number;
  epsilon: number;
  sensitivity: number;
  mechanism: string;
  privacyLevel: 'high' | 'medium' | 'low';
}

export interface PageViewStats {
  page: string;
  trueCount: number;
  dpCount: number;
  epsilon: number;
}

/**
 * Generate Laplace-distributed random noise.
 * Laplace(0, b) where b = sensitivity / epsilon
 *
 * Uses the inverse CDF method:
 * X = -b * sign(U) * ln(1 - 2|U|) where U ~ Uniform(-0.5, 0.5)
 */
function laplaceSample(scale: number): number {
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Generate Gaussian-distributed random noise using Box-Muller transform.
 * Used for (ε, δ)-differential privacy.
 */
function gaussianSample(stddev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return z * stddev;
}

/**
 * Apply differential privacy noise to a single numeric value.
 */
export function applyDP(value: number, config: DPConfig): DPResult {
  const { epsilon, sensitivity, mechanism } = config;
  const scale = sensitivity / epsilon;

  let noise: number;
  if (mechanism === 'laplace') {
    noise = laplaceSample(scale);
  } else {
    // Gaussian: stddev = sqrt(2 * ln(1.25/delta)) * sensitivity / epsilon
    // Using delta = 1e-5 for (ε, 1e-5)-DP
    const delta = 1e-5;
    const stddev = Math.sqrt(2 * Math.log(1.25 / delta)) * sensitivity / epsilon;
    noise = gaussianSample(stddev);
  }

  const noisyValue = Math.max(0, Math.round(value + noise));

  const privacyLevel: 'high' | 'medium' | 'low' =
    epsilon <= 0.5 ? 'high' :
    epsilon <= 2.0 ? 'medium' : 'low';

  return {
    trueValue: value,
    noisyValue,
    noise,
    epsilon,
    sensitivity,
    mechanism,
    privacyLevel,
  };
}

/**
 * Apply DP to an array of page view statistics.
 * Each page count gets independent noise.
 */
export function applyDPToPageViews(
  pageViews: Record<string, number>,
  epsilon = 1.0
): PageViewStats[] {
  return Object.entries(pageViews).map(([page, count]) => {
    const result = applyDP(count, { epsilon, sensitivity: 1, mechanism: 'laplace' });
    return {
      page,
      trueCount: count,
      dpCount: result.noisyValue,
      epsilon,
    };
  });
}

/**
 * Simulate page view data with differential privacy applied.
 * Returns both the "true" values and the DP-noised values for comparison.
 */
export function simulateDPAnalytics(epsilon = 1.0): {
  raw: Record<string, number>;
  dp: PageViewStats[];
  totalBudgetUsed: number;
} {
  // Simulated true page view counts
  const raw: Record<string, number> = {
    '/': 1247,
    '/wallet-auth': 834,
    '/zkp-proof': 612,
    '/e2e-encrypt': 489,
    '/ipfs-storage': 371,
    '/dp-analytics': 298,
  };

  const dp = applyDPToPageViews(raw, epsilon);
  const totalBudgetUsed = epsilon * Object.keys(raw).length; // Sequential composition

  return { raw, dp, totalBudgetUsed };
}

/**
 * Calculate the expected noise magnitude for given DP parameters.
 */
export function expectedNoiseMagnitude(epsilon: number, sensitivity = 1): {
  expectedAbsNoise: number;
  variance: number;
  stddev: number;
} {
  const scale = sensitivity / epsilon;
  // Laplace distribution: E[|X|] = scale, Var[X] = 2*scale^2
  return {
    expectedAbsNoise: scale,
    variance: 2 * scale * scale,
    stddev: Math.sqrt(2) * scale,
  };
}

/**
 * Privacy budget tracker — monitors total epsilon spent.
 * In a real system, this would be persisted and enforced server-side.
 */
export class PrivacyBudgetTracker {
  private totalBudget: number;
  private usedBudget: number;
  private queries: Array<{ name: string; epsilon: number; timestamp: number }>;

  constructor(totalBudget = 10.0) {
    this.totalBudget = totalBudget;
    this.usedBudget = 0;
    this.queries = [];
  }

  canQuery(epsilon: number): boolean {
    return this.usedBudget + epsilon <= this.totalBudget;
  }

  recordQuery(name: string, epsilon: number): boolean {
    if (!this.canQuery(epsilon)) return false;
    this.usedBudget += epsilon;
    this.queries.push({ name, epsilon, timestamp: Date.now() });
    return true;
  }

  getStatus() {
    return {
      totalBudget: this.totalBudget,
      usedBudget: this.usedBudget,
      remainingBudget: this.totalBudget - this.usedBudget,
      percentUsed: (this.usedBudget / this.totalBudget) * 100,
      queryCount: this.queries.length,
      queries: this.queries,
    };
  }

  reset() {
    this.usedBudget = 0;
    this.queries = [];
  }
}
