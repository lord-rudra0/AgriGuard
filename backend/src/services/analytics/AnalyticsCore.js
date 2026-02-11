
// Shared mathematical utilities for Analytics Engine
// Implements Improvements #3 (Smoothing), #7 (Confidence), #8 (MAD), #11 (Data Sufficiency)

/**
 * Calculates Simple Moving Average to reduce noise (Improvement #3)
 * @param {Array} data - Array of numbers
 * @param {number} window - Window size
 */
export const calculateMovingAverage = (data, window = 3) => {
    if (!data || data.length < window) return data;
    const result = [];
    for (let i = 0; i < data.length - window + 1; i++) {
        const chunk = data.slice(i, i + window);
        const avg = chunk.reduce((a, b) => a + b, 0) / window;
        result.push(avg);
    }
    return result;
};

/**
 * Normalizes a value to a 0-100 scale based on a safe range (Improvement #2)
 * Returns values > 100 if extreme deviation, can be clamped.
 */
export const normalizeRisk = (value, ideal, safeMin, safeMax) => {
    const safeWidth = safeMax - safeMin;
    if (safeWidth === 0) return 0;

    // Distance from ideal
    const dist = Math.abs(value - ideal);
    const safeDist = safeWidth / 2; // Distance from ideal to edge of safe

    // If within safe range roughly, risk is low.
    // We want 0 risk at ideal, 100 risk at extremely bad.
    // Let's say risk is 0 at ideal, 50 at boundary, 100 at 2x boundary.

    return (dist / safeDist) * 50;
};

/**
 * Calculates Confidence Score based on data density and variance (Improvement #7)
 */
export const calculateConfidence = (dataPoints, expectedPoints, variance) => {
    if (!expectedPoints) return 0;

    const densityScore = Math.min(100, (dataPoints / expectedPoints) * 100);

    // Lower variance is better for confidence in some contexts (sensor stability)
    // but high variance might be real.
    // For now, we focus on Data DENSITY as the primary driver of confidence.
    // If we have 5 points when we expect 24, confidence is low.

    return Math.round(densityScore);
};

/**
 * Median Absolute Deviation (MAD) for robust outlier detection (Improvement #8)
 */
export const calculateMAD = (data) => {
    if (!data || data.length === 0) return 0;
    const median = (arr) => {
        const mid = Math.floor(arr.length / 2);
        const nums = [...arr].sort((a, b) => a - b);
        return arr.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
    };

    const med = median(data);
    const devs = data.map(v => Math.abs(v - med));
    return median(devs);
};

/**
 * Linear Regression Slope (Improvement #3 - used with aggregation)
 */
export const calculateSlope = (data) => {
    if (data.length < 2) return 0;
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    for (let i = 0; i < n; i++) {
        const x = i;
        const y = data[i];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumXX += x * x;
    }
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
};

/**
 * Calculates R-Squared for linear regression data (Improvement #5)
 */
export const calculateRSquared = (data) => {
    if (data.length < 3) return 0;
    const n = data.length;
    const yMean = data.reduce((a, b) => a + b, 0) / n;

    // Total Sum of Squares
    const tss = data.reduce((a, b) => a + Math.pow(b - yMean, 2), 0);
    if (tss === 0) return 0;

    // Sum of Squares of Residuals
    const slope = calculateSlope(data);
    const intercept = yMean - slope * ((n - 1) / 2);

    let ssr = 0;
    for (let i = 0; i < n; i++) {
        const yPred = slope * i + intercept;
        ssr += Math.pow(data[i] - yPred, 2);
    }

    return Math.max(0, 1 - (ssr / tss));
};
