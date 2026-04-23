mod commands;
mod mcp;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .manage(mcp::McpState { child: std::sync::Mutex::new(None) })
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::get_app_version,
      commands::quit_app,
      commands::relaunch_app,
      commands::save_session,
      commands::load_session,
      commands::save_secret,
      commands::get_secret,
      commands::delete_secret,
      commands::get_displays,
      commands::identify_display,
      commands::set_projection,
      mcp::start_mcp_server,
      mcp::stop_mcp_server,
      mcp::call_mcp_tool
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
