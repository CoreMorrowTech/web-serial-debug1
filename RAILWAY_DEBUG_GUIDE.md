# Railway TCP/UDP 调试完整指南

## 📋 目录
1. [部署到Railway](#部署到railway)
2. [TCP调试](#tcp调试)
3. [UDP调试](#udp调试)
4. [API接口使用](#api接口使用)
5. [常见问题](#常见问题)
6. [高级功能](#高级功能)

---

## 🚀 部署到Railway

### 1. 准备工作
```bash
# 确保项目包含以下文件
├── udp-proxy-server.js    # 主服务器文件
├── package.json           # 依赖配置
├── Procfile              # Railway启动配置
├── railway.json          # Railway部署配置
└── README.md
```

### 2. Railway部署步骤

#### 方法一：GitHub连接部署
1. 将代码推送到GitHub仓库
2. 访问 [Railway.app](https://railway.app)
3. 点击 "Deploy from GitHub repo"
4. 选择您的仓库
5. Railway自动检测并部署

#### 方法二：Railway CLI部署
```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录Railway
railway login

# 初始化项目
railway init

# 部署
railway up
```

### 3. 环境变量配置
在Railway Dashboard中设置：
```
PORT=8080                    # 服务端口（Railway自动设置）
NODE_ENV=production         # 生产环境
RAILWAY_ENVIRONMENT=true    # Railway环境标识
```

### 4. 获取部署信息
部署成功后，您将获得：
- **公网域名**: `https://web-production-xxxxx.up.railway.app`
- **WebSocket地址**: `wss://web-production-xxxxx.up.railway.app`

---

## 🔌 TCP调试

### 1. 基本TCP连接测试

#### 使用Web界面
1. 打开您的前端页面
2. 选择 **TCP** 连接类型
3. 配置目标服务器：
   ```
   远程IP: 127.0.0.1
   远程端口: 8080
   ```
4. 点击 **"连接TCP"**
5. 查看连接日志

#### 预期日志输出
```
正在通过WebSocket代理连接TCP...
代理服务器: wss://web-production-xxxxx.up.railway.app
WebSocket代理连接成功，正在建立TCP连接...
已连接到TCP代理服务器 (客户端ID: 1234567890.123)
TCP连接成功: 127.0.0.1:8080
本地地址: 10.0.0.1:45678
```

### 2. TCP数据发送测试

#### 发送文本数据
```javascript
// 在发送框中输入
Hello TCP Server!
```

#### 发送十六进制数据
```javascript
// 切换到HEX模式，输入
48 65 6C 6C 6F 20 54 43 50
```

#### 预期响应
```
TCP数据已发送到: 127.0.0.1:8080 (17 字节)
TCP收到数据来自: 127.0.0.1:8080
[接收] Hello TCP Client!
```

### 3. TCP服务器搭建（用于测试）

#### Node.js TCP服务器
```javascript
// tcp-test-server.js
const net = require('net');

const server = net.createServer((socket) => {
    console.log('客户端连接:', socket.remoteAddress);
    
    socket.on('data', (data) => {
        console.log('收到数据:', data.toString());
        // 回显数据
        socket.write(`Echo: ${data}`);
    });
    
    socket.on('close', () => {
        console.log('客户端断开连接');
    });
});

server.listen(8080, () => {
    console.log('TCP服务器运行在端口 8080');
});
```

#### Python TCP服务器
```python
# tcp_test_server.py
import socket
import threading

def handle_client(client_socket, address):
    print(f"客户端连接: {address}")
    try:
        while True:
            data = client_socket.recv(1024)
            if not data:
                break
            print(f"收到数据: {data.decode()}")
            # 回显数据
            client_socket.send(f"Echo: {data.decode()}".encode())
    except Exception as e:
        print(f"错误: {e}")
    finally:
        client_socket.close()
        print(f"客户端断开: {address}")

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.bind(('127.0.0.1', 8080))
server.listen(5)
print("TCP服务器运行在端口 8080")

while True:
    client, address = server.accept()
    thread = threading.Thread(target=handle_client, args=(client, address))
    thread.start()
```

---

## 📡 UDP调试

### 1. 基本UDP连接测试

#### 使用Web界面
1. 选择 **UDP** 连接类型
2. 配置参数：
   ```
   远程IP: 127.0.0.1
   远程端口: 8080
   本地IP: 192.168.1.101  # 您的本地IP
   本地端口: 8081
   ```
3. 点击 **"连接UDP"**

#### 预期日志输出
```
正在通过WebSocket代理连接UDP...
代理服务器: wss://web-production-xxxxx.up.railway.app
WebSocket代理连接成功，正在建立UDP连接...
✅ 系统自动分配端口: 45123
✅ 服务器IP地址解析: 192.168.1.101 → 34.123.45.67 (云环境公网地址)
✅ UDP连接成功: 34.123.45.67:45123
📝 配置已自动更新，下次连接将使用新的地址和端口
```

### 2. UDP数据发送测试

#### 发送测试数据
```javascript
// 文本模式
Hello UDP Server!

// HEX模式
48 65 6C 6C 6F 20 55 44 50
```

### 3. UDP服务器搭建（用于测试）

#### Node.js UDP服务器
```javascript
// udp-test-server.js
const dgram = require('dgram');

const server = dgram.createSocket('udp4');

server.on('message', (msg, rinfo) => {
    console.log(`收到UDP数据: ${msg} 来自 ${rinfo.address}:${rinfo.port}`);
    
    // 回显数据
    const response = `Echo: ${msg}`;
    server.send(response, rinfo.port, rinfo.address, (err) => {
        if (err) {
            console.error('发送失败:', err);
        } else {
            console.log(`回复发送成功: ${response}`);
        }
    });
});

server.on('listening', () => {
    const address = server.address();
    console.log(`UDP服务器运行在 ${address.address}:${address.port}`);
});

server.bind(8080);
```

#### Python UDP服务器
```python
# udp_test_server.py
import socket

server = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
server.bind(('127.0.0.1', 8080))
print("UDP服务器运行在端口 8080")

while True:
    try:
        data, address = server.recvfrom(1024)
        print(f"收到UDP数据: {data.decode()} 来自 {address}")
        
        # 回显数据
        response = f"Echo: {data.decode()}"
        server.sendto(response.encode(), address)
        print(f"回复发送成功: {response}")
    except Exception as e:
        print(f"错误: {e}")
```

---

## 🔧 API接口使用

### 1. 查看连接的客户端

#### 请求
```bash
curl https://web-production-xxxxx.up.railway.app/clients
```

#### 响应
```json
{
  "clients": [
    {
      "id": 1753315482820.4314,
      "remoteAddress": "123.45.67.89",
      "clientLocalIP": "192.168.1.101",
      "clientLocalPort": 8081,
      "connectedAt": "2024-01-20T10:30:00.000Z",
      "hasUDP": true,
      "hasTCP": false
    }
  ],
  "totalClients": 1
}
```

### 2. 向客户端发送UDP数据

#### 请求
```bash
curl -X POST https://web-production-xxxxx.up.railway.app/send-to-client/1753315482820.4314 \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello from Railway server!",
    "data": [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100]
  }'
```

#### 响应
```json
{
  "success": true,
  "message": "Data sent to client 1753315482820.4314",
  "targetIP": "192.168.1.101",
  "targetPort": 8081
}
```

### 3. 服务器状态检查

#### 健康检查
```bash
curl https://web-production-xxxxx.up.railway.app/health
```

#### 详细状态
```bash
curl https://web-production-xxxxx.up.railway.app/status
```

---

## ❓ 常见问题

### 1. 连接问题

#### Q: WebSocket连接失败
**A: 检查以下项目**
- Railway服务是否正常运行
- 域名是否正确
- 网络防火墙设置
- 浏览器是否支持WebSocket

#### Q: UDP绑定失败 (EADDRNOTAVAIL)
**A: 这是正常现象**
- 云环境会自动处理IP地址转换
- 客户端配置会自动更新为正确的公网地址

#### Q: TCP连接超时
**A: 检查目标服务器**
- 目标IP和端口是否正确
- 目标服务器是否在运行
- 网络是否可达

### 2. 数据传输问题

#### Q: 数据发送失败
**A: 检查连接状态**
```javascript
// 检查UDP连接
if (!window.udpModule.isUDPConnected()) {
    console.log('UDP未连接');
}

// 检查TCP连接
if (!window.tcpModule.isTCPConnected()) {
    console.log('TCP未连接');
}
```

#### Q: 收不到数据
**A: 检查目标服务器**
- 确保目标服务器正在监听
- 检查防火墙设置
- 验证数据格式

### 3. Railway部署问题

#### Q: 部署失败
**A: 检查配置文件**
```json
// package.json
{
  "scripts": {
    "start": "node udp-proxy-server.js"
  },
  "dependencies": {
    "ws": "^8.18.3"
  }
}
```

#### Q: 环境变量问题
**A: 在Railway Dashboard设置**
- PORT (自动设置)
- NODE_ENV=production
- 其他自定义变量

---

## 🚀 高级功能

### 1. 批量测试脚本

#### JavaScript测试脚本
```javascript
// batch-test.js
async function batchTest() {
    const tests = [
        { type: 'tcp', data: 'Hello TCP 1' },
        { type: 'tcp', data: 'Hello TCP 2' },
        { type: 'udp', data: 'Hello UDP 1' },
        { type: 'udp', data: 'Hello UDP 2' }
    ];
    
    for (const test of tests) {
        if (test.type === 'tcp' && window.tcpModule.isTCPConnected()) {
            await window.tcpModule.sendTCPData(new TextEncoder().encode(test.data));
        } else if (test.type === 'udp' && window.udpModule.isUDPConnected()) {
            await window.udpModule.sendUDPData(new TextEncoder().encode(test.data));
        }
        
        // 等待1秒
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

// 运行测试
batchTest();
```

### 2. 性能监控

#### 连接监控脚本
```javascript
// monitor.js
setInterval(() => {
    fetch('https://web-production-xxxxx.up.railway.app/status')
        .then(r => r.json())
        .then(data => {
            console.log('服务器状态:', data);
            console.log('连接数:', data.connections);
            console.log('运行时间:', data.uptime);
        })
        .catch(err => console.error('监控失败:', err));
}, 30000); // 每30秒检查一次
```

### 3. 自动重连机制

#### WebSocket自动重连
```javascript
// auto-reconnect.js
function createAutoReconnectWebSocket(url) {
    let ws;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 5;
    
    function connect() {
        ws = new WebSocket(url);
        
        ws.onopen = () => {
            console.log('WebSocket连接成功');
            reconnectAttempts = 0;
        };
        
        ws.onclose = () => {
            console.log('WebSocket连接断开');
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                console.log(`尝试重连 (${reconnectAttempts}/${maxReconnectAttempts})`);
                setTimeout(connect, 3000 * reconnectAttempts);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket错误:', error);
        };
    }
    
    connect();
    return ws;
}
```

---

## 📞 技术支持

### 服务器日志查看
在Railway Dashboard中查看实时日志：
1. 进入项目页面
2. 点击 "Deployments"
3. 选择最新部署
4. 查看 "Logs" 标签

### 调试技巧
1. **开启浏览器开发者工具**
2. **查看Network标签**：监控WebSocket连接
3. **查看Console标签**：查看JavaScript错误
4. **使用Postman**：测试HTTP API接口

### 联系方式
- GitHub Issues: 在项目仓库提交问题
- 文档更新: 欢迎提交PR改进文档

---

## 📝 更新日志

### v1.0.0 (2024-01-20)
- ✅ 基础UDP代理功能
- ✅ TCP代理功能
- ✅ Railway云部署支持
- ✅ 公网IP自动获取
- ✅ 动态端口分配
- ✅ HTTP API接口
- ✅ 前端TCP/UDP配置界面

---

**🎉 恭喜！您现在拥有了一个完整的Railway TCP/UDP调试解决方案！**