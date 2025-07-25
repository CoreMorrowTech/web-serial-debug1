;(function () {
    // TCP相关变量
    let tcpSocket = null;
    let tcpConnected = false;
    let currentConnectionType = 'serial'; // 'serial', 'udp' 或 'tcp'
    
    // TCP配置选项
    let tcpOptions = {
        remoteIP: '127.0.0.1',
        remotePort: 8080
    };

    // 读取TCP配置
    let savedTcpOptions = localStorage.getItem('tcpOptions');
    if (savedTcpOptions) {
        tcpOptions = JSON.parse(savedTcpOptions);
        document.getElementById('tcp-remote-ip').value = tcpOptions.remoteIP;
        document.getElementById('tcp-remote-port').value = tcpOptions.remotePort;
    }

    // 连接类型切换事件
    document.querySelectorAll('input[name="connection-type"]').forEach(radio => {
        radio.addEventListener('change', function() {
            currentConnectionType = this.value;
            switchConnectionType(this.value);
        });
    });

    // 切换连接类型
    function switchConnectionType(type) {
        const serialConfig = document.getElementById('serial-config');
        const udpConfig = document.getElementById('udp-config');
        const tcpConfig = document.getElementById('tcp-config');
        const logTitle = document.getElementById('log-title');
        
        if (type === 'serial') {
            serialConfig.style.display = 'block';
            udpConfig.style.display = 'none';
            tcpConfig.style.display = 'none';
            logTitle.textContent = '串口日志';
        } else if (type === 'udp') {
            serialConfig.style.display = 'none';
            udpConfig.style.display = 'block';
            tcpConfig.style.display = 'none';
            logTitle.textContent = 'UDP日志';
        } else if (type === 'tcp') {
            serialConfig.style.display = 'none';
            udpConfig.style.display = 'none';
            tcpConfig.style.display = 'block';
            logTitle.textContent = 'TCP日志';
        }
    }

    // TCP配置参数变化事件
    document.getElementById('tcp-remote-ip').addEventListener('change', function() {
        tcpOptions.remoteIP = this.value;
        saveTcpOptions();
    });

    document.getElementById('tcp-remote-port').addEventListener('change', function() {
        tcpOptions.remotePort = parseInt(this.value);
        saveTcpOptions();
    });

    // 保存TCP配置
    function saveTcpOptions() {
        localStorage.setItem('tcpOptions', JSON.stringify(tcpOptions));
    }

    // TCP连接/断开按钮事件
    document.getElementById('tcp-connect-or-disconnect').addEventListener('click', function() {
        if (tcpConnected) {
            disconnectTCP();
        } else {
            connectTCP();
        }
    });

    // 连接TCP
    function connectTCP() {
        try {
            // 使用WebSocket代理TCP连接
            connectWebSocketTCP();
        } catch (error) {
            addLogErr('TCP连接失败: ' + error.message);
        }
    }

    // 使用WebSocket代理TCP连接
    function connectWebSocketTCP() {
        try {
            // 获取代理服务器地址（可配置）
            const proxyServer = getProxyServerUrl();
            
            addLogErr('正在通过WebSocket代理连接TCP...');
            addLogErr('代理服务器: ' + proxyServer);
            
            // 创建WebSocket连接到代理服务器
            const ws = new WebSocket(proxyServer);
            
            ws.onopen = function() {
                addLogErr('WebSocket代理连接成功，正在建立TCP连接...');
                
                // 请求建立TCP连接
                ws.send(JSON.stringify({
                    type: 'tcp_connect',
                    remoteAddress: tcpOptions.remoteIP,
                    remotePort: tcpOptions.remotePort
                }));
            };
            
            ws.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    handleProxyMessage(data);
                } catch (error) {
                    addLogErr('代理消息解析错误: ' + error.message);
                }
            };
            
            ws.onclose = function(event) {
                tcpConnected = false;
                updateTCPStatus(false);
                tcpSocket = null;
                addLogErr('WebSocket代理连接已断开 (代码: ' + event.code + ')');
            };
            
            ws.onerror = function(error) {
                addLogErr('WebSocket代理连接错误，请检查代理服务器是否运行');
                addLogErr('错误详情: ' + error.message || '连接失败');
                addLogErr('解决方案：');
                addLogErr('1. 启动TCP代理服务器: node udp-proxy-server.js');
                addLogErr('2. 或配置其他TCP代理服务器地址');
            };
            
            // 保存WebSocket引用
            tcpSocket = ws;
            
        } catch (error) {
            addLogErr('WebSocket代理连接失败: ' + error.message);
        }
    }
    
    // 处理代理服务器消息
    function handleProxyMessage(data) {
        switch (data.type) {
            case 'welcome':
                addLogErr('已连接到TCP代理服务器 (客户端ID: ' + data.clientId + ')');
                break;
                
            case 'tcp_connected':
                tcpConnected = true;
                updateTCPStatus(true);
                addLogErr('TCP连接成功: ' + data.remoteAddress + ':' + data.remotePort);
                addLogErr('本地地址: ' + data.localAddress + ':' + data.localPort);
                break;
                
            case 'tcp_data':
                handleTCPReceive(data.data, data.remoteAddress, data.remotePort);
                break;
                
            case 'tcp_sent':
                addLogErr('TCP数据已发送到: ' + data.remoteAddress + ':' + data.remotePort + ' (' + data.bytesSent + ' 字节)');
                break;
                
            case 'tcp_disconnected':
                tcpConnected = false;
                updateTCPStatus(false);
                addLogErr('TCP连接已断开' + (data.hadError ? ' (发生错误)' : ''));
                break;
                
            case 'error':
                addLogErr('代理服务器错误: ' + data.message);
                break;
                
            case 'pong':
                // 心跳响应
                break;
                
            default:
                console.log('未知代理消息类型:', data.type);
        }
    }

    // 断开TCP连接
    function disconnectTCP() {
        if (tcpSocket) {
            // WebSocket代理模式
            tcpSocket.send(JSON.stringify({
                type: 'tcp_disconnect'
            }));
            tcpSocket.close();
            tcpSocket = null;
        }
        tcpConnected = false;
        updateTCPStatus(false);
        addLogErr('TCP连接已断开');
    }

    // 更新TCP状态显示
    function updateTCPStatus(connected) {
        const statusDiv = document.getElementById('tcp-status');
        const button = document.getElementById('tcp-connect-or-disconnect');
        
        if (connected) {
            statusDiv.innerHTML = '<div class="alert alert-success" role="alert">TCP已连接</div>';
            button.textContent = '断开TCP';
            button.classList.remove('btn-primary');
            button.classList.add('btn-danger');
        } else {
            statusDiv.innerHTML = '<div class="alert alert-secondary" role="alert">TCP未连接</div>';
            button.textContent = '连接TCP';
            button.classList.remove('btn-danger');
            button.classList.add('btn-primary');
        }
    }

    // 处理TCP接收数据
    function handleTCPReceive(data, remoteAddress, remotePort) {
        if (currentConnectionType === 'tcp') {
            // 将数据转换为Uint8Array格式，与串口数据格式保持一致
            let dataArray;
            if (data instanceof ArrayBuffer) {
                dataArray = new Uint8Array(data);
            } else if (typeof data === 'string') {
                dataArray = new TextEncoder().encode(data);
            } else {
                dataArray = new Uint8Array(data);
            }
            
            // 添加远程地址信息到日志
            addLogErr('TCP收到数据来自: ' + remoteAddress + ':' + remotePort);
            
            // 使用现有的串口日志函数显示数据
            if (window.addLog) {
                window.addLog(Array.from(dataArray), true);
            }
            
            // 更新TCP接收积木的数据显示
            if (window.blocklyReceiveDisplay) {
                const remoteInfo = `from ${remoteAddress}:${remotePort}`;
                window.blocklyReceiveDisplay.updateReceiveBlockDisplay('tcp_receive', Array.from(dataArray), remoteInfo);
            }
        }
    }

    // 发送TCP数据
    async function sendTCPData(data) {
        if (!tcpConnected) {
            addLogErr('请先连接TCP');
            return false;
        }

        try {
            if (tcpSocket && tcpSocket.send) {
                // WebSocket代理模式
                tcpSocket.send(JSON.stringify({
                    type: 'tcp_send',
                    data: Array.from(data)
                }));
            } else {
                addLogErr('TCP连接状态异常');
                return false;
            }
            
            // 使用现有的串口日志函数显示发送的数据
            if (window.addLog) {
                window.addLog(Array.from(data), false);
            }
            return true;
        } catch (error) {
            addLogErr('TCP发送失败: ' + error.message);
            return false;
        }
    }

    // 获取代理服务器URL（复用UDP的函数）
    function getProxyServerUrl() {
        // 优先使用用户自定义配置
        const userConfig = localStorage.getItem('tcpProxyServer') || localStorage.getItem('udpProxyServer');
        if (userConfig) return userConfig;
        
        // 根据部署环境自动选择
        const hostname = location.hostname;
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        
        // GitHub Pages部署
        if (hostname && hostname.includes('github.io')) {
            // 这里需要替换为您的实际代理服务器地址
            return 'wss://web-production-b1ff1.up.railway.app';
        }
        
        // 本地开发环境（包括直接打开HTML文件的情况）
        if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1' || location.protocol === 'file:') {
            return 'ws://localhost:8080';
        }
        
        // 其他环境，尝试同域名
        return `${protocol}//${hostname}:8080`;
    }
    
    // 设置代理服务器地址
    function setProxyServerUrl(url) {
        localStorage.setItem('tcpProxyServer', url);
        addLogErr('TCP代理服务器地址已更新: ' + url);
    }

    // 导出函数供其他模块使用
    window.tcpModule = {
        getCurrentConnectionType: () => currentConnectionType,
        isTCPConnected: () => tcpConnected,
        sendTCPData: sendTCPData,
        connectTCP: connectTCP,
        disconnectTCP: disconnectTCP,
        setProxyServerUrl: setProxyServerUrl,
        getProxyServerUrl: getProxyServerUrl
    };

})();