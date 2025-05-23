// 这里对 snack 消息直接转发
// 目的是让 程序在任何地方都能使用 snack
use tauri::{Emitter, Runtime};
use serde::{Deserialize, Serialize};

// none, info, success, warning, error
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SnackType {
    Info,
    Error,
    Success,
    Warning,
    None,
}
#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum SnackAlign {
    Auto,
    Top,
    Bottom,
}

#[tauri::command]
pub async fn snack<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::Window<R>, message: String, snack_type: SnackType,duration: u64,align: SnackAlign) -> Result<(), String> {
   // 转发到 主进程
    app.emit("snack", (message, snack_type, duration, align)).map_err(|e| e.to_string())?;
    Ok(())
}