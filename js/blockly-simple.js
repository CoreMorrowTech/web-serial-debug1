/**
 * 简化版积木编程模块 - 用于测试和调试
 */
;(function () {
    'use strict';

    console.log('积木编程模块开始加载...');

    // 简单的积木编程类
    class SimpleBlockly {
        constructor() {
            console.log('SimpleBlockly 构造函数被调用');
            this.init();
        }

        init() {
            console.log('开始初始化积木编程界面...');
            
            // 延迟执行，确保DOM加载完成
            setTimeout(() => {
                this.createUI();
            }, 500);
        }

        createUI() {
            console.log('开始创建积木编程UI...');
            
            try {
                // 查找导航选项卡容器
                const navTabs = document.querySelector('#nav-tab');
                const tabContent = document.getElementById('nav-tabContent');
                
                if (!navTabs || !tabContent) {
                    console.error('导航容器未找到');
                    if (window.addLogErr) {
                        window.addLogErr('❌ 导航容器未找到');
                    }
                    return;
                }

                console.log('找到导航容器，开始创建选项卡...');

                // 创建积木编程选项卡按钮
                const blocklyTab = document.createElement('button');
                blocklyTab.className = 'nav-link';
                blocklyTab.id = 'nav-blockly-tab';
                blocklyTab.setAttribute('data-bs-toggle', 'tab');
                blocklyTab.setAttribute('data-bs-target', '#nav-blockly');
                blocklyTab.setAttribute('type', 'button');
                blocklyTab.setAttribute('role', 'tab');
                blocklyTab.innerHTML = '<i class="bi bi-puzzle"></i> 积木编程';
                navTabs.appendChild(blocklyTab);

                // 创建积木编程内容区域
                const blocklyContent = document.createElement('div');
                blocklyContent.className = 'tab-pane fade';
                blocklyContent.id = 'nav-blockly';
                blocklyContent.setAttribute('role', 'tabpanel');
                blocklyContent.innerHTML = `
                    <div class="p-3">
                        <h5>🧩 积木编程界面</h5>
                        <div class="alert alert-success" role="alert">
                            <h6>✅ 积木编程模块已成功加载！</h6>
                            <p class="mb-0">这是一个简化版本，用于测试积木编程功能是否正常工作。</p>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-4">
                                <div class="card">
                                    <div class="card-header bg-primary text-white">
                                        <h6 class="mb-0">🔧 工具箱</h6>
                                    </div>
                                    <div class="card-body">
                                        <div class="mb-2">
                                            <div class="p-2 bg-success text-white rounded mb-1" style="cursor: pointer;" onclick="addBlock('串口', 'serial')">
                                                📡 打开串口
                                            </div>
                                            <div class="p-2 bg-info text-white rounded mb-1" style="cursor: pointer;" onclick="addBlock('UDP', 'udp')">
                                                🌐 打开UDP
                                            </div>
                                            <div class="p-2 bg-warning text-white rounded mb-1" style="cursor: pointer;" onclick="addBlock('TCP', 'tcp')">
                                                🔌 打开TCP
                                            </div>
                                            <div class="p-2 bg-secondary text-white rounded mb-1" style="cursor: pointer;" onclick="addBlock('等待', 'wait')">
                                                ⏱️ 等待
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="col-md-8">
                                <div class="card">
                                    <div class="card-header bg-light">
                                        <h6 class="mb-0">🎯 工作区</h6>
                                        <small class="text-muted">点击左侧积木添加到工作区</small>
                                    </div>
                                    <div class="card-body" id="workspace" style="min-height: 300px; background-color: #f8f9fa;">
                                        <p class="text-muted text-center">点击左侧积木开始编程...</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="mt-3">
                            <button class="btn btn-primary" onclick="runBlocks()">
                                <i class="bi bi-play"></i> 运行积木
                            </button>
                            <button class="btn btn-secondary" onclick="clearWorkspace()">
                                <i class="bi bi-trash"></i> 清空
                            </button>
                            <button class="btn btn-info" onclick="generateCode()">
                                <i class="bi bi-code"></i> 生成代码
                            </button>
                        </div>
                        
                        <div class="mt-3">
                            <h6>生成的代码：</h6>
                            <pre id="generated-code" class="bg-light p-2 rounded" style="min-height: 100px;">// 生成的代码将显示在这里</pre>
                        </div>
                    </div>
                `;
                
                tabContent.appendChild(blocklyContent);

                // 添加全局函数
                window.addBlock = this.addBlock.bind(this);
                window.runBlocks = this.runBlocks.bind(this);
                window.clearWorkspace = this.clearWorkspace.bind(this);
                window.generateCode = this.generateCode.bind(this);

                console.log('积木编程UI创建成功！');
                
                if (window.addLogErr) {
                    window.addLogErr('✅ 积木编程界面已创建');
                    window.addLogErr('💡 点击"积木编程"选项卡查看界面');
                }

            } catch (error) {
                console.error('创建积木编程UI失败:', error);
                if (window.addLogErr) {
                    window.addLogErr('❌ 创建积木编程UI失败: ' + error.message);
                }
            }
        }

        addBlock(name, type) {
            console.log('添加积木:', name, type);
            const workspace = document.getElementById('workspace');
            if (!workspace) return;

            const blockId = 'block_' + Date.now();
            const blockElement = document.createElement('div');
            blockElement.className = 'p-2 mb-2 border rounded';
            blockElement.id = blockId;
            blockElement.style.backgroundColor = this.getBlockColor(type);
            blockElement.style.color = 'white';
            blockElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <span>${name}</span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-1">
                    <input type="text" class="form-control form-control-sm" placeholder="参数" style="color: black;">
                </div>
            `;

            workspace.appendChild(blockElement);

            // 添加全局删除函数
            window.removeBlock = (id) => {
                const block = document.getElementById(id);
                if (block) block.remove();
            };
        }

        getBlockColor(type) {
            const colors = {
                'serial': '#28a745',
                'udp': '#17a2b8',
                'tcp': '#ffc107',
                'wait': '#6c757d'
            };
            return colors[type] || '#6c757d';
        }

        runBlocks() {
            console.log('运行积木程序');
            if (window.addLogErr) {
                window.addLogErr('🧩 运行积木程序...');
            }
            
            const code = this.generateCode();
            if (code.trim()) {
                if (window.codeExecutor) {
                    window.codeExecutor.executeCode(code);
                } else {
                    if (window.addLogErr) {
                        window.addLogErr('❌ 代码执行器未加载');
                    }
                }
            }
        }

        clearWorkspace() {
            console.log('清空工作区');
            const workspace = document.getElementById('workspace');
            if (workspace) {
                workspace.innerHTML = '<p class="text-muted text-center">点击左侧积木开始编程...</p>';
            }
        }

        generateCode() {
            console.log('生成代码');
            const workspace = document.getElementById('workspace');
            const codeDisplay = document.getElementById('generated-code');
            
            if (!workspace || !codeDisplay) return '';

            const blocks = workspace.querySelectorAll('.border.rounded');
            let code = '// 由积木生成的代码\n';
            
            blocks.forEach(block => {
                const text = block.querySelector('span').textContent;
                const input = block.querySelector('input');
                const param = input ? input.value : '';
                
                switch (text) {
                    case '串口':
                        code += `const com = new COM("${param || 'COM3'}", 115200);\nawait com.Open();\n`;
                        break;
                    case 'UDP':
                        code += `const udp = new UDP("${param || '127.0.0.1'}", 8080, "0.0.0.0", 8081);\nawait udp.Open();\n`;
                        break;
                    case 'TCP':
                        code += `const tcp = new TCP("${param || '127.0.0.1'}", 8080);\nawait tcp.Open();\n`;
                        break;
                    case '等待':
                        code += `await new Promise(resolve => setTimeout(resolve, ${param || '1000'}));\n`;
                        break;
                }
            });

            codeDisplay.textContent = code;
            return code;
        }
    }

    // 初始化
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM加载完成，准备初始化积木编程...');
        
        setTimeout(() => {
            try {
                console.log('开始创建SimpleBlockly实例...');
                window.simpleBlockly = new SimpleBlockly();
                console.log('SimpleBlockly实例创建成功');
            } catch (error) {
                console.error('SimpleBlockly初始化失败:', error);
                if (window.addLogErr) {
                    window.addLogErr('❌ 积木编程初始化失败: ' + error.message);
                }
            }
        }, 2000);
    });

    console.log('积木编程模块脚本加载完成');

})();