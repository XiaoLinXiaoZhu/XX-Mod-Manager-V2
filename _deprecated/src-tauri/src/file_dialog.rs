use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use rfd::FileDialog;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileFilter {
    pub name: String,
    pub extensions: Vec<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FileDialogOptions {
    pub title: Option<String>,
    pub starting_path: Option<String>,
    pub filters: Option<Vec<FileFilter>>,
    pub multiple: bool,
    pub folder: bool,
    pub save: bool,
}

#[tauri::command]
pub async fn open_file_dialog(options: FileDialogOptions) -> Option<Vec<String>> {
    let dialog = FileDialog::new();

    let mut dialog = if let Some(title) = options.title {
        dialog.set_title(&title)
    } else {
        dialog
    };

    if let Some(path) = options.starting_path {
        if let Some(p) = PathBuf::from(path).parent().map(|p| p.to_path_buf()) {
            dialog = dialog.set_directory(p);
        }
    }

    if let Some(filters) = options.filters {
        for filter in filters {
            let exts = filter.extensions.iter().map(|e| e.as_str()).collect::<Vec<&str>>();
            dialog = dialog.add_filter(&filter.name, &exts[..]);
        }
    }

    if options.save {
        let result = dialog.save_file();
        result.map(|p| vec![p.to_string_lossy().to_string()])
    } else if options.folder {
        let result = dialog.pick_folder();
        result.map(|p| vec![p.to_string_lossy().to_string()])
    } else if options.multiple {
        let result = dialog.pick_files();
        result.map(|paths| paths.iter().map(|p| p.to_string_lossy().to_string()).collect())
    } else {
        let result = dialog.pick_file();
        result.map(|p| vec![p.to_string_lossy().to_string()])
    }
}