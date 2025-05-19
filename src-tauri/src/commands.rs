// src-tauri/src/commands.rs
use std::{fs, path};
use std::path::{Path, PathBuf};
use tauri::Manager;

fn check_file_exists(path: &PathBuf, if_create: bool, if_create_placeholder: bool) -> Result<(), String> {
    println!("Checking file existence at: {}", path.display());

    // 如果路径的父文件夹不存在，则创建它
    if let Some(parent) = path.parent() {
        if !parent.exists() && (if_create || if_create_placeholder) {
            // 如果父目录不存在且需要创建，则创建它
            println!("Creating parent directory: {:?}", parent);
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
    }

    // 如果路径不存在，则在理应存在的目录中创建一个 fileName.notfound.ext
    if !path.exists() {
        if if_create {
            // 如果文件不存在且需要创建，则创建一个空文件
            println!("Creating file: {:?}", path);
            fs::File::create(&path).map_err(|e| e.to_string())?;
            return Ok(());
        }
        if if_create_placeholder {
            let not_found_path = path.with_extension("notfound");
            fs::write(&not_found_path, "File not found").map_err(|e| e.to_string())?;
            return Err(format!("File not found, created placeholder at {:?}", not_found_path).to_string());
        } else {
            return Err(format!("File not found: {:?}", path));
        }
    }
    Ok(())
}

#[tauri::command]
pub fn read_file(app_handle: tauri::AppHandle, path_str: String, if_create: bool) -> Result<String, String> {
    let path = Path::new(&path_str);
    let resolved_path: PathBuf = if path.is_absolute() {
        // 如果是绝对路径，则直接使用
        path.to_path_buf()
    } else {
        // 否则，尝试基于应用的基础目录解析相对路径
        let resource_dir = app_handle.path().resource_dir()
            .map_err(|_| "Resource directory not found".to_string())?;
        resource_dir.join(path)
    };

    // debug
    println!("Resolved path: {:?}", resolved_path);

    if if_create {
        // 如果需要创建文件，则检查文件是否存在
        check_file_exists(&resolved_path, true, false)?;
    } else {
        // 如果不需要创建文件，则检查文件是否存在
        check_file_exists(&resolved_path, false, true)?;
    }

    fs::read_to_string(resolved_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(app_handle: tauri::AppHandle, path_str: String, content: String, if_create: bool) -> Result<(), String> {
    let path = Path::new(&path_str);
    let resolved_path = if path.is_absolute() {
        // 如果是绝对路径，则直接使用
        path.to_path_buf()
    } else {
        // 对于相对路径，选择适当的基础目录进行解析
        let resource_dir = app_handle.path().resource_dir()
            .map_err(|_| "Resource directory not found".to_string())?;
        resource_dir.join(path)
    };

    // debug
    println!("Resolved path for writing: {:?}", resolved_path);

    if if_create {
        // 如果需要创建文件，则检查文件是否存在
        check_file_exists(&resolved_path, true, false)?;
    } else {
        // 如果不需要创建文件，则检查文件是否存在
        check_file_exists(&resolved_path, false, true)?;
    }

    fs::write(resolved_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn read_binary_file(app_handle: tauri::AppHandle, path_str: String, if_create: bool) -> Result<Vec<u8>, String> {
    let path = Path::new(&path_str);
    let resolved_path = if path.is_absolute() {
        path.to_path_buf()
    } else {
        let resource_dir = app_handle.path().resource_dir()
            .map_err(|_| "Resource directory not found".to_string())?;
        resource_dir.join(path)
    };

    // debug
    println!("Resolved path for binary read: {:?}", resolved_path);

    if if_create {
        // 如果需要创建文件，则检查文件是否存在
        check_file_exists(&resolved_path, true, false)?;
    } else {
        // 如果不需要创建文件，则检查文件是否存在
        check_file_exists(&resolved_path, false, true)?;
    }

    fs::read(resolved_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_binary_file(app_handle: tauri::AppHandle, path_str: String, data: Vec<u8>, if_create: bool) -> Result<(), String> {
    let path = Path::new(&path_str);
    let resolved_path = if path.is_absolute() {
        path.to_path_buf()
    } else {
        let resource_dir = app_handle.path().resource_dir()
            .map_err(|_| "Resource directory not found".to_string())?;
        resource_dir.join(path)
    };

    // debug
    println!("Resolved path for binary write: {:?}", resolved_path);

    if if_create {
        // 如果需要创建文件，则检查文件是否存在
        check_file_exists(&resolved_path, true, false)?;
    } else {
        // 如果不需要创建文件，则检查文件是否存在
        check_file_exists(&resolved_path, false, true)?;
    }

    fs::write(resolved_path, data).map_err(|e| e.to_string())
}