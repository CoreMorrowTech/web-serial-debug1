/**
 * 积木编程功能函数
 */

// 积木计数器
let blockCounter = 0;

// 添加积木到工作区
function addBlock(name, type) {
    console.log('添加积木:', name, type);

    const workspace = document.getElementById('blockly-workspace');
    if (!workspace) {
        console.error('工作区未找到');
        return;
    }

    // 清除提示文本
    const hint = workspace.querySelector('p.text-muted');
    if (hint) {
        hint.remove();
    }

    blockCounter++;
    const blockId = 'block_' + blockCounter;

    // 创建积木元素
    const blockElement = document.createElement('div');
    blockElement.className = 'block-item mb-2 p-2 border rounded position-relative';
    blockElement.id = blockId;
    blockElement.style.backgroundColor = getBlockColor(type);
    blockElement.style.color = getBlockTextColor(type);
    blockElement.style.cursor = 'move';

    // 根据积木类型创建不同的内容
    let blockContent = '';
    switch (type) {
        case 'serial_open':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>📡 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <div class="row">
                        <div class="col-6">
                            <label class="form-label text-white small">端口:</label>
                            <input type="text" class="form-control form-control-sm" value="COM3" data-param="port">
                        </div>
                        <div class="col-6">
                            <label class="form-label text-white small">波特率:</label>
                            <input type="number" class="form-control form-control-sm" value="115200" data-param="baudrate">
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'serial_close':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>📡 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;
            break;

        case 'serial_send':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>📡 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <label class="form-label text-white small">发送内容:</label>
                    <input type="text" class="form-control form-control-sm" placeholder="要发送的文本" data-param="data">
                </div>
            `;
            break;

        case 'udp_open':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>🌐 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <div class="row">
                        <div class="col-6">
                            <label class="form-label text-white small">远程IP:</label>
                            <input type="text" class="form-control form-control-sm" value="127.0.0.1" data-param="remoteip">
                        </div>
                        <div class="col-6">
                            <label class="form-label text-white small">远程端口:</label>
                            <input type="number" class="form-control form-control-sm" value="8080" data-param="remoteport">
                        </div>
                    </div>
                    <div class="row mt-1">
                        <div class="col-6">
                            <label class="form-label text-white small">本地IP:</label>
                            <input type="text" class="form-control form-control-sm" value="0.0.0.0" data-param="localip">
                        </div>
                        <div class="col-6">
                            <label class="form-label text-white small">本地端口:</label>
                            <input type="number" class="form-control form-control-sm" value="8081" data-param="localport">
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'udp_close':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>🌐 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;
            break;

        case 'udp_send':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>🌐 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <label class="form-label text-white small">发送内容:</label>
                    <input type="text" class="form-control form-control-sm" placeholder="要发送的数据" data-param="data">
                </div>
            `;
            break;

        case 'tcp_open':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>🔌 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <div class="row">
                        <div class="col-6">
                            <label class="form-label text-dark small">远程IP:</label>
                            <input type="text" class="form-control form-control-sm" value="127.0.0.1" data-param="remoteip">
                        </div>
                        <div class="col-6">
                            <label class="form-label text-dark small">远程端口:</label>
                            <input type="number" class="form-control form-control-sm" value="8080" data-param="remoteport">
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'tcp_close':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>🔌 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;
            break;

        case 'tcp_send':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>🔌 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <label class="form-label text-dark small">发送内容:</label>
                    <input type="text" class="form-control form-control-sm" placeholder="要发送的数据" data-param="data">
                </div>
            `;
            break;

        case 'wait':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>⏱️ ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <label class="form-label text-white small">等待时间(毫秒):</label>
                    <input type="number" class="form-control form-control-sm" value="1000" data-param="time">
                </div>
            `;
            break;

        case 'serial_receive':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>📡 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <label class="form-label text-white small">接收处理:</label>
                    <select class="form-control form-control-sm" data-param="action">
                        <option value="log">记录到日志</option>
                        <option value="echo">原样回复</option>
                        <option value="custom">自定义处理</option>
                    </select>
                    <div class="mt-1" id="custom-handler-${blockId}" style="display: none;">
                        <label class="form-label text-white small">自定义回复:</label>
                        <input type="text" class="form-control form-control-sm" placeholder="回复内容" data-param="customReply">
                    </div>
                    <div class="mt-2">
                        <div class="row">
                            <div class="col-6">
                                <label class="form-label text-white small">监听模式:</label>
                                <select class="form-control form-control-sm" data-param="listenMode">
                                    <option value="continuous">持续监听</option>
                                    <option value="once">监听一次</option>
                                    <option value="timed">定时监听</option>
                                </select>
                            </div>
                            <div class="col-6" id="timeout-setting-${blockId}" style="display: none;">
                                <label class="form-label text-white small">超时时间(秒):</label>
                                <input type="number" class="form-control form-control-sm" value="30" data-param="timeout" min="1" max="3600">
                            </div>
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <label class="form-label text-white small mb-0">监听状态:</label>
                            <div>
                                <button class="btn btn-sm btn-success" onclick="startListening('${blockId}')" id="start-btn-${blockId}">
                                    <i class="bi bi-play"></i> 开始
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="stopListening('${blockId}')" id="stop-btn-${blockId}" style="display: none;">
                                    <i class="bi bi-stop"></i> 停止
                                </button>
                            </div>
                        </div>
                        <div id="listen-status-${blockId}" class="small text-muted mt-1">未开始监听</div>
                    </div>
                    <div class="mt-2">
                        <label class="form-label text-white small">最近接收:</label>
                        <div id="receive-display-${blockId}" class="bg-dark text-light p-2 rounded small" style="min-height: 40px; max-height: 80px; overflow-y: auto; font-family: monospace;">
                            <span class="text-muted">等待数据...</span>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'udp_receive':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>🌐 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <label class="form-label text-white small">接收处理:</label>
                    <select class="form-control form-control-sm" data-param="action">
                        <option value="log">记录到日志</option>
                        <option value="echo">原样回复</option>
                        <option value="custom">自定义处理</option>
                    </select>
                    <div class="mt-1" id="custom-handler-${blockId}" style="display: none;">
                        <label class="form-label text-white small">自定义回复:</label>
                        <input type="text" class="form-control form-control-sm" placeholder="回复内容" data-param="customReply">
                    </div>
                    <div class="mt-2">
                        <div class="row">
                            <div class="col-6">
                                <label class="form-label text-white small">监听模式:</label>
                                <select class="form-control form-control-sm" data-param="listenMode">
                                    <option value="continuous">持续监听</option>
                                    <option value="once">监听一次</option>
                                    <option value="timed">定时监听</option>
                                </select>
                            </div>
                            <div class="col-6" id="timeout-setting-${blockId}" style="display: none;">
                                <label class="form-label text-white small">超时时间(秒):</label>
                                <input type="number" class="form-control form-control-sm" value="30" data-param="timeout" min="1" max="3600">
                            </div>
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <label class="form-label text-white small mb-0">监听状态:</label>
                            <div>
                                <button class="btn btn-sm btn-success" onclick="startListening('${blockId}')" id="start-btn-${blockId}">
                                    <i class="bi bi-play"></i> 开始
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="stopListening('${blockId}')" id="stop-btn-${blockId}" style="display: none;">
                                    <i class="bi bi-stop"></i> 停止
                                </button>
                            </div>
                        </div>
                        <div id="listen-status-${blockId}" class="small text-muted mt-1">未开始监听</div>
                    </div>
                    <div class="mt-2">
                        <label class="form-label text-white small">最近接收:</label>
                        <div id="receive-display-${blockId}" class="bg-dark text-light p-2 rounded small" style="min-height: 40px; max-height: 80px; overflow-y: auto; font-family: monospace;">
                            <span class="text-muted">等待数据...</span>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'tcp_receive':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>🔌 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <label class="form-label text-dark small">接收处理:</label>
                    <select class="form-control form-control-sm" data-param="action">
                        <option value="log">记录到日志</option>
                        <option value="echo">原样回复</option>
                        <option value="custom">自定义处理</option>
                    </select>
                    <div class="mt-1" id="custom-handler-${blockId}" style="display: none;">
                        <label class="form-label text-dark small">自定义回复:</label>
                        <input type="text" class="form-control form-control-sm" placeholder="回复内容" data-param="customReply">
                    </div>
                    <div class="mt-2">
                        <div class="row">
                            <div class="col-6">
                                <label class="form-label text-dark small">监听模式:</label>
                                <select class="form-control form-control-sm" data-param="listenMode">
                                    <option value="continuous">持续监听</option>
                                    <option value="once">监听一次</option>
                                    <option value="timed">定时监听</option>
                                </select>
                            </div>
                            <div class="col-6" id="timeout-setting-${blockId}" style="display: none;">
                                <label class="form-label text-dark small">超时时间(秒):</label>
                                <input type="number" class="form-control form-control-sm" value="30" data-param="timeout" min="1" max="3600">
                            </div>
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="d-flex justify-content-between align-items-center">
                            <label class="form-label text-dark small mb-0">监听状态:</label>
                            <div>
                                <button class="btn btn-sm btn-success" onclick="startListening('${blockId}')" id="start-btn-${blockId}">
                                    <i class="bi bi-play"></i> 开始
                                </button>
                                <button class="btn btn-sm btn-danger" onclick="stopListening('${blockId}')" id="stop-btn-${blockId}" style="display: none;">
                                    <i class="bi bi-stop"></i> 停止
                                </button>
                            </div>
                        </div>
                        <div id="listen-status-${blockId}" class="small text-muted mt-1">未开始监听</div>
                    </div>
                    <div class="mt-2">
                        <label class="form-label text-dark small">最近接收:</label>
                        <div id="receive-display-${blockId}" class="bg-dark text-light p-2 rounded small" style="min-height: 40px; max-height: 80px; overflow-y: auto; font-family: monospace;">
                            <span class="text-muted">等待数据...</span>
                        </div>
                    </div>
                </div>
            `;
            break;

        case 'log':
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>📝 ${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
                <div class="mt-2">
                    <label class="form-label text-white small">日志内容:</label>
                    <input type="text" class="form-control form-control-sm" placeholder="要输出的日志" data-param="message">
                </div>
            `;
            break;

        default:
            blockContent = `
                <div class="d-flex justify-content-between align-items-center">
                    <span><strong>${name}</strong></span>
                    <button class="btn btn-sm btn-outline-light" onclick="removeBlock('${blockId}')" title="删除积木">
                        <i class="bi bi-x"></i>
                    </button>
                </div>
            `;
    }

    blockElement.innerHTML = blockContent;
    blockElement.dataset.blockType = type;
    workspace.appendChild(blockElement);

    // 为接收积木添加下拉选择事件监听器
    if (type.includes('_receive')) {
        const selectElement = blockElement.querySelector('select[data-param="action"]');
        const customHandler = blockElement.querySelector(`#custom-handler-${blockId}`);

        if (selectElement && customHandler) {
            selectElement.addEventListener('change', function () {
                if (this.value === 'custom') {
                    customHandler.style.display = 'block';
                } else {
                    customHandler.style.display = 'none';
                }
            });
        }
    }

    // 添加日志
    if (window.addLogErr) {
        window.addLogErr(`✅ 已添加积木: ${name}`);
    }

    console.log('积木已添加:', blockId, type);
}

// 删除积木
function removeBlock(blockId) {
    const block = document.getElementById(blockId);
    if (block) {
        block.remove();
        console.log('积木已删除:', blockId);

        // 检查工作区是否为空
        const workspace = document.getElementById('blockly-workspace');
        const blocks = workspace.querySelectorAll('.block-item');
        if (blocks.length === 0) {
            workspace.innerHTML = '<p class="text-muted text-center">点击左侧积木开始编程...</p>';
        }
    }
}

// 获取积木颜色
function getBlockColor(type) {
    const colors = {
        'serial_open': '#28a745',
        'serial_close': '#28a745',
        'serial_send': '#28a745',
        'serial_receive': '#198754',
        'udp_open': '#17a2b8',
        'udp_close': '#17a2b8',
        'udp_send': '#17a2b8',
        'udp_receive': '#0d6efd',
        'tcp_open': '#ffc107',
        'tcp_close': '#ffc107',
        'tcp_send': '#ffc107',
        'tcp_receive': '#fd7e14',
        'wait': '#6c757d',
        'log': '#6c757d'
    };
    return colors[type] || '#6c757d';
}

// 获取积木文字颜色
function getBlockTextColor(type) {
    const textColors = {
        'tcp_open': '#000',
        'tcp_close': '#000',
        'tcp_send': '#000',
        'tcp_receive': '#000'
    };
    return textColors[type] || '#fff';
}

// 清空工作区
function clearWorkspace() {
    const workspace = document.getElementById('blockly-workspace');
    if (workspace) {
        workspace.innerHTML = '<p class="text-muted text-center">点击左侧积木开始编程...</p>';
        blockCounter = 0;

        // 清空代码显示区
        const codeDisplay = document.getElementById('generated-code');
        if (codeDisplay) {
            codeDisplay.textContent = '// 生成的代码将显示在这里\n// 点击左侧积木开始编程，然后点击"生成代码"按钮查看结果';
        }

        if (window.addLogErr) {
            window.addLogErr('🗑️ 工作区已清空');
        }

        console.log('工作区已清空');
    }
}

// 生成代码
function generateCode() {
    const workspace = document.getElementById('blockly-workspace');
    const codeDisplay = document.getElementById('generated-code');

    if (!workspace || !codeDisplay) {
        console.error('工作区或代码显示区未找到');
        return '';
    }

    const blocks = workspace.querySelectorAll('.block-item');
    let code = '// 由积木生成的代码\n';

    if (blocks.length === 0) {
        code += '// 工作区为空，请添加积木\n';
        codeDisplay.textContent = code;
        return code;
    }

    blocks.forEach((block, index) => {
        const blockType = block.dataset.blockType;
        const inputs = block.querySelectorAll('input[data-param]');

        // 获取参数值
        const params = {};
        inputs.forEach(input => {
            const paramName = input.dataset.param;
            params[paramName] = input.value || input.placeholder || '';
        });

        // 获取select元素的值
        const selects = block.querySelectorAll('select[data-param]');
        selects.forEach(select => {
            const paramName = select.dataset.param;
            params[paramName] = select.value;
        });

        // 根据积木类型生成代码
        switch (blockType) {
            case 'serial_open':
                code += `const com = new COM("${params.port || 'COM3'}", ${params.baudrate || '115200'});\n`;
                code += `await com.Open();\n`;
                break;

            case 'serial_close':
                code += `await com.Close();\n`;
                break;

            case 'serial_send':
                code += `await com.SendData("${params.data || 'Hello'}");\n`;
                break;

            case 'udp_open':
                code += `const udp = new UDP("${params.remoteip || '127.0.0.1'}", ${params.remoteport || '8080'}, "${params.localip || '0.0.0.0'}", ${params.localport || '8081'});\n`;
                code += `await udp.Open();\n`;
                break;

            case 'udp_close':
                code += `udp.Close();\n`;
                break;

            case 'udp_send':
                code += `await udp.SendData("${params.data || 'Hello UDP'}");\n`;
                break;

            case 'tcp_open':
                code += `const tcp = new TCP("${params.remoteip || '127.0.0.1'}", ${params.remoteport || '8080'});\n`;
                code += `await tcp.Open();\n`;
                break;

            case 'tcp_close':
                code += `tcp.Close();\n`;
                break;

            case 'tcp_send':
                code += `await tcp.SendData("${params.data || 'Hello TCP'}");\n`;
                break;

            case 'serial_receive':
                code += `// 串口接收处理 (${params.listenMode || 'continuous'}模式)\n`;
                if (params.listenMode === 'timed') {
                    code += `let serialReceiveTimeout = setTimeout(() => {\n`;
                    code += `    console.log('串口监听超时');\n`;
                    code += `}, ${(params.timeout || 30) * 1000});\n\n`;
                }
                if (params.listenMode === 'once') {
                    code += `let serialReceiveOnce = false;\n`;
                }
                code += `addEventListener('message', function({data}) {\n`;
                code += `    if(data.type == 'uart_receive') {\n`;
                if (params.listenMode === 'once') {
                    code += `        if(serialReceiveOnce) return;\n`;
                    code += `        serialReceiveOnce = true;\n`;
                }
                if (params.listenMode === 'timed') {
                    code += `        clearTimeout(serialReceiveTimeout);\n`;
                }
                if (params.action === 'log') {
                    code += `        console.log('串口收到数据:', data.data);\n`;
                } else if (params.action === 'echo') {
                    code += `        postMessage({type:'uart_send', data:data.data});\n`;
                } else if (params.action === 'custom') {
                    code += `        postMessage({type:'uart_send_txt', data:"${params.customReply || 'OK'}"});\n`;
                }
                code += `    }\n`;
                code += `});\n`;
                break;

            case 'udp_receive':
                code += `// UDP接收处理 (${params.listenMode || 'continuous'}模式)\n`;
                if (params.listenMode === 'timed') {
                    code += `let udpReceiveTimeout = setTimeout(() => {\n`;
                    code += `    console.log('UDP监听超时');\n`;
                    code += `}, ${(params.timeout || 30) * 1000});\n\n`;
                }
                if (params.listenMode === 'once') {
                    code += `let udpReceiveOnce = false;\n`;
                }
                code += `addEventListener('message', function({data}) {\n`;
                code += `    if(data.type == 'udp_receive') {\n`;
                if (params.listenMode === 'once') {
                    code += `        if(udpReceiveOnce) return;\n`;
                    code += `        udpReceiveOnce = true;\n`;
                }
                if (params.listenMode === 'timed') {
                    code += `        clearTimeout(udpReceiveTimeout);\n`;
                }
                if (params.action === 'log') {
                    code += `        console.log('UDP收到数据:', data.data);\n`;
                } else if (params.action === 'echo') {
                    code += `        postMessage({type:'udp_send', data:data.data});\n`;
                } else if (params.action === 'custom') {
                    code += `        postMessage({type:'udp_send_txt', data:"${params.customReply || 'OK'}"});\n`;
                }
                code += `    }\n`;
                code += `});\n`;
                break;

            case 'tcp_receive':
                code += `// TCP接收处理 (${params.listenMode || 'continuous'}模式)\n`;
                if (params.listenMode === 'timed') {
                    code += `let tcpReceiveTimeout = setTimeout(() => {\n`;
                    code += `    console.log('TCP监听超时');\n`;
                    code += `}, ${(params.timeout || 30) * 1000});\n\n`;
                }
                if (params.listenMode === 'once') {
                    code += `let tcpReceiveOnce = false;\n`;
                }
                code += `addEventListener('message', function({data}) {\n`;
                code += `    if(data.type == 'tcp_receive') {\n`;
                if (params.listenMode === 'once') {
                    code += `        if(tcpReceiveOnce) return;\n`;
                    code += `        tcpReceiveOnce = true;\n`;
                }
                if (params.listenMode === 'timed') {
                    code += `        clearTimeout(tcpReceiveTimeout);\n`;
                }
                if (params.action === 'log') {
                    code += `        console.log('TCP收到数据:', data.data);\n`;
                } else if (params.action === 'echo') {
                    code += `        postMessage({type:'tcp_send', data:data.data});\n`;
                } else if (params.action === 'custom') {
                    code += `        postMessage({type:'tcp_send_txt', data:"${params.customReply || 'OK'}"});\n`;
                }
                code += `    }\n`;
                code += `});\n`;
                break;

            case 'wait':
                code += `await new Promise(resolve => setTimeout(resolve, ${params.time || '1000'}));\n`;
                break;

            case 'log':
                code += `console.log("${params.message || 'Hello World'}");\n`;
                break;

            default:
                code += `// 未知积木类型: ${blockType}\n`;
        }

        // 添加空行分隔
        if (index < blocks.length - 1) {
            code += '\n';
        }
    });

    codeDisplay.textContent = code;

    if (window.addLogErr) {
        window.addLogErr('📝 代码已生成');
    }

    console.log('生成的代码:', code);
    return code;
}

// 运行积木程序
async function runBlocks() {
    try {
        const code = generateCode();

        if (!code.trim() || code.includes('工作区为空')) {
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
        console.error('积木运行错误:', error);
    }
}

// 初始化积木编程功能
document.addEventListener('DOMContentLoaded', function () {
    console.log('积木编程功能已加载');

    if (window.addLogErr) {
        window.addLogErr('🧩 积木编程功能已加载');
        window.addLogErr('💡 点击"积木编程"选项卡开始使用');
    }
});

// 更新接收积木的数据显示
function updateReceiveBlockDisplay(blockType, data, remoteInfo = '') {
    // 查找所有对应类型的接收积木
    const workspace = document.getElementById('blockly-workspace');
    if (!workspace) return;

    const blocks = workspace.querySelectorAll('.block-item');
    blocks.forEach(block => {
        if (block.dataset.blockType === blockType) {
            const displayElement = block.querySelector(`#receive-display-${block.id}`);
            if (displayElement) {
                // 格式化数据显示
                let displayText = '';
                const timestamp = new Date().toLocaleTimeString();

                // 处理数据格式
                let dataText = '';
                if (typeof data === 'string') {
                    dataText = data;
                } else if (Array.isArray(data)) {
                    // 显示HEX和文本两种格式
                    const hexText = data.map(byte => ('0' + byte.toString(16).toUpperCase()).slice(-2)).join(' ');
                    const textDecoder = new TextDecoder();
                    const textData = textDecoder.decode(new Uint8Array(data));
                    dataText = `HEX: ${hexText}\nTXT: ${textData}`;
                } else {
                    dataText = String(data);
                }

                displayText = `[${timestamp}]${remoteInfo ? ' ' + remoteInfo : ''}\n${dataText}`;

                // 更新显示内容
                const existingContent = displayElement.textContent;
                if (existingContent.includes('等待数据...')) {
                    displayElement.innerHTML = `<div class="text-success">${displayText}</div>`;
                } else {
                    // 添加新数据到顶部，保留最近5条记录
                    const lines = displayElement.innerHTML.split('<div class="text-success">').filter(line => line.trim());
                    lines.unshift(displayText + '</div>');
                    if (lines.length > 5) {
                        lines.splice(5);
                    }
                    displayElement.innerHTML = lines.map(line =>
                        line.endsWith('</div>') ? `<div class="text-success">${line}` : `<div class="text-success">${line}</div>`
                    ).join('');
                }

                // 自动滚动到最新数据
                displayElement.scrollTop = 0;

                // 添加闪烁效果提示有新数据
                displayElement.style.border = '2px solid #28a745';
                setTimeout(() => {
                    displayElement.style.border = '';
                }, 1000);
            }
        }
    });
}

// 清空接收积木的数据显示
function clearReceiveBlockDisplay(blockType) {
    const workspace = document.getElementById('blockly-workspace');
    if (!workspace) return;

    const blocks = workspace.querySelectorAll('.block-item');
    blocks.forEach(block => {
        if (block.dataset.blockType === blockType) {
            const displayElement = block.querySelector(`#receive-display-${block.id}`);
            if (displayElement) {
                displayElement.innerHTML = '<span class="text-muted">等待数据...</span>';
            }
        }
    });
}

// 导出函数供其他模块使用
window.blocklyReceiveDisplay = {
    updateReceiveBlockDisplay: updateReceiveBlockDisplay,
    clearReceiveBlockDisplay: clearReceiveBlockDisplay
};

console.log('积木编程函数文件已加载');//
监听状态管理
const listeningBlocks = new Map(); // 存储正在监听的积木状态

// 为接收积木添加监听模式选择事件监听器
function setupReceiveBlockListeners(blockId) {
    const block = document.getElementById(blockId);
    if (!block) return;

    // 监听模式选择事件
    const listenModeSelect = block.querySelector('select[data-param="listenMode"]');
    const timeoutSetting = block.querySelector(`#timeout-setting-${blockId}`);

    if (listenModeSelect && timeoutSetting) {
        listenModeSelect.addEventListener('change', function () {
            if (this.value === 'timed') {
                timeoutSetting.style.display = 'block';
            } else {
                timeoutSetting.style.display = 'none';
            }
        });
    }
}

// 开始监听
function startListening(blockId) {
    const block = document.getElementById(blockId);
    if (!block) return;

    const blockType = block.dataset.blockType;
    const startBtn = document.getElementById(`start-btn-${blockId}`);
    const stopBtn = document.getElementById(`stop-btn-${blockId}`);
    const statusDiv = document.getElementById(`listen-status-${blockId}`);

    // 获取监听参数
    const listenModeSelect = block.querySelector('select[data-param="listenMode"]');
    const timeoutInput = block.querySelector('input[data-param="timeout"]');

    const listenMode = listenModeSelect ? listenModeSelect.value : 'continuous';
    const timeout = timeoutInput ? parseInt(timeoutInput.value) * 1000 : 30000; // 转换为毫秒

    // 更新UI状态
    startBtn.style.display = 'none';
    stopBtn.style.display = 'inline-block';

    // 创建监听状态对象
    const listeningState = {
        blockId: blockId,
        blockType: blockType,
        mode: listenMode,
        timeout: timeout,
        startTime: Date.now(),
        receivedCount: 0,
        timeoutTimer: null,
        active: true
    };

    // 根据监听模式设置状态显示和定时器
    switch (listenMode) {
        case 'continuous':
            statusDiv.innerHTML = '<span class="text-success">🟢 持续监听中...</span>';
            break;

        case 'once':
            statusDiv.innerHTML = '<span class="text-warning">🟡 等待接收一次数据...</span>';
            break;

        case 'timed':
            statusDiv.innerHTML = `<span class="text-info">🔵 定时监听中 (${timeout / 1000}秒)</span>`;
            // 设置超时定时器
            listeningState.timeoutTimer = setTimeout(() => {
                stopListening(blockId, '监听超时');
            }, timeout);
            break;
    }

    // 存储监听状态
    listeningBlocks.set(blockId, listeningState);

    if (window.addLogErr) {
        window.addLogErr(`🎧 ${blockType} 积木 ${blockId} 开始${getModeText(listenMode)}监听`);
    }
}

// 停止监听
function stopListening(blockId, reason = '手动停止') {
    const listeningState = listeningBlocks.get(blockId);
    if (!listeningState) return;

    const startBtn = document.getElementById(`start-btn-${blockId}`);
    const stopBtn = document.getElementById(`stop-btn-${blockId}`);
    const statusDiv = document.getElementById(`listen-status-${blockId}`);

    // 清除定时器
    if (listeningState.timeoutTimer) {
        clearTimeout(listeningState.timeoutTimer);
    }

    // 更新UI状态
    if (startBtn && stopBtn && statusDiv) {
        startBtn.style.display = 'inline-block';
        stopBtn.style.display = 'none';

        const duration = Math.round((Date.now() - listeningState.startTime) / 1000);
        statusDiv.innerHTML = `<span class="text-secondary">⚫ 已停止 (${reason}, 运行${duration}秒, 收到${listeningState.receivedCount}条)</span>`;
    }

    // 标记为非活跃状态
    listeningState.active = false;

    if (window.addLogErr) {
        window.addLogErr(`🛑 ${listeningState.blockType} 积木 ${blockId} 停止监听: ${reason}`);
    }

    // 从监听列表中移除
    listeningBlocks.delete(blockId);
}

// 获取监听模式文本
function getModeText(mode) {
    switch (mode) {
        case 'continuous': return '持续';
        case 'once': return '单次';
        case 'timed': return '定时';
        default: return '';
    }
}

// 检查积木是否正在监听
function isBlockListening(blockId) {
    const state = listeningBlocks.get(blockId);
    return state && state.active;
}

// 处理接收到的数据（需要在数据接收时调用）
function handleReceiveData(blockType, data, remoteInfo = '') {
    // 更新所有对应类型的接收积木显示
    updateReceiveBlockDisplay(blockType, data, remoteInfo);

    // 检查监听状态并处理
    listeningBlocks.forEach((state, blockId) => {
        if (state.blockType === blockType && state.active) {
            state.receivedCount++;

            // 根据监听模式决定是否停止监听
            if (state.mode === 'once') {
                stopListening(blockId, '已接收一次数据');
            } else {
                // 更新状态显示中的接收计数
                const statusDiv = document.getElementById(`listen-status-${state.blockId}`);
                if (statusDiv && state.mode === 'continuous') {
                    const duration = Math.round((Date.now() - state.startTime) / 1000);
                    statusDiv.innerHTML = `<span class="text-success">🟢 持续监听中... (${duration}秒, 已收到${state.receivedCount}条)</span>`;
                } else if (statusDiv && state.mode === 'timed') {
                    const remaining = Math.max(0, Math.round((state.timeout - (Date.now() - state.startTime)) / 1000));
                    statusDiv.innerHTML = `<span class="text-info">🔵 定时监听中 (剩余${remaining}秒, 已收到${state.receivedCount}条)</span>`;
                }
            }
        }
    });
}

// 修改原有的updateReceiveBlockDisplay函数，使其调用新的处理函数
const originalUpdateReceiveBlockDisplay = updateReceiveBlockDisplay;
updateReceiveBlockDisplay = function (blockType, data, remoteInfo = '') {
    // 调用原有的显示更新逻辑
    originalUpdateReceiveBlockDisplay(blockType, data, remoteInfo);

    // 处理监听状态
    handleReceiveData(blockType, data, remoteInfo);
};

// 在添加接收积木时设置监听器
const originalAddBlock = addBlock;
addBlock = function (name, type) {
    originalAddBlock(name, type);

    // 为接收积木设置额外的监听器
    if (type.includes('_receive')) {
        setTimeout(() => {
            setupReceiveBlockListeners(`block_${blockCounter}`);
        }, 100);
    }
};

// 在删除积木时清理监听状态
const originalRemoveBlock = removeBlock;
removeBlock = function (blockId) {
    // 如果是正在监听的积木，先停止监听
    if (listeningBlocks.has(blockId)) {
        stopListening(blockId, '积木被删除');
    }

    originalRemoveBlock(blockId);
};

// 导出监听控制函数供全局使用
window.blocklyListenControl = {
    startListening: startListening,
    stopListening: stopListening,
    isBlockListening: isBlockListening,
    handleReceiveData: handleReceiveData,
    listeningBlocks: listeningBlocks
};