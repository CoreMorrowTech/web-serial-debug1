/**
 * 左中右工作区宽度可调功能
 * 支持拖拽调整左右侧边栏任意宽度
 */

class PanelResizer {
    constructor() {
        this.isResizing = false;
        this.currentHandle = null;
        this.startX = 0;
        this.startWidth = 0;
        this.startMainWidth = 0;
        this.minWidth = 50;  // 降低最小宽度限制
        this.maxWidthPercent = 0.8; // 最大宽度为窗口的80%
        this.containerWidth = 0;

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

        // 监听窗口大小变化
        window.addEventListener('resize', this.handleWindowResize.bind(this));

        // 初始化容器宽度
        this.updateContainerWidth();
    }

    updateContainerWidth() {
        const mainContainer = document.getElementById('main');
        this.containerWidth = mainContainer ? mainContainer.offsetWidth : window.innerWidth;
    }

    handleWindowResize() {
        this.updateContainerWidth();
        // 重新计算面板宽度，确保不超出容器
        this.adjustPanelsToContainer();
    }

    adjustPanelsToContainer() {
        const leftPanel = document.getElementById('connection-options');
        const rightPanel = document.getElementById('serial-tools');
        const mainPanel = document.getElementById('log-main');

        if (!leftPanel || !rightPanel || !mainPanel) return;

        const leftWidth = leftPanel.offsetWidth;
        const rightWidth = rightPanel.offsetWidth;
        const totalSideWidth = leftWidth + rightWidth;
        const maxSideWidth = this.containerWidth * this.maxWidthPercent;

        if (totalSideWidth > maxSideWidth) {
            // 按比例缩小侧边栏
            const scale = maxSideWidth / totalSideWidth;
            const newLeftWidth = Math.max(this.minWidth, leftWidth * scale);
            const newRightWidth = Math.max(this.minWidth, rightWidth * scale);

            this.setPanelWidth(leftPanel, newLeftWidth);
            this.setPanelWidth(rightPanel, newRightWidth);
        }
    }

    handleMouseDown(e) {
        e.preventDefault();

        this.isResizing = true;
        this.currentHandle = e.target;
        this.startX = e.clientX;
        this.updateContainerWidth();

        // 获取当前面板
        const panel = this.currentHandle.parentElement;
        const mainPanel = document.getElementById('log-main');

        this.startWidth = panel.offsetWidth;
        this.startMainWidth = mainPanel ? mainPanel.offsetWidth : 0;

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
        const maxWidth = this.containerWidth * this.maxWidthPercent;

        // 根据是左侧还是右侧面板计算新宽度
        if (panel.id === 'connection-options') {
            // 左侧面板：向右拖拽增加宽度
            newWidth = this.startWidth + deltaX;
        } else if (panel.id === 'serial-tools') {
            // 右侧面板：向左拖拽增加宽度
            newWidth = this.startWidth - deltaX;
        }

        // 限制宽度范围 - 更灵活的限制
        newWidth = Math.max(this.minWidth, Math.min(maxWidth, newWidth));

        // 检查是否会导致中间区域过小
        const otherPanel = panel.id === 'connection-options'
            ? document.getElementById('serial-tools')
            : document.getElementById('connection-options');

        const otherWidth = otherPanel ? otherPanel.offsetWidth : 0;
        const remainingWidth = this.containerWidth - newWidth - otherWidth;
        const minMainWidth = 300; // 中间区域最小宽度

        if (remainingWidth < minMainWidth) {
            newWidth = this.containerWidth - otherWidth - minMainWidth;
        }

        // 应用新宽度
        this.setPanelWidth(panel, newWidth);

        // 显示实时宽度提示
        this.showWidthTooltip(e.clientX, e.clientY, newWidth, panel.id);
    }

    setPanelWidth(panel, width) {
        panel.style.width = width + 'px';
        panel.style.flexBasis = width + 'px';
        panel.style.minWidth = width + 'px';
        panel.style.maxWidth = width + 'px';

        // 更新右侧面板内容区域的宽度
        if (panel.id === 'serial-tools') {
            const contentArea = panel.querySelector('.collapse');
            if (contentArea) {
                const contentWidth = Math.max(200, width - 40); // 减去按钮和边距
                contentArea.style.width = contentWidth + 'px';
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

        // 隐藏宽度提示
        this.hideWidthTooltip();

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
            containerWidth: this.containerWidth,
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

            this.updateContainerWidth();

            // 检查保存的设置是否适用于当前窗口大小
            const maxWidth = this.containerWidth * this.maxWidthPercent;

            // 应用保存的宽度（如果合理的话）
            if (settings.leftWidth && settings.leftWidth >= this.minWidth && settings.leftWidth <= maxWidth) {
                this.setPanelWidth(leftPanel, settings.leftWidth);
            }

            if (settings.rightWidth && settings.rightWidth >= this.minWidth && settings.rightWidth <= maxWidth) {
                this.setPanelWidth(rightPanel, settings.rightWidth);
            }

            // 确保面板不会超出容器
            this.adjustPanelsToContainer();
        } catch (e) {
            console.warn('无法加载面板宽度设置:', e);
        }
    }

    // 重置为默认宽度
    resetToDefault() {
        const leftPanel = document.getElementById('connection-options');
        const rightPanel = document.getElementById('serial-tools');

        // 重置样式
        leftPanel.style.width = '';
        leftPanel.style.flexBasis = '';
        leftPanel.style.minWidth = '';
        leftPanel.style.maxWidth = '';

        rightPanel.style.width = '';
        rightPanel.style.flexBasis = '';
        rightPanel.style.minWidth = '';
        rightPanel.style.maxWidth = '';

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

    // 设置面板为指定宽度
    setPanelToWidth(panelId, width) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        const maxWidth = this.containerWidth * this.maxWidthPercent;
        const constrainedWidth = Math.max(this.minWidth, Math.min(maxWidth, width));

        this.setPanelWidth(panel, constrainedWidth);
        this.saveWidthSettings();
    }

    // 获取当前面板宽度
    getPanelWidth(panelId) {
        const panel = document.getElementById(panelId);
        return panel ? panel.offsetWidth : 0;
    }

    // 自动调整面板宽度以适应内容
    autoFitContent(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;

        // 临时移除宽度限制以测量内容
        const originalWidth = panel.style.width;
        panel.style.width = 'auto';

        const contentWidth = panel.scrollWidth;
        const maxWidth = this.containerWidth * this.maxWidthPercent;
        const optimalWidth = Math.max(this.minWidth, Math.min(maxWidth, contentWidth + 20));

        // 恢复并设置最优宽度
        this.setPanelWidth(panel, optimalWidth);
        this.saveWidthSettings();
    }

    // 显示宽度提示
    showWidthTooltip(x, y, width, panelId) {
        let tooltip = document.getElementById('width-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'width-tooltip';
            tooltip.className = 'width-tooltip';
            document.body.appendChild(tooltip);
        }

        const panelName = panelId === 'connection-options' ? '左侧面板' : '右侧面板';
        const percentage = ((width / this.containerWidth) * 100).toFixed(1);

        tooltip.innerHTML = `${panelName}: ${width}px (${percentage}%)`;
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.style.display = 'block';
    }

    // 隐藏宽度提示
    hideWidthTooltip() {
        const tooltip = document.getElementById('width-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    // 平衡面板宽度
    balancePanels() {
        const minMainWidth = 300;
        const availableWidth = this.containerWidth - minMainWidth;
        const balancedWidth = Math.max(this.minWidth, availableWidth / 2);

        this.setPanelToWidth('connection-options', balancedWidth);
        this.setPanelToWidth('serial-tools', balancedWidth);
    }

    // 获取面板状态信息
    getPanelInfo() {
        const leftPanel = document.getElementById('connection-options');
        const rightPanel = document.getElementById('serial-tools');
        const mainPanel = document.getElementById('log-main');

        return {
            container: {
                width: this.containerWidth,
                maxSideWidth: this.containerWidth * this.maxWidthPercent
            },
            left: {
                width: leftPanel.offsetWidth,
                percentage: ((leftPanel.offsetWidth / this.containerWidth) * 100).toFixed(1)
            },
            right: {
                width: rightPanel.offsetWidth,
                percentage: ((rightPanel.offsetWidth / this.containerWidth) * 100).toFixed(1)
            },
            main: {
                width: mainPanel.offsetWidth,
                percentage: ((mainPanel.offsetWidth / this.containerWidth) * 100).toFixed(1)
            }
        };
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function () {
    const resizer = new PanelResizer();

    // 延迟加载保存的宽度设置，确保DOM完全渲染
    setTimeout(() => {
        resizer.loadWidthSettings();
    }, 100);

    // 将resizer实例暴露到全局，方便调试和其他功能使用
    window.panelResizer = resizer;
});

// 添加键盘快捷键支持
document.addEventListener('keydown', function (e) {
    // Ctrl + Shift + R 重置面板宽度
    if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        if (window.panelResizer) {
            window.panelResizer.resetToDefault();
        }
    }

    // Ctrl + Shift + 1 自动调整左侧面板
    if (e.ctrlKey && e.shiftKey && e.key === '1') {
        e.preventDefault();
        if (window.panelResizer) {
            window.panelResizer.autoFitContent('connection-options');
        }
    }

    // Ctrl + Shift + 2 自动调整右侧面板
    if (e.ctrlKey && e.shiftKey && e.key === '2') {
        e.preventDefault();
        if (window.panelResizer) {
            window.panelResizer.autoFitContent('serial-tools');
        }
    }
});