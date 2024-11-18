export function createElement(tag, options = {}) {
    const element = document.createElement(tag);
    
    if (options.className) {
        element.className = options.className;
    }
    
    if (options.innerHTML) {
        element.innerHTML = options.innerHTML;
    }
    
    if (options.dataset) {
        Object.assign(element.dataset, options.dataset);
    }
    
    if (options.draggable !== undefined) {
        element.draggable = options.draggable;
    }

    // 添加事件监听器处理
    if (options.onclick) {
        element.onclick = options.onclick;
    }
    
    return element;
}