/**
 * Calculates NPV (Net Present Value)
 * @param rate Discount rate (as a decimal, e.g., 0.1 for 10%)
 * @param cashFlows Array of cash flows [t0, t1, t2, ...] where t0 is initial investment
 */
export function calculateNPV(rate: number, cashFlows: number[]): number {
  if (rate <= -1) return NaN;
  
  return cashFlows.reduce((acc, cf, t) => {
    return acc + cf / Math.pow(1 + rate, t);
  }, 0);
}

/**
 * Calculates NPV for Perpetuity
 * @param rate Discount rate
 * @param initialInvestment Initial investment (absolute value usually, but we assume it's the cost)
 * @param annualCashFlow Constant annual cash flow
 */
export function calculatePerpetuityNPV(rate: number, initialInvestment: number, annualCashFlow: number): number | null {
  if (rate <= 0) return null; // Undefined or infinite at 0%
  // Formula: (Annual CF / rate) - Initial Cost
  return (annualCashFlow / rate) - initialInvestment;
}

/**
 * Calculates IRR (Internal Rate of Return) using Bisection method
 * Much more stable than Newton-Raphson for typical financial series.
 * @param cashFlows Array of cash flows
 */
export function calculateIRR(cashFlows: number[]): number | null {
  // 1. Validation: Must have at least one positive and one negative cash flow
  const hasPositive = cashFlows.some(cf => cf > 0);
  const hasNegative = cashFlows.some(cf => cf < 0);
  
  if (!hasPositive || !hasNegative) return null;

  // 2. Bisection method
  let low = -0.999; // Minimum rate (cannot be -100%)
  let high = 10.0;   // Maximum rate (1000%) - usually enough
  const precision = 0.0000001;
  const maxIterations = 100;

  let npvLow = calculateNPV(low, cashFlows);
  let npvHigh = calculateNPV(high, cashFlows);

  // If both have same sign, IRR is outside our range [-99.9%, 1000%]
  if (npvLow * npvHigh > 0) {
    // If NPV is still positive at 1000%, check if it's potentially higher
    // but for most projects this means it's extremely high or doesn't exist
    return null;
  }

  for (let i = 0; i < maxIterations; i++) {
    const mid = (low + high) / 2;
    const npvMid = calculateNPV(mid, cashFlows);

    if (Math.abs(npvMid) < precision) return mid;

    if (npvLow * npvMid < 0) {
      high = mid;
      npvHigh = npvMid;
    } else {
      low = mid;
      npvLow = npvMid;
    }

    if (high - low < precision) break;
  }

  return (low + high) / 2;
}
