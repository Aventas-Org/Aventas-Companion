import { invoke } from '@tauri-apps/api/core';

/** Status of the VALORANT game process. */
export type ValorantProcessStatus = 'running' | 'not_running' | 'unavailable';

/** Response from the backend process check. */
export interface ValorantProcessResponse {
  status: ValorantProcessStatus;
  processName: string | null;
}

/** Checks whether the VALORANT game process is running. */
export async function checkValorantProcess(): Promise<ValorantProcessResponse> {
  return invoke<ValorantProcessResponse>('check_valorant_process');
}
