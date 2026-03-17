use tauri::{AppHandle, Manager};
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub fn google_sync_status(app: AppHandle) -> bool {
    let path = app.path().app_data_dir().unwrap().join("google_token.json");
    path.exists()
}

#[tauri::command]
pub fn outlook_sync_status(app: AppHandle) -> bool {
    let path = app.path().app_data_dir().unwrap().join("outlook_token.json");
    path.exists()
}

#[tauri::command]
pub async fn connect_google(app: AppHandle) -> Result<(), String> {
    let client_id = option_env!("GOOGLE_CLIENT_ID").unwrap_or("YOUR_CLIENT_ID");
    let url = crate::sync::google::get_auth_url(client_id, "http://localhost:8080/callback");
    app.shell().open(url, None).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn connect_outlook(app: AppHandle) -> Result<(), String> {
    let client_id = option_env!("OUTLOOK_CLIENT_ID").unwrap_or("YOUR_CLIENT_ID");
    let url = crate::sync::outlook::get_auth_url(client_id, "http://localhost:8081/callback", "common");
    app.shell().open(url, None).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn disconnect_google(app: AppHandle) -> Result<(), String> {
    let path = app.path().app_data_dir().unwrap().join("google_token.json");
    if path.exists() { std::fs::remove_file(path).map_err(|e| e.to_string())?; }
    Ok(())
}

#[tauri::command]
pub fn disconnect_outlook(app: AppHandle) -> Result<(), String> {
    let path = app.path().app_data_dir().unwrap().join("outlook_token.json");
    if path.exists() { std::fs::remove_file(path).map_err(|e| e.to_string())?; }
    Ok(())
}
