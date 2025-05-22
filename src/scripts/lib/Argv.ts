// get argv from command line
import { invoke } from "@tauri-apps/api/core";

export async function getArgv() {
    return await invoke("get_command_line_args");
}
