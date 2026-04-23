use tauri::{AppHandle, Manager, State};
use std::process::{Command, Child, Stdio};
use std::sync::Mutex;
use std::io::{Write, BufReader, BufRead};
use serde::{Serialize, Deserialize};

pub struct McpState {
    pub child: Mutex<Option<Child>>,
}

#[derive(Serialize, Deserialize)]
pub struct McpRequest {
    pub jsonrpc: String,
    pub id: u32,
    pub method: String,
    pub params: serde_json::Value,
}

#[tauri::command]
pub fn start_mcp_server(state: State<'_, McpState>, python_path: String, script_path: String) -> Result<String, String> {
    let mut child_guard = state.child.lock().unwrap();
    
    if child_guard.is_some() {
        return Ok("Server already running".to_string());
    }

    let child = Command::new(python_path)
        .arg(script_path)
        .arg("server")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| e.to_string())?;

    *child_guard = Some(child);
    Ok("Server started".to_string())
}

#[tauri::command]
pub fn stop_mcp_server(state: State<'_, McpState>) -> Result<String, String> {
    let mut child_guard = state.child.lock().unwrap();
    if let Some(mut child) = child_guard.take() {
        child.kill().map_err(|e| e.to_string())?;
        Ok("Server stopped".to_string())
    } else {
        Ok("Server not running".to_string())
    }
}

#[tauri::command]
pub async fn call_mcp_tool(state: State<'_, McpState>, method: String, params: serde_json::Value) -> Result<serde_json::Value, String> {
    let mut child_guard = state.child.lock().unwrap();
    if let Some(child) = child_guard.as_mut() {
        let stdin = child.stdin.as_mut().ok_or("Failed to open stdin")?;
        
        let request = serde_json::json!({
            "jsonrpc": "2.0",
            "id": 1, // Temporaire, il faudrait un compteur
            "method": method,
            "params": params
        });

        let req_str = serde_json::to_string(&request).map_err(|e| e.to_string())? + "\n";
        stdin.write_all(req_str.as_bytes()).map_err(|e| e.to_string())?;

        // Lecture de la réponse (Bloquant pour l'instant, à améliorer avec async)
        let stdout = child.stdout.as_mut().ok_or("Failed to open stdout")?;
        let mut reader = BufReader::new(stdout);
        let mut line = String::new();
        reader.read_line(&mut line).map_err(|e| e.to_string())?;
        
        let response: serde_json::Value = serde_json::from_str(&line).map_err(|e| e.to_string())?;
        Ok(response)
    } else {
        Err("Server not running".to_string())
    }
}
