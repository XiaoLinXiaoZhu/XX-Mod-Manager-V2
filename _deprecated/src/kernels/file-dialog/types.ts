/**
 * 文件对话框类型定义
 */

export type FileFilter = {
  name: string,
  extensions: string[]
}

export type FileDialogOption = {
  title?: string
  startingPath?: string
  filters?: FileFilter[]
  multiple?: boolean
  folder?: boolean
  save?: boolean
}
