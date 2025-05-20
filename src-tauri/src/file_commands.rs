// src-tauri/src/commands.rs
use std::path::{Path, PathBuf};
// use std::{fs, path};
use std::fs;
use tauri::Manager;

fn check_file_exists(
    path: &PathBuf,
    if_create: bool,
    if_create_placeholder: bool,
) -> Result<(), String> {
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
            return Err(format!(
                "File not found, created placeholder at {:?}",
                not_found_path
            )
            .to_string());
        } else {
            return Err(format!("File not found: {:?}", path));
        }
    }
    Ok(())
}



#[tauri::command]
// 获取应用 appdata 目录
pub fn get_appdata_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|_| "App data directory not found".to_string())?;
    Ok(app_data_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_resolved_path(app_handle: &tauri::AppHandle, path: &Path) -> Result<PathBuf, String> {
    if path.is_absolute() {
        Ok(path.to_path_buf())
    } else {
        let resource_dir = app_handle
            .path()
            .resource_dir()
            .map_err(|_| "Resource directory not found".to_string())?;
        Ok(resource_dir.join(path))
    }
}

#[tauri::command]
pub fn read_file(
    app_handle: tauri::AppHandle,
    path_str: String,
    if_create: bool,
) -> Result<String, String> {
    let path = Path::new(&path_str);
    let resolved_path: PathBuf = get_resolved_path(&app_handle, path)?;

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
pub fn write_file(
    app_handle: tauri::AppHandle,
    path_str: String,
    content: String,
    if_create: bool,
) -> Result<(), String> {
    let path = Path::new(&path_str);
    let resolved_path = get_resolved_path(&app_handle, path)?;

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
pub async fn read_binary_file(
    app_handle: tauri::AppHandle,
    path_str: String,
    if_create: bool,
) -> Result<Vec<u8>, String> {
    let path = Path::new(&path_str);
    let resolved_path = get_resolved_path(&app_handle, path)?;

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
pub async fn write_binary_file(
    app_handle: tauri::AppHandle,
    path_str: String,
    data: Vec<u8>,
    if_create: bool,
) -> Result<(), String> {
    let path = Path::new(&path_str);
    let resolved_path: PathBuf = get_resolved_path(&app_handle, path)?;

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

//-====================== 文件操作 ======================-//
// 1. rename file/directory
// 2. delete file/directory
// 3. create file/directory
// 4. move file/directory
// 5. copy file/directory
// 6. is_file_exists/directory_exists
// 7. 获取文件夹列表 get_directory_list

// 8. symlink file/directory

#[tauri::command]
// rename file
pub fn rename_file(
    app_handle: tauri::AppHandle,
    old_path_str: String,
    new_path_str: String,
) -> Result<(), String> {
    let old_path = Path::new(&old_path_str);
    let new_path = Path::new(&new_path_str);

    let resolved_old_path = get_resolved_path(&app_handle, old_path)?;
    let resolved_new_path = get_resolved_path(&app_handle, new_path)?;

    fs::rename(resolved_old_path, resolved_new_path).map_err(|e| e.to_string())
}

#[tauri::command]
// rename directory
pub fn rename_directory(
    app_handle: tauri::AppHandle,
    old_path_str: String,
    new_path_str: String,
) -> Result<(), String> {
    let old_path = Path::new(&old_path_str);
    let new_path = Path::new(&new_path_str);

    let resolved_old_path = get_resolved_path(&app_handle, old_path)?;

    let resolved_new_path = get_resolved_path(&app_handle, new_path)?;

    fs::rename(resolved_old_path, resolved_new_path).map_err(|e| e.to_string())
}

#[tauri::command]
// delete file
pub fn delete_file(app_handle: tauri::AppHandle, path_str: String) -> Result<(), String> {
    let path = Path::new(&path_str);
    let resolved_path: PathBuf = get_resolved_path(&app_handle, path)?;

    fs::remove_file(resolved_path).map_err(|e| e.to_string())
}

#[tauri::command]
// create directory
pub fn create_directory(app_handle: tauri::AppHandle, path_str: String) -> Result<(), String> {
    let path = Path::new(&path_str);
    let resolved_path: PathBuf = get_resolved_path(&app_handle, path)?;

    fs::create_dir_all(resolved_path).map_err(|e| e.to_string())
}

#[tauri::command]
// delete directory
pub fn delete_directory(app_handle: tauri::AppHandle, path_str: String) -> Result<(), String> {
    let path = Path::new(&path_str);
    let resolved_path: PathBuf = get_resolved_path(&app_handle, path)?;

    fs::remove_dir_all(resolved_path).map_err(|e| e.to_string())
}

#[tauri::command]
// move file
pub fn move_file(
    app_handle: tauri::AppHandle,
    old_path_str: String,
    new_path_str: String,
) -> Result<(), String> {
    let old_path = Path::new(&old_path_str);
    let new_path = Path::new(&new_path_str);

    let resolved_old_path = get_resolved_path(&app_handle, old_path)?;

    let resolved_new_path = get_resolved_path(&app_handle, new_path)?;

    fs::rename(resolved_old_path, resolved_new_path).map_err(|e| e.to_string())
}

#[tauri::command]
// move directory
pub fn move_directory(
    app_handle: tauri::AppHandle,
    old_path_str: String,
    new_path_str: String,
) -> Result<(), String> {
    let old_path = Path::new(&old_path_str);
    let new_path = Path::new(&new_path_str);

    let resolved_old_path = get_resolved_path(&app_handle, old_path)?;
    let resolved_new_path = get_resolved_path(&app_handle, new_path)?;

    fs::rename(resolved_old_path, resolved_new_path).map_err(|e| e.to_string())
}

#[tauri::command]
// copy file
pub fn copy_file(
    app_handle: tauri::AppHandle,
    old_path_str: String,
    new_path_str: String,
) -> Result<(), String> {
    let old_path = Path::new(&old_path_str);
    let new_path = Path::new(&new_path_str);

    let resolved_old_path = if old_path.is_absolute() {
        old_path.to_path_buf()
    } else {
        let resource_dir = app_handle
            .path()
            .resource_dir()
            .map_err(|_| "Resource directory not found".to_string())?;
        resource_dir.join(old_path)
    };

    let resolved_new_path = if new_path.is_absolute() {
        new_path.to_path_buf()
    } else {
        let resource_dir = app_handle
            .path()
            .resource_dir()
            .map_err(|_| "Resource directory not found".to_string())?;
        resource_dir.join(new_path)
    };

    fs::copy(resolved_old_path, resolved_new_path)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
// copy directory
pub fn copy_directory(
    app_handle: tauri::AppHandle,
    old_path_str: String,
    new_path_str: String,
) -> Result<(), String> {
    let old_path = Path::new(&old_path_str);
    let new_path = Path::new(&new_path_str);

    let resolved_old_path = if old_path.is_absolute() {
        old_path.to_path_buf()
    } else {
        let resource_dir = app_handle
            .path()
            .resource_dir()
            .map_err(|_| "Resource directory not found".to_string())?;
        resource_dir.join(old_path)
    };

    let resolved_new_path = if new_path.is_absolute() {
        new_path.to_path_buf()
    } else {
        let resource_dir = app_handle
            .path()
            .resource_dir()
            .map_err(|_| "Resource directory not found".to_string())?;
        resource_dir.join(new_path)
    };

    fs::copy(resolved_old_path, resolved_new_path)
        .map(|_| ())
        .map_err(|e| e.to_string())
}

#[tauri::command]
// check if file exists
pub fn is_file_exists(app_handle: tauri::AppHandle, path_str: String) -> Result<bool, String> {
    let path = Path::new(&path_str);
    let resolved_path = get_resolved_path(&app_handle, path)?;

    Ok(resolved_path.exists())
}

#[tauri::command]
// check if directory exists
pub fn is_directory_exists(
    app_handle: tauri::AppHandle,
    path_str: String,
) -> Result<bool, String> {
    let path = Path::new(&path_str);
    let resolved_path = get_resolved_path(&app_handle, path)?;

    Ok(resolved_path.exists())
}

#[tauri::command]
// get directory list
pub fn get_directory_list(
    app_handle: tauri::AppHandle,
    path_str: String,
) -> Result<Vec<String>, String> {
    let path = Path::new(&path_str);
    let resolved_path = get_resolved_path(&app_handle, path)?;

    if !resolved_path.exists() {
        return Err(format!("Directory not found: {:?}", resolved_path));
    }

    let entries = fs::read_dir(resolved_path)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| entry.ok())
        .map(|entry| entry.path().to_string_lossy().to_string())
        .collect();

    Ok(entries)
}

#[tauri::command]
// get full path
pub fn get_full_path(app_handle: tauri::AppHandle, path_str: String) -> Result<String, String> {
    let path = Path::new(&path_str);
    let resolved_path = get_resolved_path(&app_handle, path)?;

    if !resolved_path.exists() {
        return Err(format!("Path not found: {:?}", resolved_path));
    }

    Ok(resolved_path.to_string_lossy().to_string())
}

#[tauri::command]
// create symlink
pub fn create_symlink(
    app_handle: tauri::AppHandle,
    target_str: String,
    link_str: String,
) -> Result<(), String> {
    let target = Path::new(&target_str);
    let link = Path::new(&link_str);

    let resolved_target = get_resolved_path(&app_handle, target)?;
    let resolved_link = get_resolved_path(&app_handle, link)?;

    #[cfg(target_family = "unix")]
    {
        std::os::unix::fs::symlink(resolved_target, resolved_link).map_err(|e| e.to_string())
    }

    #[cfg(target_family = "windows")]
    {
        if resolved_target.is_dir() {
            std::os::windows::fs::symlink_dir(resolved_target, resolved_link).map_err(|e| e.to_string())
        } else {
            std::os::windows::fs::symlink_file(resolved_target, resolved_link).map_err(|e| e.to_string())
        }
    }

    #[cfg(not(any(target_family = "unix", target_family = "windows")))]
    {
        Err("Symlink creation is not supported on this platform".to_string())
    }
}

#[tauri::command]
// 检查文件系统是否支持符号链接
pub fn is_symlink_supported(app_handle: tauri::AppHandle, path_str: String) -> bool {
    #[cfg(not(any(target_family = "unix", target_family = "windows")))]
    {
        false
    }
    // 如果是 Unix 或 Windows 系统，软链接只 支持 NTFS、FAT、ext 等文件系统，不支持 FAT32、exFAT 等文件系统
    #[cfg(any(target_family = "unix", target_family = "windows"))]
    {
        // 检查文件系统类型
        let path = Path::new(&path_str);
        let resolved_path = get_resolved_path(&app_handle, path).unwrap_or_default();

        // 检查文件系统类型
        let file_system_type = match resolved_path.metadata() {
            Ok(_) => {
                if cfg!(target_family = "unix") {
                    Some("ext") // Placeholder for Unix-like systems
                } else if cfg!(target_family = "windows") {
                    Some("NTFS") // Placeholder for Windows systems
                } else {
                    None
                }
            }
            Err(_) => None,
        };
        match file_system_type {
            Some(fs_type) if fs_type == "ext" || fs_type == "NTFS" => true,
            _ => false,
        }
    }
}
