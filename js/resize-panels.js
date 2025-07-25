/**
 * 左中右工作区宽度可调功能
 * 支持拖拽调整左右侧边栏宽度
 */

class PanelResizer {
    constructor() {
        this.isResizing = false;
        this.currentHandle = null;
        this.startX = 0;
        this.startWidth = 0;
        this.minWidth = 200;
        this.maxWidth = 600;
        
        this.init();
    }
    
    init() {
        // 为所有拖拽调整器添加事件监听
        const resizeHandles = document.querySelectorAll('.resize-handle');
        resizeHandles.forEach(handle => {
            handle.addEventListener('mousedown', this.handleMouseDown.bind(this));
        });
        
        // 添加全局鼠标事件监听
        document.addEventListener('mousemove', this.handleMouseMove.bind(this));
        document.addEventListener('mouseup', this.handleMouseUp.bind(this));
        
        // 防止拖拽时选中文本
        document.addEventListener('selectstart', this.preventSelection.bind(this));
    }
    
    handleMouseDown(e) {
        e.preventDefault();
        
        this.isResizing = true;
        this.currentHandle = e.target;
        this.startX = e.clientX;
        
        // 获取当前面板
        const panel = this.currentHandle.parentElement;
        this.startWidth = panel.offsetWidth;
        
        // 添加视觉反馈
        this.currentHandle.classList.add('active');
        document.body.classList.add('resizing');
        
        // 改变光标样式
        document.body.style.cursor = 'col-resize';
    }
    
    handleMouseMove(e) {
        if (!this.isResizing || !this.currentHandle) return;
        
        e.preventDefault();
        
        const panel = this.currentHandle.parentElement;
        const deltaX = e.clientX - this.startX;
        
        let newWidth;
        
        // 根据是左侧还是右侧面板计算新宽度
        if (panel.id === 'connection-options') {
            // 左侧面板：向右拖拽增加宽度
            newWidth = this.startWidth + deltaX;
        } else if (panel.id === 'serial-tools') {
            // 右侧面板：向左拖拽增加宽度
            newWidth = this.startWidth - deltaX;
        }
        
        // 限制宽度范围
        newWidth = Math.max(this.minWidth, Math.min(this.maxWidth, newWidth));
        
        // 应用新宽度
        panel.style.width = newWidth + 'px';
        panel.style.flexBasis = newWidth + 'px';
        
        // 更新右侧面板内容区域的宽度
        if (panel.id === 'serial-tools') {
            const contentArea = panel.querySelector('.collapse');
            if (contentArea) {
                contentArea.style.width = (newWidth - 40) + 'px'; // 减去按钮和边距
            }
        }
    }
    
    handleMouseUp(e) {
        if (!this.isResizing) return;
        
        this.isResizing = false;
        
        // 移除视觉反馈
        if (this.currentHandle) {
            this.currentHandle.classList.remove('active');
        }
        document.body.classList.remove('resizing');
        document.body.style.cursor = '';
        
        this.currentHandle = null;
        
        // 保存当前宽度设置到localStorage
        this.saveWidthSettings();
    }
    
    preventSelection(e) {
        if (this.isResizing) {
            e.preventDefault();
        }
    }
    
    // 保存宽度设置
    saveWidthSettings() {
        const leftPanel = document.getElementById('connection-options');
        const rightPanel = document.getElementById('serial-tools');
        
        const settings = {
            leftWidth: leftPanel.offsetWidth,
            rightWidth: rightPanel.offsetWidth,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('panel-widths', JSON.stringify(settings));
        } catch (e) {
            console.warn('无法保存面板宽度设置:', e);
        }
    }
    
    // 加载宽度设置
    loadWidthSettings() {
        try {
            const saved = localStorage.getItem('panel-widths');
            if (!saved) return;
            
            const settings = JSON.parse(saved);
            const leftPanel = document.getElementById('connection-options');
            const rightPanel = document.getElementById('serial-tools');
            
            // 应用保存的宽度
            if (settings.leftWidth && settings.leftWidth >= this.minWidth && settings.leftWidth <= this.maxWidth) {
                leftPanel.style.width = settings.leftWidth + 'px';
                leftPanel.style.flexBasis = settings.leftWidth + 'px';
            }
            
            if (settings.rightWidth && settings.rightWidth >= this.minWidth && settings.rightWidth <= this.maxWidth) {
                rightPanel.style.width = settings.rightWidth + 'px';
                rightPanel.style.flexBasis = settings.rightWidth + 'px';
                
                // 更新右侧面板内容区域的宽度
                const contentArea = rightPanel.querySelector('.collapse');
                if (contentArea) {
                    contentArea.style.width = (settings.rightWidth - 40) + 'px';
                }
            }
        } catch (e) {
            console.warn('无法加载面板宽度设置:', e);
        }
    }
    
    // 重置为默认宽度
    resetToDefault() {
        const leftPanel = document.getElementById('connection-options');
        const rightPanel = document.getElementById('serial-tools');
        
        leftPanel.style.width = '';
        leftPanel.style.flexBasis = '';
        rightPanel.style.width = '';
        rightPanel.style.flexBasis = '';
        
        // 重置右侧面板内容区域
        const contentArea = rightPanel.querySelector('.collapse');
        if (contentArea) {
            contentArea.style.width = '428px'; // 恢复原始宽度
        }
        
        // 清除保存的设置
        try {
            localStorage.removeItem('panel-widths');
        } catch (e) {
            console.warn('无法清除面板宽度设置:', e);
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    const resizer = new PanelResizer();
    
    // 加载保存的宽度设置
    resizer.loadWidthSettings();
    
    // 将resizer实例暴露到全局，方便调试和其他功能使用
    window.panelResizer = resizer;
});

// 添加键盘快捷键支持
document.addEventListener('keydown', function(e) {
    // Ctrl + R 重置面板宽度
    if (e.ctrlKey && e.key === 'r' && e.shiftKey) {
        e.preventDefault();
        if (window.panelResizer) {
            window.panelResizer.resetToDefault();
        }
    }
});