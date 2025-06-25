// get argv from command line
import { invoke } from "@tauri-apps/api/core";

// {
//     "dev_mode": false,
//     "dev_tools": false,
//     "custom_config_folder": false,
//     "repo": "",
//     "page": "",
//     "command": null
// }
export interface Argv {
  dev_mode: boolean;
  dev_tools: boolean;
  custom_config_folder: boolean;
  repo?: string;
  page?: string;
  // [key: string]: any;
}



export async function getArgv() {
    return await invoke("get_command_line_args") as Argv;
}
