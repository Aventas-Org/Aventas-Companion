import { useMemo } from 'react';
import { buildAnalysis, type AnalysisBundle } from '../services/analysisView';

/**
 * Memoises the full analysis bundle. The demo dataset is deterministic, so the
 * bundle only depends on the (fixed) session and is computed once per mount.
 */
export function useAnalysis(): AnalysisBundle {
  return useMemo(() => buildAnalysis(), []);
}
