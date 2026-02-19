const CANONICAL = new Set(['info', 'warning', 'critical']);

const LEGACY_TO_CANONICAL = {
  low: 'info',
  info: 'info',
  medium: 'warning',
  high: 'warning',
  warning: 'warning',
  critical: 'critical'
};

const CANONICAL_TO_LEGACY = {
  info: 'low',
  warning: 'medium',
  critical: 'critical'
};

export const toCanonicalSeverity = (value, fallback = 'warning') => {
  const normalized = String(value || '').trim().toLowerCase();
  if (CANONICAL.has(normalized)) return normalized;
  return LEGACY_TO_CANONICAL[normalized] || fallback;
};

export const toLegacySeverity = (value, fallback = 'medium') => {
  const canonical = toCanonicalSeverity(value, 'warning');
  return CANONICAL_TO_LEGACY[canonical] || fallback;
};

export const severityFromRiskScore = (score) => {
  const numeric = Number(score);
  if (!Number.isFinite(numeric)) return 'warning';
  if (numeric >= 75) return 'critical';
  if (numeric >= 45) return 'warning';
  return 'info';
};

export const clampConfidence = (value, fallback = 60) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(0, Math.min(100, Math.round(numeric)));
};
