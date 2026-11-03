//! Strict native HTTPS boundary for the Windows Companion.
//! No session bearer token or website password is exposed to React or persisted on disk.
//! Website D1 owns account identity and every official match/tournament record.
use std::sync::Mutex;
use serde_json::{json, Value};
use tauri::State;

const API_ORIGIN: &str = "https://aventasgaming.com";
const MAX_RESPONSE: usize = 2 * 1024 * 1024;

pub struct ApiState {
    client: reqwest::Client,
    bearer: Mutex<Option<String>>,
}

impl ApiState {
    pub fn new() -> Self {
        let client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(12))
            // Never forward an authenticated request to a redirected host.
            .redirect(reqwest::redirect::Policy::none())
            .build()
            .expect("could not initialize HTTPS client");
        Self { client, bearer: Mutex::new(None) }
    }

    fn token(&self) -> Result<String, String> {
        self.bearer.lock().map_err(|_| "Session unavailable".to_owned())?
            .clone().ok_or_else(|| "Sign in to your Aventas account first.".to_owned())
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
    email: String,
    password: String,
) -> Result<Value, String> {
    let email = email.trim().to_lowercase();
    if !email.contains('@') || email.len() > 254 || password.is_empty() || password.len() > 1024 {
        return Err("Enter a valid email and password.".into());
    }
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
    *state.bearer.lock().map_err(|_| "Session unavailable".to_owned())? = Some(bearer);
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
        if let Ok(mut guard) = state.bearer.lock() {
            if guard.as_deref() == Some(bearer.as_str()) { *guard = None; }
        }
    }
    read_json(response).await
}

#[tauri::command]
pub async fn desktop_account(state: State<'_, ApiState>) -> Result<Value, String> {
    let response = authorized_get(&state, "/api/me").await?;
    response.get("account").cloned().ok_or_else(|| "Account data unavailable.".into())
}

/// Only reviewed, user-scoped endpoints are reachable with the current session.
/// Arbitrary URLs, query strings, and admin operations cannot be supplied by React.
#[tauri::command]
pub async fn desktop_companion_data(
    state: State<'_, ApiState>,
    endpoint: String,
) -> Result<Value, String> {
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
pub async fn desktop_logout(state: State<'_, ApiState>) -> Result<(), String> {
    // Fail closed locally even if website network logout cannot be delivered.
    let token = state.bearer.lock().map_err(|_| "Session unavailable".to_owned())?.take();
    if let Some(bearer) = token {
        let _ = state.client.post(format!("{API_ORIGIN}/api/auth/logout"))
            .bearer_auth(bearer).send().await;
    }
    Ok(())
}

#[tauri::command]
pub async fn fetch_public_tournaments(state: State<'_, ApiState>) -> Result<Value, String> {
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
    slug: String,
) -> Result<Value, String> {
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
    query: String,
) -> Result<Value, String> {
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
    handle: String,
) -> Result<Value, String> {
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
