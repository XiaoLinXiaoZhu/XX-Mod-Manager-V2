// 为前端提供事件服务

//- ==========================================
//- 当 启动时，如果：
// 1. 自己启动完成 
// 2. 接收到 main-window-ready 事件
// 那么就发送一个awake事件到前端

use tauri::{Emitter, Runtime};

const WAKE_UP_NEEDS: u32 = 2;
pub static mut wake_up_condition: u32 = 0;
#[tauri::command]
pub async fn main_window_ready<R: Runtime>(app: tauri::AppHandle<R>, window: tauri::Window<R>) -> Result<(), String> {
    // 发送事件到前端
    app.emit("main-window-ready", "main-window-ready").map_err(|e| e.to_string())?;
    unsafe { wake_up_condition += 1; }
    println!("main-window-ready");
    send_wake_up(app).await?;
    Ok(())
}

pub async fn send_wake_up<R: Runtime>(app: tauri::AppHandle<R>) -> Result<(), String> {
    if unsafe { wake_up_condition } <= WAKE_UP_NEEDS {
        return Ok(());
    }
    app.emit("wake-up", "wake-up").map_err(|e| e.to_string())?;
    println!("wake-up");
    Ok(())
}