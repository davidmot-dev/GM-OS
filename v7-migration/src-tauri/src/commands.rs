use tauri::{AppHandle, Manager};
use std::fs;
use std::path::Path;

#[tauri::command]
pub fn get_app_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

#[tauri::command]
pub fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub async fn save_session(data: String, path: String) -> Result<String, String> {
    let path_buf = Path::new(&path);
    
    // S'assurer que le répertoire parent existe
    if let Some(parent) = path_buf.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    fs::write(path_buf, data).map_err(|e| e.to_string())?;
    Ok("Session sauvegardée avec succès".to_string())
}

#[tauri::command]
pub async fn load_session(path: String) -> Result<String, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    Ok(content)
}

#[tauri::command]
pub fn relaunch_app(app: AppHandle) {
    app.restart();
}

#[tauri::command]
pub fn save_secret(id: String, value: String) -> Result<bool, String> {
    let entry = keyring::Entry::new("GM-OS", &id).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())?;
    Ok(true)
}

#[tauri::command]
pub fn get_secret(id: String) -> Result<Option<String>, String> {
    let entry = keyring::Entry::new("GM-OS", &id).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(p) => Ok(Some(p)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[derive(serde::Serialize)]
pub struct DisplayInfo {
    pub id: String,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
}

#[tauri::command]
pub fn get_displays(app: AppHandle) -> Vec<DisplayInfo> {
    let windows = app.webview_windows();
    let main_window = windows.get("main").expect("main window not found");
    
    match main_window.available_monitors() {
        Ok(monitors) => monitors.into_iter().enumerate().map(|(i, m)| {
            let size = m.size();
            DisplayInfo {
                id: i.to_string(),
                name: m.name().unwrap_or(&format!("Display {}", i)).to_string(),
                width: size.width,
                height: size.height,
                is_primary: i == 0, // Simplification pour l'instant
            }
        }).collect(),
        Err(_) => vec![]
    }
}

#[tauri::command]
pub fn identify_display() {
    println!("Identifying displays...");
}

#[tauri::command]
pub fn set_projection(display_id: String, enabled: bool) -> bool {
    println!("Setting projection for {} to {}", display_id, enabled);
    true
}

#[tauri::command]
pub fn delete_secret(id: String) -> Result<bool, String> {
    let entry = keyring::Entry::new("GM-OS", &id).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())?;
    Ok(true)
}

// Note: Pour select_folder/file, nous utilisons généralement le plugin-dialog côté JS, 
// mais nous pouvons aussi le wrapper ici si nécessaire pour le pont agnostique.
