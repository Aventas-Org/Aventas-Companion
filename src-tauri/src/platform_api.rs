//! Strict native HTTPS boundary for the Windows Companion.
//! Session bearer tokens stay inside Rust memory. Passwords briefly pass from the
//! React login form through native IPC, but are never persisted or logged.
//! Website D1 owns account identity and every official match/tournament record.
use std::sync::Mutex;
use serde_json::{json, Value};
use tauri::State;

const API_ORIGIN: &str = "https://aventasgaming.com";
const MAX_RESPONSE: usize = 2 * 1024 * 1024;

/// Tauri capabilities protect plugin commands, but app-defined commands must
/// explicitly restrict their callers: the overlay is a second webview.
pub fn require_main_window(window: &tauri::WebviewWindow) -> Result<(), String> {
    if window.label() != "main" {
        return Err("This operation is available only in the main Companion window.".into());
    }
    Ok(())
}

#[derive(Default)]
struct AuthStore {
    bearer: Option<String>,
    epoch: u64,
}

impl AuthStore {
    fn next_attempt(&mut self) -> u64 {
        self.epoch = self.epoch.wrapping_add(1);
        self.epoch
    }

    fn finish_login(&mut self, request_epoch: u64, bearer: String) -> bool {
        if self.epoch != request_epoch { return false; }
        self.bearer = Some(bearer);
        true
    }

    fn logout(&mut self) -> Option<String> {
        self.next_attempt();
        self.bearer.take()
    }
}

pub struct ApiState {
    client: reqwest::Client,
    auth: Mutex<AuthStore>,
}

impl ApiState {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(12))
            // Never forward an authenticated request to a redirected host.
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("could not initialize HTTPS client");
        Self { client, auth: Mutex::new(AuthStore::default()) }
    }

    fn token(&self) -> Result<String, String> {
        self.auth.lock().map_err(|_| "Session unavailable".to_owned())?
            .bearer.clone().ok_or_else(|| "Sign in to your Aventas account first.".to_owned())
    }
}

async fn read_json(response: reqwest::Response) -> Result<Value, String> {
    if !response.status().is_success() {
        return Err(if response.status() == reqwest::StatusCode::UNAUTHORIZED {
            "Session expired or credentials were rejected.".into()
        } else if response.status() == reqwest::StatusCode::NOT_FOUND {
            "Requested Aventas resource was not found.".into()
        } else {
            "The Aventas service is temporarily unavailable.".into()
        });
    }
    if response.content_length().is_some_and(|size| size > MAX_RESPONSE as u64) {
        return Err("Website response exceeded the allowed size.".into());
    }
    let bytes = response.bytes().await.map_err(|_| "Could not read the website response.".to_owned())?;
    if bytes.len() > MAX_RESPONSE {
        return Err("Website response exceeded the allowed size.".into());
    }
    serde_json::from_slice(&bytes).map_err(|_| "Website sent an invalid response.".into())
}

#[tauri::command]
pub async fn desktop_login(
    state: State<'_, ApiState>,
    window: tauri::WebviewWindow,
    email: String,
    password: String,
) -> Result<Value, String> {
    require_main_window(&window)?;
    let email = email.trim().to_lowercase();
    if !email.contains('@') || email.len() > 254 || password.is_empty() || password.len() > 1024 {
        return Err("Enter a valid email and password.".into());
    }
    let request_epoch = state.auth.lock()
        .map_err(|_| "Session unavailable".to_owned())?.next_attempt();
    let response = state.client.post(format!("{API_ORIGIN}/api/auth/login"))
        .json(&json!({ "email": email, "password": password }))
        .send().await.map_err(|_| "Could not connect to Aventas.".to_owned())?;
    let mut data = read_json(response).await?;
    let bearer = data.get("token").and_then(Value::as_str)
        .filter(|s| s.len() >= 32 && s.len() <= 512)
        .ok_or_else(|| "Aventas did not return a valid session.".to_owned())?
        .to_owned();
    let account = data.get_mut("account").ok_or_else(|| "Account response missing.".to_owned())?.take();
    if !account.get("id").is_some_and(Value::is_string) || !account.get("name").is_some_and(Value::is_string) {
        return Err("Account response is invalid.".into());
    }
    // Serialize login completion with logout and competing login attempts.
    let mut auth = state.auth.lock().map_err(|_| "Session unavailable".to_owned())?;
    if !auth.finish_login(request_epoch, bearer) {
        return Err("This sign-in attempt was superseded.".into());
    }
    // Only the account summary enters the webview; never send back the bearer.
    Ok(account)
}

async fn authorized_get(state: &ApiState, endpoint: &str) -> Result<Value, String> {
    let bearer = state.token()?;
    let response = state.client.get(format!("{API_ORIGIN}{endpoint}"))
        .bearer_auth(&bearer)
        .send().await.map_err(|_| "Could not connect to Aventas.".to_owned())?;
    let unauthorized = response.status() == reqwest::StatusCode::UNAUTHORIZED;
    if unauthorized {
        // Revoked/expired session is not reused for another request.
        if let Ok(mut auth) = state.auth.lock() {
            if auth.bearer.as_deref() == Some(bearer.as_str()) {
                auth.logout();
            }
        }
    }
    let data = read_json(response).await?;
    // Logout or a second login may have replaced this bearer while the
    // request was pending. Never deliver the previous user's data to React.
    if state.token().ok().as_deref() != Some(bearer.as_str()) {
        return Err("The account changed during this request. Retry.".into());
    }
    Ok(data)
}

#[tauri::command]
pub async fn desktop_account(state: State<'_, ApiState>, window: tauri::WebviewWindow) -> Result<Value, String> {
    require_main_window(&window)?;
    let response = authorized_get(&state, "/api/me").await?;
    response.get("account").cloned().ok_or_else(|| "Account data unavailable.".into())
}

/// Only reviewed, user-scoped endpoints are reachable with the current session.
/// Arbitrary URLs, query strings, and admin operations cannot be supplied by React.
#[tauri::command]
pub async fn desktop_companion_data(
    state: State<'_, ApiState>,
    window: tauri::WebviewWindow,
    endpoint: String,
) -> Result<Value, String> {
    require_main_window(&window)?;
    let path = match endpoint.as_str() {
        "profile" => "/api/companion/profile",
        "dashboard" => "/api/companion/dashboard",
        "matches" => "/api/companion/matches?limit=100",
        "agents" => "/api/companion/agents",
        "maps" => "/api/companion/maps",
        "progress" => "/api/companion/progress",
        "insights" => "/api/companion/insights",
        "analytics" => "/api/companion/analytics",
        _ => return Err("Unsupported Companion endpoint.".into()),
    };
    authorized_get(&state, path).await
}

#[tauri::command]
pub async fn desktop_logout(state: State<'_, ApiState>, window: tauri::WebviewWindow) -> Result<(), String> {
    require_main_window(&window)?;
    // Fail closed locally even if website network logout cannot be delivered.
    let token = state.auth.lock().map_err(|_| "Session unavailable".to_owned())?.logout();
    if let Some(bearer) = token {
        let _ = state.client.post(format!("{API_ORIGIN}/api/auth/logout"))
            .bearer_auth(bearer).send().await;
    }
    Ok(())
}

#[tauri::command]
pub async fn fetch_public_tournaments(state: State<'_, ApiState>, window: tauri::WebviewWindow) -> Result<Value, String> {
    require_main_window(&window)?;
    let response = state.client.get(format!("{API_ORIGIN}/api/tournaments"))
        .send().await.map_err(|_| "Tournament website unavailable.".to_owned())?;
    let data = read_json(response).await?;
    if !data.get("tournaments").is_some_and(Value::is_array) {
        return Err("Invalid tournament listing response.".into());
    }
    Ok(data)
}

#[tauri::command]
pub async fn fetch_public_tournament_detail(
    state: State<'_, ApiState>,
    window: tauri::WebviewWindow,
    slug: String,
) -> Result<Value, String> {
    require_main_window(&window)?;
    let valid = (2..=60).contains(&slug.len())
        && !slug.starts_with('-')
        && slug.bytes().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'-');
    if !valid { return Err("Invalid tournament identifier.".into()); }
    let response = state.client
        .get(format!("{API_ORIGIN}/api/tournaments/{slug}"))
        .send().await.map_err(|_| "Tournament website unavailable.".to_owned())?;
    let data = read_json(response).await?;
    if data.get("tournament").and_then(|v| v.get("slug")).and_then(Value::as_str) != Some(slug.as_str())
        || !data.get("matches").is_some_and(Value::is_array)
        || !data.get("teams").is_some_and(Value::is_array)
    {
        return Err("Invalid official bracket response.".into());
    }
    Ok(data)
}

#[tauri::command]
pub async fn search_public_players(
    state: State<'_, ApiState>,
    window: tauri::WebviewWindow,
    query: String,
) -> Result<Value, String> {
    require_main_window(&window)?;
    let query = query.trim();
    if query.chars().count() < 2 || query.chars().count() > 40 ||
       query.chars().any(|c| c.is_control()) {
        return Err("Search must contain 2–40 visible characters.".into());
    }
    let response = state.client.get(format!("{API_ORIGIN}/api/companion/players"))
        .query(&[("q", query)])
        .send().await.map_err(|_| "Player directory unavailable.".to_owned())?;
    let data = read_json(response).await?;
    if !data.get("players").is_some_and(Value::is_array) {
        return Err("Invalid player search response.".into());
    }
    Ok(data)
}

#[tauri::command]
pub async fn fetch_public_player(
    state: State<'_, ApiState>,
    window: tauri::WebviewWindow,
    handle: String,
) -> Result<Value, String> {
    require_main_window(&window)?;
    if handle.len() != 18 || !handle.bytes().all(|b| b.is_ascii_hexdigit() && !b.is_ascii_uppercase()) {
        return Err("Invalid public player handle.".into());
    }
    let response = state.client.get(format!("{API_ORIGIN}/api/companion/players/{handle}"))
        .send().await.map_err(|_| "Player profile unavailable.".to_owned())?;
    let data = read_json(response).await?;
    if !data.get("player").is_some_and(Value::is_object) {
        return Err("Invalid public player profile response.".into());
    }
    Ok(data)
}

#[cfg(test)]
mod tests {
    // Static allowlists are deliberately narrower than the URL/path syntax
    // accepted by the generic HTTP client. These tests protect the surface.
    #[test]
    fn platform_origin_is_https() {
        assert_eq!(super::API_ORIGIN, "https://aventasgaming.com");
    }

    #[test]
    fn response_size_is_bounded() {
        assert!(super::MAX_RESPONSE <= 2 * 1024 * 1024);
    }

    #[test]
    fn login_after_logout_cannot_restore_an_old_session() {
        let mut store = super::AuthStore::default();
        let old_attempt = store.next_attempt();
        assert!(store.logout().is_none());
        assert!(!store.finish_login(old_attempt, "old-token".to_owned()));
        assert!(store.bearer.is_none());
    }

    #[test]
    fn a_newer_login_suppresses_an_older_in_flight_request() {
        let mut store = super::AuthStore::default();
        let first = store.next_attempt();
        let second = store.next_attempt();
        assert!(!store.finish_login(first, "A".to_owned()));
        assert!(store.finish_login(second, "B".to_owned()));
        assert_eq!(store.logout().as_deref(), Some("B"));
        assert!(store.bearer.is_none());
    }
}


/// Only a validated website tournament link may be opened from the desktop.
#[tauri::command]
pub fn open_official_tournament(
    window: tauri::WebviewWindow,
    app: tauri::AppHandle,
    slug: String,
) -> Result<(), String> {
    use tauri_plugin_opener::OpenerExt;
    require_main_window(&window)?;
    let valid = (2..=60).contains(&slug.len())
        && !slug.starts_with('-')
        && slug.bytes().all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'-');
    if !valid { return Err("Invalid tournament identifier.".into()); }
    let url = format!("{API_ORIGIN}/tournaments/{slug}");
    app.opener().open_url(url, None::<&str>)
        .map_err(|_| "Unable to open the Aventas website in your browser.".to_string())
}


/// Only the signed-in account may opt its own public directory profile in/out.
/// The website resolves the user identity from the bearer token. The desktop
/// cannot choose another member ID and never receives privileged tokens.
#[tauri::command]
pub async fn desktop_set_profile_visibility(
    state: State<'_, ApiState>,
    window: tauri::WebviewWindow,
    is_public: bool,
) -> Result<bool, String> {
    require_main_window(&window)?;
    let bearer = state.token()?;
    let response = state.client.post(format!("{API_ORIGIN}/api/companion/visibility"))
        .bearer_auth(&bearer)
        .json(&json!({ "isPublic": is_public }))
        .send().await.map_err(|_| "Unable to update website privacy settings.".to_string())?;
    let data = read_json(response).await?;
    if state.token().ok().as_deref() != Some(bearer.as_str()) {
        return Err("Account changed during the privacy update.".into());
    }
    let confirmed = data.get("isPublic").and_then(Value::as_bool)
        .ok_or_else(|| "The website did not confirm the privacy update.".to_string())?;
    if confirmed != is_public {
        return Err("The website returned a different visibility state.".into());
    }
    Ok(confirmed)
}
