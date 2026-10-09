use serde::{Deserialize, Serialize};
use windows::Win32::System::Diagnostics::ToolHelp::{
    CreateToolhelp32Snapshot, Process32FirstW, Process32NextW, PROCESSENTRY32W, TH32CS_SNAPPROCESS,
};

/// Status of the VALORANT game process.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ValorantProcessStatus {
    /// The VALORANT game process is running.
    Running,
    /// The VALORANT game process is not running.
    NotRunning,
    /// Process detection is unavailable or failed.
    Unavailable,
}

/// Response returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ValorantProcessResponse {
    pub status: ValorantProcessStatus,
    /// The executable name if running, otherwise None.
    pub process_name: Option<String>,
}

/// Checks whether the VALORANT game process is running on Windows.
///
/// Uses the ToolHelp32 snapshot API (CreateToolhelp32Snapshot + Process32FirstW/NextW)
/// to enumerate processes and match against the known VALORANT game executable name.
/// This is a read-only enumeration; it does not open, inject into, or modify any process.
pub fn check_valorant_process() -> ValorantProcessResponse {
    const VALORANT_EXE: &str = "VALORANT.exe";

    // Snapshot all processes.
    let snapshot = unsafe { CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0) };

    let snapshot = match snapshot {
        Ok(h) => h,
        Err(_) => {
            return ValorantProcessResponse {
                status: ValorantProcessStatus::Unavailable,
                process_name: None,
            };
        }
    };

    // Prepare the process entry structure.
    let mut entry = PROCESSENTRY32W {
        dwSize: std::mem::size_of::<PROCESSENTRY32W>() as u32,
        ..Default::default()
    };

    // Get the first process.
    let mut has_process = unsafe { Process32FirstW(snapshot, &mut entry) }.is_ok();

    let mut found = false;
    let mut found_name = None;

    while has_process {
        // Convert the wide-char executable name to a Rust String.
        let exe_name = wide_to_string(&entry.szExeFile);

        // Case-insensitive match against VALORANT.exe.
        if exe_name.eq_ignore_ascii_case(VALORANT_EXE) {
            found = true;
            found_name = Some(exe_name);
            break;
        }

        // Move to the next process.
        has_process = unsafe { Process32NextW(snapshot, &mut entry) }.is_ok();
    }

    // Close the snapshot handle.
    unsafe {
        let _ = windows::Win32::Foundation::CloseHandle(snapshot);
    };

    ValorantProcessResponse {
        status: if found {
            ValorantProcessStatus::Running
        } else {
            ValorantProcessStatus::NotRunning
        },
        process_name: found_name,
    }
}

/// Converts a fixed-size wide-char array (from PROCESSENTRY32W::szExeFile)
/// to a Rust String, stopping at the first null terminator.
fn wide_to_string(wide: &[u16; 260]) -> String {
    let len = wide.iter().position(|&c| c == 0).unwrap_or(wide.len());
    String::from_utf16_lossy(&wide[..len])
}
