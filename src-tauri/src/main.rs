// Prevents an extra console window on Windows in release builds.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod overlay;
mod process;
mod platform_api;
mod system_metrics;

use overlay::{set_overlay_click_through, set_overlay_visible};
use process::ValorantProcessResponse;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {name}! Welcome to Aventas Desktop Companion.")
}

/// Checks whether the VALORANT game process is running.
#[tauri::command]
fn check_valorant_process(window: tauri::WebviewWindow) -> Result<ValorantProcessResponse, String> {
    platform_api::require_main_window(&window)?;
    Ok(process::check_valorant_process())
}

fn main() {
    tauri::Builder::default()
        .manage(platform_api::ApiState::new())
        .manage(system_metrics::MetricSamples::default())
        .invoke_handler(tauri::generate_handler![
            greet,
            platform_api::fetch_public_tournaments,
            platform_api::fetch_public_tournament_detail,
            platform_api::open_official_tournament,
            platform_api::desktop_login,
            platform_api::desktop_account,
            platform_api::desktop_companion_data,
            platform_api::desktop_logout,
            platform_api::desktop_set_profile_visibility,
            platform_api::search_public_players,
            platform_api::fetch_public_player,
            check_valorant_process,
            system_metrics::read_system_metrics,
            set_overlay_visible,
            set_overlay_click_through
        ])
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
