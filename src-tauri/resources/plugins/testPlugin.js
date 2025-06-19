// plugin loader Test Plugin
// 用于测试插件加载器能否正确加载插件
export default {
    name: 'Test Plugin',    
    description: 'This is a test plugin to check if the plugin loader works correctly.',
    t_description: {
        'zh-CN': '这是一个测试插件，用于检查插件加载器是否正常工作。',
        'en-US': 'This is a test plugin to check if the plugin loader works correctly.'
    },
    scope: 'local',
    init(app){
        console.log('Test Plugin initialized');
    }
}