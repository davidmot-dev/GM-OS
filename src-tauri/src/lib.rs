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
//  Commandes Remote & Sync
// -------------------------------------------------------------------------

#[derive(serde::Serialize)]
struct ConnectionInfo {
    ip: String,
    port: u16,
}

#[tauri::command]
fn get_connection_info() -> ConnectionInfo {
    ConnectionInfo {
        ip: "127.0.0.1".to_string(),
        port: 8080,
    }
}

#[tauri::command]
fn cache_media(id: String, _buffer: Vec<u8>) -> bool {
    println!("[Tauri] Caching media: {}", id);
    true
}

// -------------------------------------------------------------------------
//  Commandes NPC
// -------------------------------------------------------------------------

#[tauri::command]
fn npc_list_databases(_category: String) -> Vec<String> {
    Vec::new()
}

#[tauri::command]
fn npc_load_database(_category: String, _name: String) -> std::collections::HashMap<String, Vec<String>> {
    std::collections::HashMap::new()
}

#[tauri::command]
fn npc_select_avatar() -> Option<String> {
    None
}

#[tauri::command]
fn npc_save_avatar(_buffer: Vec<u8>, _file_name: String) -> Option<String> {
    None
}

// -------------------------------------------------------------------------
//  Commandes Tables
// -------------------------------------------------------------------------

#[tauri::command]
fn tables_list_universes() -> Vec<String> {
    Vec::new()
}

#[tauri::command]
fn tables_list_tables(_universe: String) -> Vec<String> {
    Vec::new()
}

#[tauri::command]
fn tables_load_table(_universe: String, _table_name: String) -> Option<serde_json::Value> {
    None
}

// -------------------------------------------------------------------------
//  Commandes Git
// -------------------------------------------------------------------------

#[tauri::command]
fn git_get_status() -> serde_json::Value {
    serde_json::json!({ "available": false })
}

#[tauri::command]
fn git_setup_branch(_branch: String) -> serde_json::Value {
    serde_json::json!({ "success": false })
}

#[tauri::command]
fn git_sync_data(_directory: String, _branch: String, _message: String) -> serde_json::Value {
    serde_json::json!({ "success": false })
}

#[tauri::command]
fn git_save_data(_data: serde_json::Value) -> serde_json::Value {
    serde_json::json!({ "success": false })
}

// -------------------------------------------------------------------------
//  Commandes Web
// -------------------------------------------------------------------------

#[tauri::command]
fn open_external(url: String) {
    println!("[Tauri] Opening external URL: {}", url);
}

#[tauri::command]
fn web_save_list(_data: serde_json::Value) -> bool {
    true
}

#[tauri::command]
fn web_load_list() -> Option<serde_json::Value> {
    None
}

// -------------------------------------------------------------------------
//  Commandes Obsidian
// -------------------------------------------------------------------------

#[tauri::command]
fn obsidian_list_notes(_vault_path: Option<String>) -> Vec<serde_json::Value> {
    Vec::new()
}

#[tauri::command]
fn obsidian_read_note(_relative_path: String, _vault_path: Option<String>) -> Option<String> {
    None
}

#[tauri::command]
fn obsidian_write_note(_relative_path: String, _content: String, _vault_path: Option<String>) -> bool {
    false
}

#[tauri::command]
fn obsidian_ensure_directory(_relative_path: String, _vault_path: Option<String>) -> bool {
    false
}

#[tauri::command]
fn obsidian_select_vault() -> Option<String> {
    None
}

// -------------------------------------------------------------------------
//  Commandes MCP
// -------------------------------------------------------------------------

#[tauri::command]
fn mcp_list_tools(_server_name: String) -> Vec<serde_json::Value> {
    Vec::new()
}

#[tauri::command]
fn mcp_call_tool(_server_name: String, _tool_name: String, _args: serde_json::Value) -> serde_json::Value {
    serde_json::json!({ "content": "" })
}

#[tauri::command]
fn mcp_reauthenticate() -> serde_json::Value {
    serde_json::json!({ "success": false, "message": "Non supporté" })
}

#[tauri::command]
fn mcp_restart() -> serde_json::Value {
    serde_json::json!({ "success": false, "message": "Non supporté" })
}

// -------------------------------------------------------------------------
//  Commandes Nexus
// -------------------------------------------------------------------------

#[tauri::command]
fn nexus_register_asset(_media_hub_id: String, _data_url: String) -> serde_json::Value {
    serde_json::json!({ "ok": false })
}

#[tauri::command]
fn nexus_clear_assets() -> serde_json::Value {
    serde_json::json!({ "ok": true })
}

#[tauri::command]
fn nexus_export_bundle(_campaign_id: String, _output_path: String, _state_json: String, _manifest_json: String, _asset_refs: Vec<String>) -> serde_json::Value {
    serde_json::json!({ "ok": false, "error": "Non supporté" })
}

#[tauri::command]
fn nexus_import_bundle(_file_path: String) -> Option<serde_json::Value> {
    None
}

#[tauri::command]
fn nexus_select_export_path(_bundle_type: Option<String>) -> Option<String> {
    None
}

#[tauri::command]
fn nexus_select_import_file() -> Option<String> {
    None
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
            save_secret,
            get_connection_info,
            cache_media,
            npc_list_databases,
            npc_load_database,
            npc_select_avatar,
            npc_save_avatar,
            tables_list_universes,
            tables_list_tables,
            tables_load_table,
            git_get_status,
            git_setup_branch,
            git_sync_data,
            git_save_data,
            open_external,
            web_save_list,
            web_load_list,
            obsidian_list_notes,
            obsidian_read_note,
            obsidian_write_note,
            obsidian_ensure_directory,
            obsidian_select_vault,
            mcp_list_tools,
            mcp_call_tool,
            mcp_reauthenticate,
            mcp_restart,
            nexus_register_asset,
            nexus_clear_assets,
            nexus_export_bundle,
            nexus_import_bundle,
            nexus_select_export_path,
            nexus_select_import_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

