// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod overlay;
mod process;

use overlay::{set_overlay_click_through, set_overlay_visible};
use process::ValorantProcessResponse;

/// Public website tournament feed. Native HTTPS avoids WebView CORS
/// exceptions and never accesses private account data or credentials.
#[tauri::command]
async fn fetch_public_tournaments() -> Result<serde_json::Value, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|_| "Tournament connection unavailable".to_string())?;
    let response = client
        .get("https://aventasgaming.com/api/tournaments")
        .send()
        .await
        .map_err(|_| "Tournament website unavailable".to_string())?;
    if !response.status().is_success() {
        return Err("Tournament website returned an error".to_string());
    }
    let payload = response.json::<serde_json::Value>()
        .await.map_err(|_| "Invalid tournament response".to_string())?;
    if !payload.get("tournaments").is_some_and(serde_json::Value::is_array) {
        return Err("Unexpected tournament response".to_string());
    }
    Ok(payload)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! Welcome to Aventas Desktop Companion.")
}

/// Checks whether the VALORANT game process is running.
#[tauri::command]
fn check_valorant_process() -> ValorantProcessResponse {
    process::check_valorant_process()
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            greet,
            fetch_public_tournaments,
            check_valorant_process,
            set_overlay_visible,
            set_overlay_click_through
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
