/**
 * 流程图编辑器
 * 类似n8n的节点连线流程图
 */

class FlowchartEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.canvas = null;
        this.nodes = new Map();
        this.connections = new Map();
        this.selectedNode = null;
        this.selectedConnection = null;
        this.draggedNode = null;
        this.connecting = false;
        this.connectionStart = null;
        this.tempConnection = null;
        this.nodeCounter = 0;
        this.connectionCounter = 0;
        this.isExecuting = false;
        this.executionQueue = [];
        this.executionContext = {};
        
        this.init();
    }

    init() {
        this.createCanvas();
        this.setupEventListeners();
        this.createToolbar();
        this.createNodePalette();
        this.createPropertiesPanel();
        this.createExecutionStatus();
    }

    createCanvas() {
        this.container.innerHTML = `
            <div class="flowchart-canvas" id="flowchart-canvas">
                <svg class="flowchart-connections" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none;">
                    <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                            <polygon points="0 0, 10 3.5, 0 7" fill="#007bff" />
                        </marker>
                    </defs>
                </svg>
            </div>
        `;
        this.canvas = this.container.querySelector('.flowchart-canvas');
        this.svg = this.container.querySelector('.flowchart-connections');
    }

    createToolbar() {
        const toolbar = document.createElement('div');
        toolbar.className = 'flowchart-toolbar';
        toolbar.innerHTML = `
            <button class="btn btn-sm btn-success" id="flow-run">
                <i class="bi bi-play"></i> 运行
            </button>
            <button class="btn btn-sm btn-danger" id="flow-stop">
                <i class="bi bi-stop"></i> 停止
            </button>
            <button class="btn btn-sm btn-secondary" id="flow-clear">
                <i class="bi bi-trash"></i> 清空
            </button>
            <button class="btn btn-sm btn-info" id="flow-save">
                <i class="bi bi-save"></i> 保存
            </button>
            <button class="btn btn-sm btn-warning" id="flow-load">
                <i class="bi bi-folder-open"></i> 加载
            </button>
        `;
        this.canvas.appendChild(toolbar);

        // 绑定工具栏事件
        toolbar.querySelector('#flow-run').addEventListener('click', () => this.executeFlow());
        toolbar.querySelector('#flow-stop').addEventListener('click', () => this.stopExecution());
        toolbar.querySelector('#flow-clear').addEventListener('click', () => this.clearFlow());
        toolbar.querySelector('#flow-save').addEventListener('click', () => this.saveFlow());
        toolbar.querySelector('#flow-load').addEventListener('click', () => this.loadFlow());
    }

    createNodePalette() {
        const paletteContainer = document.getElementById('flowchart-node-palette');
        if (!paletteContainer) return;

        paletteContainer.innerHTML = `
            <div class="node-palette">
                <h6>🎯 控制节点</h6>
                <button class="palette-node" data-type="start">🟢 开始节点</button>
                <button class="palette-node" data-type="end">🔴 结束节点</button>
                <button class="palette-node" data-type="delay">⏱️ 延时等待</button>
                <button class="palette-node" data-type="condition">🔀 条件判断</button>
            </div>
            <div class="node-palette">
                <h6>📡 串口节点</h6>
                <button class="palette-node" data-type="serial_open">📡 打开串口</button>
                <button class="palette-node" data-type="serial_close">📡 关闭串口</button>
                <button class="palette-node" data-type="serial_send">📡 串口发送</button>
                <button class="palette-node" data-type="serial_receive">📡 串口接收</button>
            </div>
            <div class="node-palette">
                <h6>🌐 UDP节点</h6>
                <button class="palette-node" data-type="udp_open">🌐 打开UDP</button>
                <button class="palette-node" data-type="udp_close">🌐 关闭UDP</button>
                <button class="palette-node" data-type="udp_send">🌐 UDP发送</button>
                <button class="palette-node" data-type="udp_receive">🌐 UDP接收</button>
            </div>
            <div class="node-palette">
                <h6>🔌 TCP节点</h6>
                <button class="palette-node" data-type="tcp_open">🔌 打开TCP</button>
                <button class="palette-node" data-type="tcp_close">🔌 关闭TCP</button>
                <button class="palette-node" data-type="tcp_send">🔌 TCP发送</button>
                <button class="palette-node" data-type="tcp_receive">🔌 TCP接收</button>
            </div>
        `;

        // 绑定节点拖拽事件
        paletteContainer.querySelectorAll('.palette-node').forEach(node => {
            node.addEventListener('click', (e) => {
                const nodeType = e.target.dataset.type;
                this.createNode(nodeType, 100, 100);
            });
        });
    }

    createPropertiesPanel() {
        const propertiesContainer = document.getElementById('flowchart-properties');
        if (!propertiesContainer) return;

        propertiesContainer.innerHTML = `
            <div class="node-properties">
                <h6>节点属性</h6>
                <div id="node-properties-content">
                    <p class="text-muted">选择一个节点查看属性</p>
                </div>
            </div>
        `;
    }

    createExecutionStatus() {
        const status = document.createElement('div');
        status.className = 'execution-status';
        status.innerHTML = `
            <div id="execution-status">
                <span class="status-stopped">● 已停止</span>
            </div>
        `;
        this.canvas.appendChild(status);
    }

    setupEventListeners() {
        // 画布事件
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // 全局事件
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    createNode(type, x, y) {
        const nodeId = `node_${++this.nodeCounter}`;
        const nodeConfig = this.getNodeConfig(type);
        
        const nodeElement = document.createElement('div');
        nodeElement.className = `flowchart-node node-${nodeConfig.category}`;
        nodeElement.id = nodeId;
        nodeElement.style.left = x + 'px';
        nodeElement.style.top = y + 'px';
        
        nodeElement.innerHTML = `
            <div class="node-icon">${nodeConfig.icon}</div>
            <div class="node-title">${nodeConfig.title}</div>
            <div class="connection-point input" data-type="input"></div>
            <div class="connection-point output" data-type="output"></div>
        `;

        // 特殊节点样式
        if (type === 'start' || type === 'end') {
            nodeElement.classList.add(`node-${type}`);
            if (type === 'start') {
                nodeElement.querySelector('.connection-point.input').style.display = 'none';
            } else {
                nodeElement.querySelector('.connection-point.output').style.display = 'none';
            }
        }

        this.canvas.appendChild(nodeElement);

        // 存储节点数据
        const nodeData = {
            id: nodeId,
            type: type,
            x: x,
            y: y,
            config: nodeConfig,
            properties: { ...nodeConfig.defaultProperties },
            element: nodeElement
        };
        this.nodes.set(nodeId, nodeData);

        // 绑定节点事件
        this.setupNodeEvents(nodeElement, nodeData);

        return nodeData;
    }

    getNodeConfig(type) {
        const configs = {
            start: {
                title: '开始',
                icon: '🟢',
                category: 'start',
                defaultProperties: {}
            },
            end: {
                title: '结束',
                icon: '🔴',
                category: 'end',
                defaultProperties: {}
            },
            delay: {
                title: '延时等待',
                icon: '⏱️',
                category: 'control',
                defaultProperties: { delay: 1000 }
            },
            condition: {
                title: '条件判断',
                icon: '🔀',
                category: 'control',
                defaultProperties: { condition: 'true' }
            },
            serial_open: {
                title: '打开串口',
                icon: '📡',
                category: 'serial',
                defaultProperties: { port: 'COM3', baudrate: 115200 }
            },
            serial_close: {
                title: '关闭串口',
                icon: '📡',
                category: 'serial',
                defaultProperties: {}
            },
            serial_send: {
                title: '串口发送',
                icon: '📡',
                category: 'serial',
                defaultProperties: { data: 'Hello' }
            },
            serial_receive: {
                title: '串口接收',
                icon: '📡',
                category: 'serial',
                defaultProperties: { timeout: 5000 }
            },
            udp_open: {
                title: '打开UDP',
                icon: '🌐',
                category: 'udp',
                defaultProperties: { remoteip: '127.0.0.1', remoteport: 8080, localip: '0.0.0.0', localport: 8081 }
            },
            udp_close: {
                title: '关闭UDP',
                icon: '🌐',
                category: 'udp',
                defaultProperties: {}
            },
            udp_send: {
                title: 'UDP发送',
                icon: '🌐',
                category: 'udp',
                defaultProperties: { data: 'Hello UDP' }
            },
            udp_receive: {
                title: 'UDP接收',
                icon: '🌐',
                category: 'udp',
                defaultProperties: { timeout: 5000 }
            },
            tcp_open: {
                title: '打开TCP',
                icon: '🔌',
                category: 'tcp',
                defaultProperties: { remoteip: '127.0.0.1', remoteport: 8080 }
            },
            tcp_close: {
                title: '关闭TCP',
                icon: '🔌',
                category: 'tcp',
                defaultProperties: {}
            },
            tcp_send: {
                title: 'TCP发送',
                icon: '🔌',
                category: 'tcp',
                defaultProperties: { data: 'Hello TCP' }
            },
            tcp_receive: {
                title: 'TCP接收',
                icon: '🔌',
                category: 'tcp',
                defaultProperties: { timeout: 5000 }
            }
        };
        return configs[type] || configs.start;
    }

    setupNodeEvents(nodeElement, nodeData) {
        // 节点选择
        nodeElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectNode(nodeData);
        });

        // 节点拖拽
        nodeElement.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('connection-point')) return;
            e.preventDefault();
            this.startNodeDrag(nodeData, e);
        });

        // 连接点事件
        const connectionPoints = nodeElement.querySelectorAll('.connection-point');
        connectionPoints.forEach(point => {
            point.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.startConnection(nodeData, point.dataset.type, e);
            });
        });
    }

    selectNode(nodeData) {
        // 清除之前的选择
        if (this.selectedNode) {
            this.selectedNode.element.classList.remove('selected');
        }
        
        this.selectedNode = nodeData;
        nodeData.element.classList.add('selected');
        this.updatePropertiesPanel(nodeData);
    }

    updatePropertiesPanel(nodeData) {
        const propertiesContent = document.getElementById('node-properties-content');
        if (!propertiesContent) return;

        let html = `<h6>${nodeData.config.title} 属性</h6>`;
        
        for (const [key, value] of Object.entries(nodeData.properties)) {
            html += `
                <div class="property-group">
                    <label>${this.getPropertyLabel(key)}</label>
                    <input type="${this.getPropertyType(key)}" 
                           value="${value}" 
                           data-property="${key}"
                           onchange="flowchartEditor.updateNodeProperty('${nodeData.id}', '${key}', this.value)">
                </div>
            `;
        }

        propertiesContent.innerHTML = html;
    }

    getPropertyLabel(key) {
        const labels = {
            port: '端口',
            baudrate: '波特率',
            data: '数据内容',
            timeout: '超时时间(ms)',
            delay: '延时时间(ms)',
            condition: '条件表达式',
            remoteip: '远程IP',
            remoteport: '远程端口',
            localip: '本地IP',
            localport: '本地端口'
        };
        return labels[key] || key;
    }

    getPropertyType(key) {
        const numberFields = ['baudrate', 'timeout', 'delay', 'remoteport', 'localport'];
        return numberFields.includes(key) ? 'number' : 'text';
    }

    updateNodeProperty(nodeId, property, value) {
        const node = this.nodes.get(nodeId);
        if (node) {
            node.properties[property] = value;
        }
    }

    startNodeDrag(nodeData, e) {
        this.draggedNode = nodeData;
        this.dragOffset = {
            x: e.clientX - nodeData.x,
            y: e.clientY - nodeData.y
        };
    }

    startConnection(nodeData, pointType, e) {
        this.connecting = true;
        this.connectionStart = { node: nodeData, type: pointType };
        
        // 创建临时连线
        this.createTempConnection(e.clientX, e.clientY);
    }

    createTempConnection(x, y) {
        if (this.tempConnection) {
            this.tempConnection.remove();
        }

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('class', 'connection-line temp');
        line.setAttribute('stroke', '#ffc107');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');
        
        const startNode = this.connectionStart.node;
        const startX = startNode.x + (this.connectionStart.type === 'output' ? 120 : 0);
        const startY = startNode.y + 30;
        
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', x - this.canvas.offsetLeft);
        line.setAttribute('y2', y - this.canvas.offsetTop);
        
        this.svg.appendChild(line);
        this.tempConnection = line;
    }

    handleMouseMove(e) {
        if (this.draggedNode) {
            const newX = e.clientX - this.dragOffset.x;
            const newY = e.clientY - this.dragOffset.y;
            
            this.draggedNode.x = newX;
            this.draggedNode.y = newY;
            this.draggedNode.element.style.left = newX + 'px';
            this.draggedNode.element.style.top = newY + 'px';
            
            this.updateConnections(this.draggedNode.id);
        }
        
        if (this.connecting && this.tempConnection) {
            this.tempConnection.setAttribute('x2', e.clientX - this.canvas.offsetLeft);
            this.tempConnection.setAttribute('y2', e.clientY - this.canvas.offsetTop);
        }
    }

    handleMouseUp(e) {
        if (this.connecting) {
            const target = e.target;
            if (target.classList.contains('connection-point')) {
                const targetNode = this.getNodeFromElement(target.closest('.flowchart-node'));
                const targetType = target.dataset.type;
                
                if (targetNode && targetNode.id !== this.connectionStart.node.id &&
                    targetType !== this.connectionStart.type) {
                    this.createConnection(this.connectionStart, { node: targetNode, type: targetType });
                }
            }
            
            this.endConnection();
        }
        
        this.draggedNode = null;
    }

    endConnection() {
        this.connecting = false;
        this.connectionStart = null;
        if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
        }
    }

    createConnection(start, end) {
        const connectionId = `conn_${++this.connectionCounter}`;
        
        const connectionData = {
            id: connectionId,
            start: start,
            end: end,
            element: null
        };
        
        this.connections.set(connectionId, connectionData);
        this.drawConnection(connectionData);
        
        return connectionData;
    }

    drawConnection(connectionData) {
        const startNode = connectionData.start.node;
        const endNode = connectionData.end.node;
        
        const startX = startNode.x + (connectionData.start.type === 'output' ? 120 : 0);
        const startY = startNode.y + 30;
        const endX = endNode.x + (connectionData.end.type === 'output' ? 120 : 0);
        const endY = endNode.y + 30;
        
        // 创建贝塞尔曲线路径
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const d = `M ${startX} ${startY} C ${startX + 50} ${startY}, ${endX - 50} ${endY}, ${endX} ${endY}`;
        
        path.setAttribute('d', d);
        path.setAttribute('class', 'connection-line');
        path.setAttribute('stroke', '#007bff');
        path.setAttribute('stroke-width', '2');
        path.setAttribute('fill', 'none');
        path.setAttribute('marker-end', 'url(#arrowhead)');
        
        this.svg.appendChild(path);
        connectionData.element = path;
    }

    updateConnections(nodeId) {
        this.connections.forEach(conn => {
            if (conn.start.node.id === nodeId || conn.end.node.id === nodeId) {
                this.drawConnection(conn);
                if (conn.element && conn.element.parentNode) {
                    conn.element.parentNode.removeChild(conn.element);
                }
                this.drawConnection(conn);
            }
        });
    }

    getNodeFromElement(element) {
        const nodeId = element.id;
        return this.nodes.get(nodeId);
    }

    handleCanvasClick(e) {
        if (e.target === this.canvas) {
            this.clearSelection();
        }
    }

    handleContextMenu(e) {
        e.preventDefault();
        // TODO: 实现右键菜单
    }

    handleKeyDown(e) {
        if (e.key === 'Delete' && this.selectedNode) {
            this.deleteNode(this.selectedNode.id);
        }
    }

    clearSelection() {
        if (this.selectedNode) {
            this.selectedNode.element.classList.remove('selected');
            this.selectedNode = null;
        }
        
        const propertiesContent = document.getElementById('node-properties-content');
        if (propertiesContent) {
            propertiesContent.innerHTML = '<p class="text-muted">选择一个节点查看属性</p>';
        }
    }

    deleteNode(nodeId) {
        const node = this.nodes.get(nodeId);
        if (!node) return;
        
        // 删除相关连接
        const connectionsToDelete = [];
        this.connections.forEach((conn, connId) => {
            if (conn.start.node.id === nodeId || conn.end.node.id === nodeId) {
                connectionsToDelete.push(connId);
            }
        });
        
        connectionsToDelete.forEach(connId => {
            const conn = this.connections.get(connId);
            if (conn.element) {
                conn.element.remove();
            }
            this.connections.delete(connId);
        });
        
        // 删除节点
        node.element.remove();
        this.nodes.delete(nodeId);
        
        if (this.selectedNode && this.selectedNode.id === nodeId) {
            this.clearSelection();
        }
    }

    // 流程执行相关方法
    async executeFlow() {
        if (this.isExecuting) return;
        
        this.isExecuting = true;
        this.updateExecutionStatus('running', '● 执行中...');
        
        try {
            // 找到开始节点
            const startNodes = Array.from(this.nodes.values()).filter(node => node.type === 'start');
            if (startNodes.length === 0) {
                throw new Error('未找到开始节点');
            }
            
            // 从开始节点开始执行
            for (const startNode of startNodes) {
                await this.executeNode(startNode);
            }
            
            this.updateExecutionStatus('stopped', '● 执行完成');
        } catch (error) {
            console.error('流程执行错误:', error);
            this.updateExecutionStatus('error', '● 执行错误: ' + error.message);
        } finally {
            this.isExecuting = false;
            this.clearExecutionHighlight();
        }
    }

    async executeNode(node) {
        if (!this.isExecuting) return;
        
        // 高亮当前执行的节点
        node.element.classList.add('executing');
        
        try {
            // 根据节点类型执行相应操作
            await this.performNodeAction(node);
            
            // 等待一小段时间以便观察执行过程
            await this.delay(500);
            
            // 执行下一个节点
            const nextNodes = this.getNextNodes(node);
            for (const nextNode of nextNodes) {
                await this.executeNode(nextNode);
            }
        } catch (error) {
            node.element.classList.add('error');
            throw error;
        } finally {
            node.element.classList.remove('executing');
        }
    }

    async performNodeAction(node) {
        switch (node.type) {
            case 'start':
                console.log('流程开始');
                break;
                
            case 'end':
                console.log('流程结束');
                break;
                
            case 'delay':
                const delayTime = parseInt(node.properties.delay) || 1000;
                console.log(`延时 ${delayTime}ms`);
                await this.delay(delayTime);
                break;
                
            case 'serial_open':
                console.log('打开串口:', node.properties);
                // 调用实际的串口打开函数
                if (window.COM) {
                    const com = new COM(node.properties.port, node.properties.baudrate);
                    await com.Open();
                    this.executionContext.com = com;
                }
                break;
                
            case 'serial_send':
                console.log('串口发送:', node.properties.data);
                if (this.executionContext.com) {
                    await this.executionContext.com.SendData(node.properties.data);
                }
                break;
                
            case 'udp_open':
                console.log('打开UDP:', node.properties);
                if (window.UDP) {
                    const udp = new UDP(
                        node.properties.remoteip,
                        node.properties.remoteport,
                        node.properties.localip,
                        node.properties.localport
                    );
                    await udp.Open();
                    this.executionContext.udp = udp;
                }
                break;
                
            case 'udp_send':
                console.log('UDP发送:', node.properties.data);
                if (this.executionContext.udp) {
                    await this.executionContext.udp.SendData(node.properties.data);
                }
                break;
                
            case 'tcp_open':
                console.log('打开TCP:', node.properties);
                if (window.TCP) {
                    const tcp = new TCP(node.properties.remoteip, node.properties.remoteport);
                    await tcp.Open();
                    this.executionContext.tcp = tcp;
                }
                break;
                
            case 'tcp_send':
                console.log('TCP发送:', node.properties.data);
                if (this.executionContext.tcp) {
                    await this.executionContext.tcp.SendData(node.properties.data);
                }
                break;
                
            default:
                console.log('执行节点:', node.type, node.properties);
        }
    }

    getNextNodes(node) {
        const nextNodes = [];
        this.connections.forEach(conn => {
            if (conn.start.node.id === node.id) {
                nextNodes.push(conn.end.node);
            }
        });
        return nextNodes;
    }

    stopExecution() {
        this.isExecuting = false;
        this.updateExecutionStatus('stopped', '● 已停止');
        this.clearExecutionHighlight();
    }

    clearExecutionHighlight() {
        this.nodes.forEach(node => {
            node.element.classList.remove('executing', 'error');
        });
    }

    updateExecutionStatus(status, text) {
        const statusElement = document.getElementById('execution-status');
        if (statusElement) {
            statusElement.innerHTML = `<span class="status-${status}">${text}</span>`;
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    clearFlow() {
        this.nodes.clear();
        this.connections.clear();
        this.canvas.querySelectorAll('.flowchart-node').forEach(node => node.remove());
        this.svg.querySelectorAll('.connection-line').forEach(line => line.remove());
        this.clearSelection();
        this.nodeCounter = 0;
        this.connectionCounter = 0;
    }

    saveFlow() {
        const flowData = {
            nodes: Array.from(this.nodes.values()).map(node => ({
                id: node.id,
                type: node.type,
                x: node.x,
                y: node.y,
                properties: node.properties
            })),
            connections: Array.from(this.connections.values()).map(conn => ({
                id: conn.id,
                start: { nodeId: conn.start.node.id, type: conn.start.type },
                end: { nodeId: conn.end.node.id, type: conn.end.type }
            }))
        };
        
        const dataStr = JSON.stringify(flowData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'flowchart.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }

    loadFlow() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const flowData = JSON.parse(e.target.result);
                        this.loadFlowData(flowData);
                    } catch (error) {
                        alert('文件格式错误: ' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();
    }

    loadFlowData(flowData) {
        this.clearFlow();
        
        // 加载节点
        const nodeMap = new Map();
        flowData.nodes.forEach(nodeData => {
            const node = this.createNode(nodeData.type, nodeData.x, nodeData.y);
            node.properties = { ...nodeData.properties };
            nodeMap.set(nodeData.id, node);
        });
        
        // 加载连接
        flowData.connections.forEach(connData => {
            const startNode = nodeMap.get(connData.start.nodeId);
            const endNode = nodeMap.get(connData.end.nodeId);
            
            if (startNode && endNode) {
                this.createConnection(
                    { node: startNode, type: connData.start.type },
                    { node: endNode, type: connData.end.type }
                );
            }
        });
    }
}

// 全局变量
let flowchartEditor = null;

// 初始化流程图编辑器
function initFlowchartEditor() {
    if (document.getElementById('flowchart-container')) {
        flowchartEditor = new FlowchartEditor('flowchart-container');
    }
}

// 导出到全局
window.FlowchartEditor = FlowchartEditor;
window.initFlowchartEditor = initFlowchartEditor;