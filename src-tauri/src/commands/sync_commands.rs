use tauri::{AppHandle, Manager};
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub fn google_sync_status(app: AppHandle) -> bool {
    let Ok(data_dir) = app.path().app_data_dir() else { return false; };
    let path = data_dir.join("google_token.json");
    path.exists()
}

#[tauri::command]
pub fn outlook_sync_status(app: AppHandle) -> bool {
    let Ok(data_dir) = app.path().app_data_dir() else { return false; };
    let path = data_dir.join("outlook_token.json");
    path.exists()
}

#[tauri::command]
pub async fn connect_google(app: AppHandle) -> Result<(), String> {
    let client_id = option_env!("GOOGLE_CLIENT_ID").unwrap_or("YOUR_CLIENT_ID");
    let redirect_uri = "http://localhost:8080/callback";
    let url = crate::sync::google::get_auth_url(client_id, redirect_uri);
    app.shell().open(url, None).map_err(|e| e.to_string())?;

    let code = crate::oauth_callback::wait_for_code(8080).await?;
    let client_secret = option_env!("GOOGLE_CLIENT_SECRET").unwrap_or("YOUR_SECRET");
    let token = crate::sync::google::exchange_code(client_id, client_secret, &code, redirect_uri).await?;

    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::write(
        data_dir.join("google_token.json"),
        serde_json::to_string(&token).map_err(|e| e.to_string())?,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn connect_outlook(app: AppHandle) -> Result<(), String> {
    let client_id = option_env!("OUTLOOK_CLIENT_ID").unwrap_or("YOUR_CLIENT_ID");
    let client_secret = option_env!("OUTLOOK_CLIENT_SECRET").unwrap_or("YOUR_SECRET");
    let redirect_uri = "http://localhost:8081/callback";
    let url = crate::sync::outlook::get_auth_url(client_id, redirect_uri, "common");
    app.shell().open(url, None).map_err(|e| e.to_string())?;

    let code = crate::oauth_callback::wait_for_code(8081).await?;
    let token = crate::sync::outlook::exchange_code(client_id, client_secret, &code, redirect_uri, "common").await?;

    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::write(
        data_dir.join("outlook_token.json"),
        serde_json::to_string(&token).map_err(|e| e.to_string())?,
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn disconnect_google(app: AppHandle) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = data_dir.join("google_token.json");
    if path.exists() { std::fs::remove_file(path).map_err(|e| e.to_string())?; }
    Ok(())
}

#[tauri::command]
pub fn disconnect_outlook(app: AppHandle) -> Result<(), String> {
    let data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    let path = data_dir.join("outlook_token.json");
    if path.exists() { std::fs::remove_file(path).map_err(|e| e.to_string())?; }
    Ok(())
}
