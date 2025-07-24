/**
 * 积木编程模块 - 类似Scratch的拖拽式编程界面
 * 支持串口、UDP、TCP操作的积木化编程
 */
;(function () {
    'use strict';

    // 积木编程核心类
    class BlocklyProgramming {
        constructor() {
            this.workspace = null;
            this.toolbox = null;
            this.isVisible = false;
            this.generatedCode = '';
            this.blockDefinitions = {};
            this.init();
        }

        // 初始化积木编程界面
        init() {
            console.log('开始初始化积木编程...');
            this.createBlocklyContainer();
            this.defineBlocks();
            setTimeout(() => {
                this.createToolbox();
                this.initWorkspace();
                this.bindEvents();
            }, 100);
        }

        // 创建积木编程容器
        createBlocklyContainer() {
            const codeTab = document.getElementById('nav-code');
            if (!codeTab) {
                console.error('代码选项卡未找到');
                return;
            }

            // 创建积木编程选项卡按钮
            const navTabs = document.querySelector('#nav-tab');
            if (!navTabs) {
                console.error('导航选项卡容器未找到');
                return;
            }

            const blocklyTabButton = document.createElement('button');
            blocklyTabButton.className = 'nav-link';
            blocklyTabButton.id = 'nav-blockly-tab';
            blocklyTabButton.setAttribute('data-bs-toggle', 'tab');
            blocklyTabButton.setAttribute('data-bs-target', '#nav-blockly');
            blocklyTabButton.setAttribute('type', 'button');
            blocklyTabButton.setAttribute('role', 'tab');
            blocklyTabButton.setAttribute('aria-controls', 'nav-blockly');
            blocklyTabButton.setAttribute('aria-selected', 'false');
            blocklyTabButton.innerHTML = '<i class="bi bi-puzzle"></i> 积木编程';
            navTabs.appendChild(blocklyTabButton);

            // 创建积木编程内容区域
            const tabContent = document.getElementById('nav-tabContent');
            if (!tabContent) {
                console.error('选项卡内容容器未找到');
                return;
            }

            const blocklyTabPane = document.createElement('div');
            blocklyTabPane.className = 'tab-pane fade d-flex flex-column';
            blocklyTabPane.id = 'nav-blockly';
            blocklyTabPane.setAttribute('role', 'tabpanel');
            blocklyTabPane.setAttribute('aria-labelledby', 'nav-blockly-tab');
            
            blocklyTabPane.innerHTML = `
                <div class="d-flex flex-column h-100">
                    <!-- 积木编程工具栏 -->
                    <div class="blockly-toolbar mb-2">
                        <div class="btn-group btn-group-sm" role="group">
                            <button type="button" class="btn btn-outline-primary" id="blockly-run">
                                <i class="bi bi-play"></i> 运行积木
                            </button>
                            <button type="button" class="btn btn-outline-secondary" id="blockly-clear">
                                <i class="bi bi-trash"></i> 清空
                            </button>
                            <button type="button" class="btn btn-outline-info" id="blockly-to-code">
                                <i class="bi bi-code"></i> 转换为代码
                            </button>
                        </div>
                        <div class="btn-group btn-group-sm ms-2" role="group">
                            <button type="button" class="btn btn-outline-success" id="blockly-save">
                                <i class="bi bi-save"></i> 保存积木
                            </button>
                            <button type="button" class="btn btn-outline-warning" id="blockly-load">
                                <i class="bi bi-folder-open"></i> 加载积木
                            </button>
                        </div>
                    </div>
                    
                    <!-- 积木编程主界面 -->
                    <div class="blockly-container flex-grow-1">
                        <!-- 工具箱 -->
                        <div class="blockly-toolbox" id="blockly-toolbox">
                            <div class="toolbox-header bg-primary text-white p-2">
                                <h6 class="mb-0"><i class="bi bi-tools"></i> 积木工具箱</h6>
                            </div>
                            <div class="toolbox-content" id="toolbox-content">
                                <div class="text-center p-3">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">加载中...</span>
                                    </div>
                                    <p class="mt-2">正在加载积木...</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 工作区 -->
                        <div class="blockly-workspace" id="blockly-workspace">
                            <div class="workspace-header bg-light p-2 border-bottom">
                                <h6 class="mb-0"><i class="bi bi-grid-3x3-gap"></i> 积木工作区</h6>
                                <small class="text-muted">拖拽左侧积木到此处进行编程</small>
                            </div>
                            <div class="workspace-content" id="workspace-content">
                                <!-- 积木工作区内容 -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            tabContent.appendChild(blocklyTabPane);
            console.log('积木编程容器已创建');
        }

        // 定义积木块
        defineBlocks() {
            // 串口操作积木
            this.blockDefinitions.serial = {
                category: '串口操作',
                color: '#4CAF50',
                blocks: [
                    {
                        type: 'serial_open',
                        message: '打开串口 端口: %1 波特率: %2',
                        args: [
                            { type: 'field_input', name: 'PORT', text: 'COM3' },
                            { type: 'field_number', name: 'BAUDRATE', value: 115200 }
                        ],
                        tooltip: '打开指定的串口连接',
                        code: 'const com = new COM("%1", %2);\nawait com.Open();\n'
                    },
                    {
                        type: 'serial_close',
                        message: '关闭串口',
                        args: [],
                        tooltip: '关闭当前串口连接',
                        code: 'await com.Close();\n'
                    },
                    {
                        type: 'serial_send_text',
                        message: '串口发送文本: %1',
                        args: [
                            { type: 'field_input', name: 'TEXT', text: 'Hello' }
                        ],
                        tooltip: '通过串口发送文本数据',
                        code: 'await com.SendData("%1");\n'
                    }
                ]
            };

            // UDP操作积木
            this.blockDefinitions.udp = {
                category: 'UDP操作',
                color: '#2196F3',
                blocks: [
                    {
                        type: 'udp_open',
                        message: '打开UDP 远程IP: %1 远程端口: %2 本地IP: %3 本地端口: %4',
                        args: [
                            { type: 'field_input', name: 'REMOTE_IP', text: '127.0.0.1' },
                            { type: 'field_number', name: 'REMOTE_PORT', value: 8080 },
                            { type: 'field_input', name: 'LOCAL_IP', text: '0.0.0.0' },
                            { type: 'field_number', name: 'LOCAL_PORT', value: 8081 }
                        ],
                        tooltip: '打开UDP连接',
                        code: 'const udp = new UDP("%1", %2, "%3", %4);\nawait udp.Open();\n'
                    },
                    {
                        type: 'udp_close',
                        message: '关闭UDP',
                        args: [],
                        tooltip: '关闭UDP连接',
                        code: 'udp.Close();\n'
                    },
                    {
                        type: 'udp_send',
                        message: 'UDP发送数据: %1',
                        args: [
                            { type: 'field_input', name: 'DATA', text: 'Hello UDP' }
                        ],
                        tooltip: '通过UDP发送数据',
                        code: 'await udp.SendData("%1");\n'
                    }
                ]
            };

            // TCP操作积木
            this.blockDefinitions.tcp = {
                category: 'TCP操作',
                color: '#FF9800',
                blocks: [
                    {
                        type: 'tcp_open',
                        message: '打开TCP 远程IP: %1 远程端口: %2',
                        args: [
                            { type: 'field_input', name: 'REMOTE_IP', text: '127.0.0.1' },
                            { type: 'field_number', name: 'REMOTE_PORT', value: 8080 }
                        ],
                        tooltip: '打开TCP连接',
                        code: 'const tcp = new TCP("%1", %2);\nawait tcp.Open();\n'
                    },
                    {
                        type: 'tcp_close',
                        message: '关闭TCP',
                        args: [],
                        tooltip: '关闭TCP连接',
                        code: 'tcp.Close();\n'
                    },
                    {
                        type: 'tcp_send',
                        message: 'TCP发送数据: %1',
                        args: [
                            { type: 'field_input', name: 'DATA', text: 'Hello TCP' }
                        ],
                        tooltip: '通过TCP发送数据',
                        code: 'await tcp.SendData("%1");\n'
                    }
                ]
            };

            // 控制流积木
            this.blockDefinitions.control = {
                category: '控制流',
                color: '#9C27B0',
                blocks: [
                    {
                        type: 'wait',
                        message: '等待 %1 毫秒',
                        args: [
                            { type: 'field_number', name: 'TIME', value: 1000 }
                        ],
                        tooltip: '暂停执行指定的毫秒数',
                        code: 'await new Promise(resolve => setTimeout(resolve, %1));\n'
                    },
                    {
                        type: 'log',
                        message: '输出日志: %1',
                        args: [
                            { type: 'field_input', name: 'MESSAGE', text: 'Hello World' }
                        ],
                        tooltip: '在控制台输出日志信息',
                        code: 'console.log("%1");\n'
                    }
                ]
            };

            console.log('积木定义已完成');
        }

        // 创建工具箱
        createToolbox() {
            const toolboxContent = document.getElementById('toolbox-content');
            if (!toolboxContent) {
                console.error('工具箱容器未找到');
                if (window.addLogErr) {
                    window.addLogErr('❌ 工具箱容器未找到');
                }
                return;
            }

            toolboxContent.innerHTML = '';

            Object.keys(this.blockDefinitions).forEach(categoryKey => {
                const category = this.blockDefinitions[categoryKey];
                
                // 创建分类标题
                const categoryHeader = document.createElement('div');
                categoryHeader.className = 'toolbox-category';
                categoryHeader.innerHTML = `
                    <div class="category-header p-2 border-bottom" style="background-color: ${category.color}20; border-left: 4px solid ${category.color};">
                        <strong>${category.category}</strong>
                        <i class="bi bi-chevron-down float-end category-toggle"></i>
                    </div>
                    <div class="category-blocks" style="display: block;">
                        ${category.blocks.map(block => this.createBlockHTML(block, category.color)).join('')}
                    </div>
                `;
                
                toolboxContent.appendChild(categoryHeader);

                // 添加分类折叠功能
                const header = categoryHeader.querySelector('.category-header');
                const blocks = categoryHeader.querySelector('.category-blocks');
                const toggle = categoryHeader.querySelector('.category-toggle');
                
                header.addEventListener('click', () => {
                    const isVisible = blocks.style.display !== 'none';
                    blocks.style.display = isVisible ? 'none' : 'block';
                    toggle.classList.toggle('bi-chevron-down', !isVisible);
                    toggle.classList.toggle('bi-chevron-right', isVisible);
                });
            });

            console.log('工具箱已创建');
            if (window.addLogErr) {
                window.addLogErr('✅ 积木工具箱已创建');
            }
        }

        // 创建积木HTML
        createBlockHTML(block, color) {
            return `
                <div class="toolbox-block p-2 m-1 border rounded" 
                     style="background-color: ${color}; color: white; cursor: grab;"
                     data-block-type="${block.type}"
                     draggable="true"
                     title="${block.tooltip}">
                    <small>${block.message.replace(/%\d+/g, '___')}</small>
                </div>
            `;
        }

        // 初始化工作区
        initWorkspace() {
            const workspaceContent = document.getElementById('workspace-content');
            if (!workspaceContent) {
                console.error('工作区容器未找到');
                return;
            }

            // 添加拖拽支持
            this.setupDragAndDrop();
            console.log('工作区已初始化');
        }

        // 设置拖拽功能
        setupDragAndDrop() {
            const toolboxContent = document.getElementById('toolbox-content');
            const workspaceContent = document.getElementById('workspace-content');

            if (!toolboxContent || !workspaceContent) {
                console.error('拖拽设置失败：容器未找到');
                return;
            }

            // 工具箱积木拖拽开始
            toolboxContent.addEventListener('dragstart', (e) => {
                if (e.target.classList.contains('toolbox-block')) {
                    e.dataTransfer.setData('text/plain', e.target.dataset.blockType);
                    e.dataTransfer.effectAllowed = 'copy';
                }
            });

            // 工作区接受拖拽
            workspaceContent.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
            });

            workspaceContent.addEventListener('drop', (e) => {
                e.preventDefault();
                const blockType = e.dataTransfer.getData('text/plain');
                if (blockType) {
                    this.createWorkspaceBlock(blockType, e.offsetX, e.offsetY);
                }
            });

            console.log('拖拽功能已设置');
        }

        // 在工作区创建积木
        createWorkspaceBlock(blockType, x, y) {
            const workspaceContent = document.getElementById('workspace-content');
            if (!workspaceContent) return;

            // 查找积木定义
            let blockDef = null;
            let categoryColor = '#666';

            Object.keys(this.blockDefinitions).forEach(categoryKey => {
                const category = this.blockDefinitions[categoryKey];
                const found = category.blocks.find(b => b.type === blockType);
                if (found) {
                    blockDef = found;
                    categoryColor = category.color;
                }
            });

            if (!blockDef) return;

            // 创建工作区积木元素
            const workspaceBlock = document.createElement('div');
            workspaceBlock.className = 'workspace-block position-absolute border rounded p-2';
            workspaceBlock.style.left = x + 'px';
            workspaceBlock.style.top = y + 'px';
            workspaceBlock.style.backgroundColor = categoryColor;
            workspaceBlock.style.color = 'white';
            workspaceBlock.style.cursor = 'move';
            workspaceBlock.style.minWidth = '200px';
            workspaceBlock.dataset.blockType = blockType;

            // 创建积木内容
            let blockHTML = `
                <div class="block-header d-flex justify-content-between align-items-center">
                    <span class="block-title">${blockDef.message.replace(/%\d+/g, (match) => {
                        const argIndex = parseInt(match.substring(1)) - 1;
                        const arg = blockDef.args[argIndex];
                        if (arg) {
                            if (arg.type === 'field_input') {
                                return `<input type="text" class="form-control form-control-sm d-inline-block" style="width: 80px; color: black;" value="${arg.text || ''}" data-arg="${argIndex}">`;
                            } else if (arg.type === 'field_number') {
                                return `<input type="number" class="form-control form-control-sm d-inline-block" style="width: 60px; color: black;" value="${arg.value || 0}" data-arg="${argIndex}">`;
                            }
                        }
                        return '___';
                    })}</span>
                    <button class="btn btn-sm btn-outline-light delete-block" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;

            workspaceBlock.innerHTML = blockHTML;
            workspaceContent.appendChild(workspaceBlock);

            // 添加拖拽移动功能
            this.makeBlockDraggable(workspaceBlock);

            // 添加删除功能
            const deleteBtn = workspaceBlock.querySelector('.delete-block');
            deleteBtn.addEventListener('click', () => {
                workspaceBlock.remove();
            });

            return workspaceBlock;
        }

        // 使积木可拖拽移动
        makeBlockDraggable(block) {
            let isDragging = false;
            let startX, startY, initialX, initialY;

            block.addEventListener('mousedown', (e) => {
                if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON' || e.target.tagName === 'I') {
                    return;
                }
                
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                initialX = parseInt(block.style.left) || 0;
                initialY = parseInt(block.style.top) || 0;
                
                block.style.zIndex = '1000';
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                block.style.left = (initialX + deltaX) + 'px';
                block.style.top = (initialY + deltaY) + 'px';
            });

            document.addEventListener('mouseup', () => {
                if (isDragging) {
                    isDragging = false;
                    block.style.zIndex = 'auto';
                }
            });
        }

        // 绑定事件
        bindEvents() {
            // 运行积木代码
            const runBtn = document.getElementById('blockly-run');
            if (runBtn) {
                runBtn.addEventListener('click', () => {
                    this.runBlocks();
                });
            }

            // 清空工作区
            const clearBtn = document.getElementById('blockly-clear');
            if (clearBtn) {
                clearBtn.addEventListener('click', () => {
                    this.clearWorkspace();
                });
            }

            // 转换为代码
            const toCodeBtn = document.getElementById('blockly-to-code');
            if (toCodeBtn) {
                toCodeBtn.addEventListener('click', () => {
                    this.convertToCode();
                });
            }

            // 保存积木
            const saveBtn = document.getElementById('blockly-save');
            if (saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.saveBlocks();
                });
            }

            // 加载积木
            const loadBtn = document.getElementById('blockly-load');
            if (loadBtn) {
                loadBtn.addEventListener('click', () => {
                    this.loadBlocks();
                });
            }

            console.log('事件绑定已完成');
        }

        // 运行积木代码
        async runBlocks() {
            try {
                const code = this.generateCodeFromBlocks();
                if (!code.trim()) {
                    if (window.addLogErr) {
                        window.addLogErr('⚠️ 工作区没有积木，无法运行');
                    }
                    return;
                }

                if (window.addLogErr) {
                    window.addLogErr('🧩 开始运行积木程序...');
                }

                // 使用API执行器运行代码
                if (window.codeExecutor) {
                    await window.codeExecutor.executeCode(code);
                } else {
                    if (window.addLogErr) {
                        window.addLogErr('❌ 代码执行器未加载');
                    }
                }
            } catch (error) {
                if (window.addLogErr) {
                    window.addLogErr(`❌ 积木运行错误: ${error.message}`);
                }
            }
        }

        // 从积木生成代码
        generateCodeFromBlocks() {
            const workspaceContent = document.getElementById('workspace-content');
            if (!workspaceContent) return '';

            const blocks = workspaceContent.querySelectorAll('.workspace-block');
            let code = '';

            blocks.forEach(block => {
                const blockType = block.dataset.blockType;
                let blockDef = null;

                // 查找积木定义
                Object.keys(this.blockDefinitions).forEach(categoryKey => {
                    const category = this.blockDefinitions[categoryKey];
                    const found = category.blocks.find(b => b.type === blockType);
                    if (found) {
                        blockDef = found;
                    }
                });

                if (blockDef) {
                    let blockCode = blockDef.code;
                    
                    // 替换参数
                    const inputs = block.querySelectorAll('input');
                    inputs.forEach((input, index) => {
                        const value = input.type === 'number' ? input.value : input.value;
                        blockCode = blockCode.replace(`%${index + 1}`, value);
                    });

                    code += blockCode;
                }
            });

            this.generatedCode = code;
            return code;
        }

        // 清空工作区
        clearWorkspace() {
            const workspaceContent = document.getElementById('workspace-content');
            if (workspaceContent) {
                const blocks = workspaceContent.querySelectorAll('.workspace-block');
                blocks.forEach(block => block.remove());
            }
        }

        // 转换为代码
        convertToCode() {
            const code = this.generateCodeFromBlocks();
            
            // 切换到代码编辑器选项卡
            const codeTab = document.getElementById('nav-code-tab');
            if (codeTab) {
                codeTab.click();
            }

            // 将代码设置到编辑器中
            setTimeout(() => {
                if (window.editor) {
                    window.editor.setValue(code);
                    if (window.addLogErr) {
                        window.addLogErr('✅ 积木已转换为代码');
                    }
                }
            }, 100);
        }

        // 保存积木
        saveBlocks() {
            const workspaceContent = document.getElementById('workspace-content');
            if (!workspaceContent) return;

            const blocks = [];
            const workspaceBlocks = workspaceContent.querySelectorAll('.workspace-block');
            
            workspaceBlocks.forEach(block => {
                const blockData = {
                    type: block.dataset.blockType,
                    x: parseInt(block.style.left) || 0,
                    y: parseInt(block.style.top) || 0,
                    inputs: []
                };

                const inputs = block.querySelectorAll('input');
                inputs.forEach(input => {
                    blockData.inputs.push({
                        type: input.type,
                        value: input.value
                    });
                });

                blocks.push(blockData);
            });

            const data = JSON.stringify(blocks, null, 2);
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'blocks.json';
            a.click();
            
            URL.revokeObjectURL(url);
            
            if (window.addLogErr) {
                window.addLogErr('💾 积木已保存');
            }
        }

        // 加载积木
        loadBlocks() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const blocks = JSON.parse(e.target.result);
                        this.clearWorkspace();
                        
                        blocks.forEach(blockData => {
                            const block = this.createWorkspaceBlock(blockData.type, blockData.x, blockData.y);
                            if (block && blockData.inputs) {
                                const inputs = block.querySelectorAll('input');
                                inputs.forEach((input, index) => {
                                    if (blockData.inputs[index]) {
                                        input.value = blockData.inputs[index].value;
                                    }
                                });
                            }
                        });
                        
                        if (window.addLogErr) {
                            window.addLogErr('📂 积木已加载');
                        }
                    } catch (error) {
                        if (window.addLogErr) {
                            window.addLogErr(`❌ 加载积木失败: ${error.message}`);
                        }
                    }
                };
                reader.readAsText(file);
            });
            
            input.click();
        }

        // 解析代码转换为积木
        parseCodeToBlocks(code) {
            if (!code || !code.trim()) {
                if (window.addLogErr) {
                    window.addLogErr('⚠️ 代码为空，无法转换为积木');
                }
                return;
            }

            this.clearWorkspace();
            
            // 简单的代码解析规则
            const lines = code.split('\n').filter(line => line.trim());
            let yOffset = 20;
            let blockCount = 0;

            lines.forEach((line, index) => {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine.startsWith('//') || trimmedLine.startsWith('/*')) {
                    return; // 跳过空行和注释
                }

                let blockType = null;
                let inputs = [];

                // 解析不同类型的代码行
                if (trimmedLine.includes('new COM(')) {
                    blockType = 'serial_open';
                    const match = trimmedLine.match(/new COM\("([^"]*)",\s*(\d+)/);
                    if (match) {
                        inputs = [match[1], match[2]];
                    }
                } else if (trimmedLine.includes('com.Close()') || trimmedLine.includes('await com.Close()')) {
                    blockType = 'serial_close';
                } else if (trimmedLine.includes('com.SendData(') && trimmedLine.includes('"')) {
                    blockType = 'serial_send_text';
                    const match = trimmedLine.match(/SendData\("([^"]*)"/);
                    if (match) {
                        inputs = [match[1]];
                    }
                } else if (trimmedLine.includes('new UDP(')) {
                    blockType = 'udp_open';
                    const match = trimmedLine.match(/new UDP\("([^"]*)",\s*(\d+),\s*"([^"]*)",\s*(\d+)/);
                    if (match) {
                        inputs = [match[1], match[2], match[3], match[4]];
                    }
                } else if (trimmedLine.includes('udp.Close()')) {
                    blockType = 'udp_close';
                } else if (trimmedLine.includes('udp.SendData(') && trimmedLine.includes('"')) {
                    blockType = 'udp_send';
                    const match = trimmedLine.match(/SendData\("([^"]*)"/);
                    if (match) {
                        inputs = [match[1]];
                    }
                } else if (trimmedLine.includes('new TCP(')) {
                    blockType = 'tcp_open';
                    const match = trimmedLine.match(/new TCP\("([^"]*)",\s*(\d+)/);
                    if (match) {
                        inputs = [match[1], match[2]];
                    }
                } else if (trimmedLine.includes('tcp.Close()')) {
                    blockType = 'tcp_close';
                } else if (trimmedLine.includes('tcp.SendData(') && trimmedLine.includes('"')) {
                    blockType = 'tcp_send';
                    const match = trimmedLine.match(/SendData\("([^"]*)"/);
                    if (match) {
                        inputs = [match[1]];
                    }
                } else if (trimmedLine.includes('setTimeout') || trimmedLine.includes('new Promise')) {
                    blockType = 'wait';
                    const match = trimmedLine.match(/(\d+)/);
                    if (match) {
                        inputs = [match[1]];
                    }
                } else if (trimmedLine.includes('console.log(')) {
                    blockType = 'log';
                    const match = trimmedLine.match(/console\.log\("([^"]*)"/);
                    if (match) {
                        inputs = [match[1]];
                    }
                }

                // 创建积木
                if (blockType) {
                    const block = this.createWorkspaceBlock(blockType, 20, yOffset);
                    if (block && inputs.length > 0) {
                        const inputElements = block.querySelectorAll('input');
                        inputs.forEach((value, inputIndex) => {
                            if (inputElements[inputIndex]) {
                                inputElements[inputIndex].value = value;
                            }
                        });
                    }
                    yOffset += 80;
                    blockCount++;
                }
            });

            if (blockCount > 0) {
                if (window.addLogErr) {
                    window.addLogErr(`✅ 成功转换 ${blockCount} 个积木`);
                }
            } else {
                if (window.addLogErr) {
                    window.addLogErr('⚠️ 未识别到可转换的代码模式');
                    window.addLogErr('💡 支持的代码模式：COM/UDP/TCP操作、等待、日志输出等');
                }
            }
        }
    }

    // 初始化积木编程
    document.addEventListener('DOMContentLoaded', () => {
        // 等待一段时间确保其他模块加载完成
        setTimeout(() => {
            try {
                window.blocklyProgramming = new BlocklyProgramming();
                
                if (window.addLogErr) {
                    window.addLogErr('🧩 积木编程模块已加载');
                    window.addLogErr('💡 点击"积木编程"选项卡开始使用');
                }
            } catch (error) {
                console.error('积木编程初始化失败:', error);
                if (window.addLogErr) {
                    window.addLogErr('❌ 积木编程初始化失败: ' + error.message);
                }
            }
        }, 1500);
    });

})();