#!/usr/bin/env node
/**
 * UDP WebSocket代理服务器
 * 用于解决浏览器无法直接创建UDP连接的问题
 */

const WebSocket = require('ws');
const dgram = require('dgram');
const http = require('http');
const net = require('net');

// 配置
const CONFIG = {
    port: process.env.PORT || 8080,
    maxConnections: 100,
    timeout: 30000, // 30秒超时
    allowedOrigins: [
        'https://*.github.io',
        'http://localhost:*',
        'http://127.0.0.1:*',
        'https://localhost:*'
    ]
};

// Railway环境检测和调试
const isRailwayEnv = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID;
if (isRailwayEnv) {
    console.log('🚂 Railway环境检测到');
    console.log('环境变量:');
    console.log('  PORT:', process.env.PORT);
    console.log('  NODE_ENV:', process.env.NODE_ENV);
    console.log('  RAILWAY_ENVIRONMENT:', process.env.RAILWAY_ENVIRONMENT);
    console.log('  RAILWAY_PROJECT_ID:', process.env.RAILWAY_PROJECT_ID);
}

// 创建HTTP服务器（可选，用于状态页面）
const server = http.createServer((req, res) => {
    // 设置CORS头 - 简化处理避免undefined值
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // 处理预检请求
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    if (req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'running',
            connections: wss.clients.size,
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            railway: {
                detected: !!isRailwayEnv,
                environment: process.env.RAILWAY_ENVIRONMENT,
                projectId: process.env.RAILWAY_PROJECT_ID
            },
            activeConnections: Array.from(connections.values()).map(conn => ({
                id: conn.id,
                remoteAddress: conn.remoteAddress,
                connectedAt: conn.connectedAt,
                hasUDP: !!conn.udpSocket,
                hasTCP: !!conn.tcpSocket
            }))
        }));
    } else if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>UDP WebSocket代理服务器</title>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .status { background: #e8f5e8; padding: 15px; border-radius: 5px; }
                    .info { background: #e8f4fd; padding: 10px; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <h1>UDP WebSocket代理服务器</h1>
                <div class="status">
                    <h3>✅ 服务器运行中</h3>
                    <p><strong>服务端口:</strong> ${CONFIG.port}</p>
                    <p><strong>当前连接数:</strong> <span id="connections">${wss.clients.size}</span></p>
                    <p><strong>运行时间:</strong> ${Math.floor(process.uptime())}秒</p>
                </div>
                
                <div class="info">
                    <h3>API端点</h3>
                    <ul>
                        <li><a href="/status">状态API</a> - JSON格式状态信息</li>
                        <li><a href="/health">健康检查</a> - 服务健康状态</li>
                    </ul>
                </div>
                
                <div class="info">
                    <h3>WebSocket连接</h3>
                    <p>连接地址: <code>${req.headers.host ? (req.headers['x-forwarded-proto'] || 'ws') + '://' + req.headers.host : 'ws://localhost:' + CONFIG.port}</code></p>
                </div>
                
                <script>
                    // 定期更新连接数
                    setInterval(() => {
                        fetch('/status')
                            .then(r => r.json())
                            .then(data => {
                                document.getElementById('connections').textContent = data.connections;
                            })
                            .catch(() => {});
                    }, 5000);
                </script>
            </body>
            </html>
        `);
    }
});

// 检查来源是否被允许（暂时简化为允许所有来源）
function isOriginAllowed(origin) {
    return true; // 简化处理，允许所有来源
}

// 创建WebSocket服务器
const wss = new WebSocket.Server({ 
    server: server,
    perMessageDeflate: false
});

console.log(`正在启动UDP代理服务器...`);
console.log(`配置端口: ${CONFIG.port}`);
console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
if (process.env.RAILWAY_ENVIRONMENT) {
    console.log(`Railway部署环境检测到`);
}

// 连接管理
const connections = new Map();

wss.on('connection', function connection(ws, req) {
    const clientId = Date.now() + Math.random();
    const clientInfo = {
        id: clientId,
        ws: ws,
        udpSocket: null,
        tcpSocket: null,
        remoteAddress: req.socket.remoteAddress,
        connectedAt: new Date(),
        serverHost: req.headers.host ? req.headers.host.split(':')[0] : null
    };
    
    connections.set(clientId, clientInfo);
    console.log(`新客户端连接: ${clientInfo.remoteAddress} (ID: ${clientId})`);
    
    // 连接超时处理
    const timeout = setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.close(1000, 'Connection timeout');
        }
    }, CONFIG.timeout);
    
    ws.on('message', function incoming(message) {
        try {
            const data = JSON.parse(message);
            handleMessage(clientInfo, data);
        } catch (error) {
            console.error('消息解析错误:', error);
            sendError(ws, 'Invalid message format');
        }
    });
    
    ws.on('close', function() {
        clearTimeout(timeout);
        cleanup(clientInfo);
        connections.delete(clientId);
        console.log(`客户端断开: ${clientInfo.remoteAddress} (ID: ${clientId})`);
    });
    
    ws.on('error', function(error) {
        console.error('WebSocket错误:', error);
        cleanup(clientInfo);
    });
    
    // 发送欢迎消息
    sendMessage(ws, {
        type: 'welcome',
        clientId: clientId,
        serverInfo: {
            version: '1.0.0',
            maxConnections: CONFIG.maxConnections
        }
    });
});

// 处理客户端消息
function handleMessage(clientInfo, data) {
    const { ws } = clientInfo;
    
    switch (data.type) {
        case 'udp_connect':
            handleUDPConnect(clientInfo, data);
            break;
            
        case 'udp_send':
            handleUDPSend(clientInfo, data);
            break;
            
        case 'udp_disconnect':
            handleUDPDisconnect(clientInfo);
            break;
            
        case 'udp_send_to_client':
            handleUDPSendToClient(clientInfo, data);
            break;
            
        case 'tcp_connect':
            handleTCPConnect(clientInfo, data);
            break;
            
        case 'tcp_send':
            handleTCPSend(clientInfo, data);
            break;
            
        case 'tcp_disconnect':
            handleTCPDisconnect(clientInfo);
            break;
            
        case 'ping':
            sendMessage(ws, { type: 'pong', timestamp: Date.now() });
            break;
            
        default:
            sendError(ws, `Unknown message type: ${data.type}`);
    }
}

// 处理UDP连接请求
function handleUDPConnect(clientInfo, data) {
    const { ws } = clientInfo;
    const { localIP = '0.0.0.0', localPort = 0 } = data;
    
    try {
        // 创建UDP socket
        const udpSocket = dgram.createSocket('udp4');
        clientInfo.udpSocket = udpSocket;
        
        // 监听UDP消息
        udpSocket.on('message', (msg, rinfo) => {
            console.log(`UDP收到数据: ${msg.length} 字节，来自 ${rinfo.address}:${rinfo.port} (客户端: ${clientInfo.id})`);
            sendMessage(ws, {
                type: 'udp_data',
                data: Array.from(msg),
                remoteAddress: rinfo.address,
                remotePort: rinfo.port,
                timestamp: Date.now()
            });
        });
        
        // 监听错误
        udpSocket.on('error', (error) => {
            console.error('UDP错误:', error);
            sendError(ws, `UDP error: ${error.message}`);
        });
        
        // 绑定端口
        udpSocket.bind(localPort, localIP, () => {
            const address = udpSocket.address();
            sendMessage(ws, {
                type: 'udp_connected',
                localAddress: address.address,
                localPort: address.port,
                timestamp: Date.now()
            });
            console.log(`UDP连接建立: ${address.address}:${address.port} (客户端: ${clientInfo.id})`);
        });
        
    } catch (error) {
        console.error('UDP连接失败:', error);
        sendError(ws, `UDP connect failed: ${error.message}`);
    }
}

// 处理UDP发送请求
function handleUDPSend(clientInfo, data) {
    const { ws, udpSocket } = clientInfo;
    
    if (!udpSocket) {
        sendError(ws, 'UDP not connected');
        return;
    }
    
    const { data: messageData, remoteAddress, remotePort } = data;
    
    console.log(`客户端 ${clientInfo.id} 尝试发送UDP数据:`);
    console.log(`  目标地址: ${remoteAddress}:${remotePort}`);
    console.log(`  数据长度: ${messageData ? messageData.length : 0} 字节`);
    
    // 验证参数
    if (!messageData || messageData.length === 0) {
        const errorMsg = 'No data to send';
        console.error(errorMsg);
        sendError(ws, errorMsg);
        return;
    }
    
    if (!remoteAddress || !remotePort) {
        const errorMsg = 'UDP send requires remoteAddress and remotePort';
        console.error(errorMsg);
        sendError(ws, errorMsg);
        return;
    }
    
    try {
        const buffer = Buffer.from(messageData);
        console.log(`  发送缓冲区创建成功，大小: ${buffer.length} 字节`);
        
        udpSocket.send(buffer, remotePort, remoteAddress, (error) => {
            if (error) {
                console.error(`UDP发送失败 (客户端 ${clientInfo.id}):`, error);
                sendError(ws, `UDP send failed: ${error.message}`);
            } else {
                console.log(`UDP发送成功 (客户端 ${clientInfo.id}): ${buffer.length} 字节到 ${remoteAddress}:${remotePort}`);
                sendMessage(ws, {
                    type: 'udp_sent',
                    bytesSent: buffer.length,
                    remoteAddress: remoteAddress,
                    remotePort: remotePort,
                    timestamp: Date.now()
                });
            }
        });
    } catch (error) {
        console.error(`UDP发送异常 (客户端 ${clientInfo.id}):`, error);
        sendError(ws, `UDP send error: ${error.message}`);
    }
}

// 处理UDP断开请求
function handleUDPDisconnect(clientInfo) {
    const { ws } = clientInfo;
    
    if (clientInfo.udpSocket) {
        clientInfo.udpSocket.close();
        clientInfo.udpSocket = null;
        sendMessage(ws, {
            type: 'udp_disconnected',
            timestamp: Date.now()
        });
        console.log(`UDP连接关闭 (客户端: ${clientInfo.id})`);
    }
}

// 清理资源
function cleanup(clientInfo) {
    if (clientInfo.udpSocket) {
        try {
            const address = clientInfo.udpSocket.address();
            console.log(`清理UDP连接: ${address.address}:${address.port} (客户端: ${clientInfo.id})`);
        } catch (error) {
            // Socket可能已经关闭，忽略错误
        }
        
        clientInfo.udpSocket.removeAllListeners();
        clientInfo.udpSocket.close();
        clientInfo.udpSocket = null;
    }
    
    if (clientInfo.tcpSocket) {
        try {
            console.log(`清理TCP连接: ${clientInfo.tcpSocket.remoteAddress}:${clientInfo.tcpSocket.remotePort} (客户端: ${clientInfo.id})`);
        } catch (error) {
            // Socket可能已经关闭，忽略错误
        }
        
        clientInfo.tcpSocket.removeAllListeners();
        clientInfo.tcpSocket.destroy();
        clientInfo.tcpSocket = null;
    }
}

// 发送消息
function sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
}

// 发送错误消息
function sendError(ws, error) {
    sendMessage(ws, {
        type: 'error',
        message: error,
        timestamp: Date.now()
    });
}

// 启动HTTP服务器
const PORT = CONFIG.port;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`UDP代理服务器启动成功!`);
    console.log(`HTTP服务器运行在端口 ${PORT}`);
    console.log(`WebSocket服务器运行在端口 ${PORT}`);
    console.log(`健康检查端点: /health`);
    console.log(`状态API端点: /status`);
    if (process.env.RAILWAY_ENVIRONMENT) {
        console.log(`Railway环境部署成功`);
    } else {
        console.log(`本地访问地址: http://localhost:${PORT}`);
    }
});

// 监听服务器错误
server.on('error', (error) => {
    console.error('服务器启动错误:', error);
    if (error.code === 'EADDRINUSE') {
        console.error(`端口 ${PORT} 已被占用`);
    }
    process.exit(1);
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n正在关闭服务器...');
    
    // 关闭所有连接
    connections.forEach(clientInfo => {
        cleanup(clientInfo);
        if (clientInfo.ws.readyState === WebSocket.OPEN) {
            clientInfo.ws.close(1000, 'Server shutdown');
        }
    });
    
    // 关闭服务器
    wss.close(() => {
        server.close(() => {
            console.log('服务器已关闭');
            process.exit(0);
        });
    });
});

// 错误处理
process.on('uncaughtException', (error) => {
    console.error('未捕获的异常:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('未处理的Promise拒绝:', reason);
});

// TCP处理函数

// 处理TCP连接请求
function handleTCPConnect(clientInfo, data) {
    const { ws } = clientInfo;
    const { remoteAddress, remotePort } = data;
    
    console.log(`客户端 ${clientInfo.id} 请求TCP连接: ${remoteAddress}:${remotePort}`);
    
    if (!remoteAddress || !remotePort) {
        sendError(ws, 'TCP connect requires remoteAddress and remotePort');
        return;
    }
    
    try {
        // 创建TCP socket
        const tcpSocket = new net.Socket();
        clientInfo.tcpSocket = tcpSocket;
        
        // 监听TCP数据
        tcpSocket.on('data', (data) => {
            console.log(`TCP收到数据: ${data.length} 字节，来自 ${tcpSocket.remoteAddress}:${tcpSocket.remotePort} (客户端: ${clientInfo.id})`);
            sendMessage(ws, {
                type: 'tcp_data',
                data: Array.from(data),
                remoteAddress: tcpSocket.remoteAddress,
                remotePort: tcpSocket.remotePort,
                timestamp: Date.now()
            });
        });
        
        // 监听TCP连接成功
        tcpSocket.on('connect', () => {
            console.log(`TCP连接建立成功: ${tcpSocket.remoteAddress}:${tcpSocket.remotePort} (客户端: ${clientInfo.id})`);
            sendMessage(ws, {
                type: 'tcp_connected',
                remoteAddress: tcpSocket.remoteAddress,
                remotePort: tcpSocket.remotePort,
                localAddress: tcpSocket.localAddress,
                localPort: tcpSocket.localPort,
                timestamp: Date.now()
            });
        });
        
        // 监听TCP关闭
        tcpSocket.on('close', (hadError) => {
            console.log(`TCP连接关闭 (客户端: ${clientInfo.id}, 错误: ${hadError})`);
            sendMessage(ws, {
                type: 'tcp_disconnected',
                hadError: hadError,
                timestamp: Date.now()
            });
            clientInfo.tcpSocket = null;
        });
        
        // 监听TCP错误
        tcpSocket.on('error', (error) => {
            console.error(`TCP错误 (客户端 ${clientInfo.id}):`, error);
            sendError(ws, `TCP error: ${error.message}`);
            
            // 清理失败的socket
            if (clientInfo.tcpSocket === tcpSocket) {
                clientInfo.tcpSocket = null;
            }
        });
        
        // 连接到目标服务器
        tcpSocket.connect(remotePort, remoteAddress);
        
    } catch (error) {
        console.error(`TCP连接失败 (客户端 ${clientInfo.id}):`, error);
        sendError(ws, `TCP connect failed: ${error.message}`);
    }
}

// 处理TCP发送请求
function handleTCPSend(clientInfo, data) {
    const { ws, tcpSocket } = clientInfo;
    
    if (!tcpSocket) {
        sendError(ws, 'TCP not connected');
        return;
    }
    
    const { data: messageData } = data;
    
    console.log(`客户端 ${clientInfo.id} 尝试发送TCP数据:`);
    console.log(`  目标地址: ${tcpSocket.remoteAddress}:${tcpSocket.remotePort}`);
    console.log(`  数据长度: ${messageData ? messageData.length : 0} 字节`);
    
    // 验证参数
    if (!messageData || messageData.length === 0) {
        const errorMsg = 'No data to send';
        console.error(errorMsg);
        sendError(ws, errorMsg);
        return;
    }
    
    try {
        const buffer = Buffer.from(messageData);
        console.log(`  发送缓冲区创建成功，大小: ${buffer.length} 字节`);
        
        tcpSocket.write(buffer, (error) => {
            if (error) {
                console.error(`TCP发送失败 (客户端 ${clientInfo.id}):`, error);
                sendError(ws, `TCP send failed: ${error.message}`);
            } else {
                console.log(`TCP发送成功 (客户端 ${clientInfo.id}): ${buffer.length} 字节到 ${tcpSocket.remoteAddress}:${tcpSocket.remotePort}`);
                sendMessage(ws, {
                    type: 'tcp_sent',
                    bytesSent: buffer.length,
                    remoteAddress: tcpSocket.remoteAddress,
                    remotePort: tcpSocket.remotePort,
                    timestamp: Date.now()
                });
            }
        });
    } catch (error) {
        console.error(`TCP发送异常 (客户端 ${clientInfo.id}):`, error);
        sendError(ws, `TCP send error: ${error.message}`);
    }
}

// 处理TCP断开请求
function handleTCPDisconnect(clientInfo) {
    const { ws } = clientInfo;
    
    if (clientInfo.tcpSocket) {
        console.log(`主动关闭TCP连接 (客户端: ${clientInfo.id})`);
        clientInfo.tcpSocket.end();
        clientInfo.tcpSocket = null;
        sendMessage(ws, {
            type: 'tcp_disconnected',
            timestamp: Date.now()
        });
    }
}