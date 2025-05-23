use tauri::Manager;
use wake_up::send_wake_up;
mod wake_up;
mod window_commands;
mod argv;
mod file_commands;
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        // .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet])
        .invoke_handler(tauri::generate_handler![
            file_commands::get_appdata_dir,
            file_commands::read_file,
            file_commands::write_file,
            file_commands::read_binary_file,
            file_commands::write_binary_file,
            file_commands::rename_file,
            file_commands::rename_directory,
            file_commands::delete_file,
            file_commands::create_directory,
            file_commands::delete_directory,
            file_commands::move_file,
            file_commands::move_directory,
            file_commands::copy_file,
            file_commands::copy_directory,
            file_commands::is_file_exists,
            file_commands::is_directory_exists,
            file_commands::get_directory_list,
            file_commands::get_full_path,
            file_commands::create_symlink,
            file_commands::is_symlink_supported,
            file_commands::download_file_to_path,
            file_commands::download_file_to_binary,
            file_commands::open_directory_with_default_app,
            file_commands::open_file_with_default_app,
            file_commands::open_url_with_default_browser,
            file_commands::open_program,
            file_commands::show_file_in_explorer,
            file_commands::show_directory_in_explorer,
            argv::get_command_line_args,
            wake_up::main_window_ready
        ])
        .setup(|app| {
            let args = argv::get_args();
            argv::handle_cli();
            println!("Arguments: {:?}", args);

            // 如果 开启了开发者工具，则打开开发者工具
            if args.dev_tools {
                if let Some(window) = app.get_webview_window("main") {
                    #[cfg(debug_assertions)]
                    window.open_devtools();
                } else {
                    eprintln!("Failed to get the main webview window.");
                }
            }

            let _ = send_wake_up(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
