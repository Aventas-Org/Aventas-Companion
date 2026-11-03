//! Read-only, device-local Windows system metrics; no game process memory access.
use serde::Serialize;
use std::sync::Mutex;
use tauri::State;
use windows::Win32::Foundation::FILETIME;
use windows::Win32::System::SystemInformation::{GlobalMemoryStatusEx, MEMORYSTATUSEX};
use windows::Win32::System::Threading::GetSystemTimes;

#[derive(Clone, Copy)]
struct CpuTimes {
    idle: u64,
    kernel: u64,
    user: u64,
}

#[derive(Default)]
pub struct MetricSamples {
    previous: Mutex<Option<CpuTimes>>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemMetrics {
    pub cpu_percent: Option<f64>,
    pub memory_percent: u32,
    pub total_memory_bytes: u64,
    pub used_memory_bytes: u64,
}

fn file_time(value: FILETIME) -> u64 {
    (u64::from(value.dwHighDateTime) << 32) | u64::from(value.dwLowDateTime)
}

fn cpu_usage(prev: CpuTimes, next: CpuTimes) -> Option<f64> {
    let total = next.kernel.saturating_sub(prev.kernel)
        .saturating_add(next.user.saturating_sub(prev.user));
    if total == 0 { return None; }
    let idle = next.idle.saturating_sub(prev.idle).min(total);
    Some((((total - idle) as f64 / total as f64) * 100.0).clamp(0.0, 100.0))
}

fn system_times() -> Result<CpuTimes, String> {
    let mut idle = FILETIME::default();
    let mut kernel = FILETIME::default();
    let mut user = FILETIME::default();
    unsafe {
        GetSystemTimes(Some(&mut idle), Some(&mut kernel), Some(&mut user))
            .map_err(|_| "System CPU telemetry unavailable.".to_string())?;
    }
    Ok(CpuTimes {
        idle: file_time(idle), kernel: file_time(kernel), user: file_time(user),
    })
}

#[tauri::command]
pub fn read_system_metrics(
    window: tauri::WebviewWindow,
    samples: State<'_, MetricSamples>,
) -> Result<SystemMetrics, String> {
    crate::platform_api::require_main_window(&window)?;

    let mut memory = MEMORYSTATUSEX::default();
    memory.dwLength = std::mem::size_of::<MEMORYSTATUSEX>() as u32;
    unsafe {
        GlobalMemoryStatusEx(&mut memory)
            .map_err(|_| "Physical memory telemetry unavailable.".to_string())?;
    }

    let current = system_times()?;
    let mut previous = samples.previous.lock()
        .map_err(|_| "CPU sampler unavailable.".to_string())?;
    let usage = previous.and_then(|p| cpu_usage(p, current));
    *previous = Some(current);

    Ok(SystemMetrics {
        cpu_percent: usage,
        memory_percent: memory.dwMemoryLoad,
        total_memory_bytes: memory.ullTotalPhys,
        used_memory_bytes: memory.ullTotalPhys.saturating_sub(memory.ullAvailPhys),
    })
}

#[cfg(test)]
mod tests {
    use super::{cpu_usage, CpuTimes};

    #[test]
    fn cpu_percent_uses_kernel_including_idle() {
        let a = CpuTimes { idle: 100, kernel: 500, user: 100 };
        let b = CpuTimes { idle: 150, kernel: 700, user: 200 };
        // delta kernel 200 + user 100, idle 50 -> 250 / 300 busy
        let value = cpu_usage(a, b).unwrap();
        assert!((value - 83.333333).abs() < 0.01);
    }

    #[test]
    fn cpu_counter_reset_or_no_delta_does_not_fabricate_usage() {
        let a = CpuTimes { idle: 100, kernel: 500, user: 100 };
        let b = CpuTimes { idle: 100, kernel: 500, user: 100 };
        assert!(cpu_usage(a, b).is_none());
        let c = CpuTimes { idle: 5000, kernel: 600, user: 110 };
        assert_eq!(cpu_usage(a, c), Some(0.0));
    }
}
