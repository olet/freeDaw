import MainPage from './ui/pages/MainPage';
import Scene from './core/Scene';
import SceneManager from './core/SceneManager';

async function init() {
    console.log('App: Initializing...');

    try {
        // 创建场景管理器和默认场景
        const sceneManager = new SceneManager();
        console.log('App: SceneManager created');

        const scene = sceneManager.createScene('main', 8, 16);
        console.log('App: Scene created');

        sceneManager.setCurrentScene('main');
        console.log('App: Current scene set');

        // 创建并挂载主页面
        const mainPage = new MainPage({
            scene: scene,
            sceneManager: sceneManager
        });
        console.log('App: MainPage created');

        // 挂载到app容器
        const appContainer = document.getElementById('app');
        if (!appContainer) {
            throw new Error('App: No #app container found!');
        }

        mainPage.mount(appContainer);
        console.log('App: MainPage mounted');

    } catch (error) {
        console.error('App: Initialization error:', error);
    }
}

// 确保在 DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('App: DOM loaded, starting initialization');
    init();
}); 