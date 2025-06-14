// repo 只会保存三个内容：
// uid - 作为仓库的唯一标识符
// location - 仓库的存储位置
// 其他用于展示的的信息

export type repo = {
    /**
     * @desc 仓库的唯一标识符
     * @example 'repo-12345'
     */
    uid: string;
    /**
     * @desc 仓库的存储位置
     * @example '/path/to/repo'
     * @note 这个位置是一个绝对路径，指向仓库的根目录
     */
    location: string; 
    name?: string;
    description?: string;
    cover?: string;
    createdAt?: string;
    updatedAt?: string;
};

