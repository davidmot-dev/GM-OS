use tauri::{AppHandle, Manager, Runtime};
use std::fs;
use std::path::PathBuf;
use keyring::Entry;

// -------------------------------------------------------------------------
//  Commandes Session
// -------------------------------------------------------------------------

#[tauri::command]
async fn save_session(data: String, path: String) -> Result<String, String> {
    let mut full_path = PathBuf::from(path);
    if !full_path.is_absolute() {
        // En v7, on stocke souvent dans le dossier de l'app ou un sous-dossier relatif
        // Pour l'instant on écrit en relatif par rapport au CWD ou on pourrait utiliser app_data_dir
    }
    
    fs::write(&full_path, data).map_err(|e| e.to_string())?;
    Ok(full_path.to_string_lossy().into_owned())
}

#[tauri::command]
async fn load_session(path: String) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

// -------------------------------------------------------------------------
//  Commandes Système
// -------------------------------------------------------------------------

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn get_app_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

// -------------------------------------------------------------------------
//  Commandes Sécurité (Keyring)
// -------------------------------------------------------------------------

#[tauri::command]
async fn get_secret(id: String) -> Result<Option<String>, String> {
    let entry = Entry::new("gm-os-v7", &id).map_err(|e| e.to_string())?;
    match entry.get_password() {
        Ok(password) => Ok(Some(password)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
async fn save_secret(id: String, value: String) -> Result<bool, String> {
    let entry = Entry::new("gm-os-v7", &id).map_err(|e| e.to_string())?;
    entry.set_password(&value).map_err(|e| e.to_string())?;
    Ok(true)
}

// -------------------------------------------------------------------------
//  Point d'entrée
// -------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            save_session,
            load_session,
            quit_app,
            get_app_version,
            get_secret,
            save_secret
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
