// 为渲染进程提供当前的命令行参数
use clap::{Parser, Subcommand};
use serde::Serialize;

#[derive(Parser, Debug,Serialize)]
#[command(version, about, long_about = None)]
// devMode: devMode, // 用于控制特殊信息的输出
// page: "main" || "firstpage" ||  “switchConfig”. // 用于控制直接跳转到指定页面
// devTools: devTools, // 控制是否自动打开开发者工具
// customConfigFolder: customConfigFolder // 控制是否使用外部配置作为配置文件夹
pub struct Args {
    /// 是否开启开发者模式
    #[arg(long, default_value_t = false)]
    pub dev_mode: bool,

    /// 是否自动打开开发者工具
    #[arg(long, default_value_t = false)]
    pub dev_tools: bool,

    /// 是否使用外部配置作为配置文件夹
    #[arg(long, default_value_t = false)]
    pub custom_config_folder: bool,

    /// 直接跳转到指定页面
    #[arg(long, default_value_t = String::from(""))]
    pub page: String,

    /// 子命令
    #[command(subcommand)]
    pub command: Option<Commands>,
}

#[derive(Subcommand, Debug,Serialize)]
pub enum Commands {
    /// debug
    Test {
        /// debug
        #[arg(long, default_value_t = false)]
        debug: bool,
    },

    /// Version
    /// Prints the version information
    Version {
        /// Prints the detailed version information
        #[arg(long, default_value_t = false)]
        detailed: bool,
    },
}


#[tauri::command]
pub async fn get_command_line_args(app_handle: tauri::AppHandle) -> Result<Args, String> {
    let args = Args::parse();
    Ok(args)
}



pub fn get_args() -> Args {
    Args::parse()
}

pub fn handle_cli(){
    let cli = Args::parse();

    if cli.dev_mode {
        println!("dev_mode: {}", cli.dev_mode);
    }
    if cli.dev_tools {
        println!("dev_tools: {}", cli.dev_tools);
    }
    if cli.custom_config_folder {
        println!("custom_config_folder: {}", cli.custom_config_folder);
    }
    match cli.page.as_str() {
        "main" => println!("main"),
        "firstpage" => println!("firstpage"),
        "switchConfig" => println!("switchConfig"),
        _ => println!("default"),
    }

    // 处理子命令
    match &cli.command {
        Some(Commands::Test { debug }) => {
            if *debug {
                println!("Debug mode is enabled");
            }
        }
        Some(Commands::Version { detailed }) => {
            if *detailed {
                println!("Detailed version information");
            }
        }
        None => {}
    }
}
