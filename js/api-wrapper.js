;(function () {
    // API封装类定义
    
    // UDP类封装
    class UDP {
        constructor(remoteIP, remotePort, localIP, localPort) {
            this.remoteIP = remoteIP;
            this.remotePort = remotePort;
            this.localIP = localIP;
            this.localPort = localPort;
            this.connected = false;
            this.id = `udp_${Date.now()}_${Math.random()}`;
            
            console.log(`创建UDP实例: ${this.id}`);
            console.log(`远程地址: ${remoteIP}:${remotePort}`);
            console.log(`本地地址: ${localIP}:${localPort}`);
        }
        
        async Open() {
            try {
                // 切换到UDP模式
                document.getElementById('type-udp').checked = true;
                document.getElementById('type-udp').dispatchEvent(new Event('change'));
                
                // 设置UDP配置
                document.getElementById('udp-remote-ip').value = this.remoteIP;
                document.getElementById('udp-remote-port').value = this.remotePort;
                document.getElementById('udp-local-ip').value = this.localIP;
                document.getElementById('udp-local-port').value = this.localPort;
                
                // 触发配置更新
                document.getElementById('udp-remote-ip').dispatchEvent(new Event('change'));
                document.getElementById('udp-remote-port').dispatchEvent(new Event('change'));
                document.getElementById('udp-local-ip').dispatchEvent(new Event('change'));
                document.getElementById('udp-local-port').dispatchEvent(new Event('change'));
                
                // 连接UDP
                if (window.udpModule && window.udpModule.connectUDP) {
                    await window.udpModule.connectUDP();
                    this.connected = true;
                    addLogErr(`✅ UDP ${this.id} 连接成功`);
                    return true;
                } else {
                    throw new Error('UDP模块未加载');
                }
            } catch (error) {
                addLogErr(`❌ UDP ${this.id} 连接失败: ${error.message}`);
                return false;
            }
        }
        
        async SendData(data) {
            if (!this.connected) {
                addLogErr(`❌ UDP ${this.id} 未连接，无法发送数据`);
                return false;
            }
            
            try {
                let sendData;
                if (typeof data === 'string') {
                    sendData = new TextEncoder().encode(data);
                } else if (typeof data === 'number') {
                    sendData = new Uint8Array([data]);
                } else if (Array.isArray(data)) {
                    sendData = new Uint8Array(data);
                } else {
                    sendData = new Uint8Array(data);
                }
                
                if (window.udpModule && window.udpModule.sendUDPData) {
                    await window.udpModule.sendUDPData(sendData);
                    addLogErr(`📤 UDP ${this.id} 发送数据: ${data}`);
                    return true;
                } else {
                    throw new Error('UDP发送功能不可用');
                }
            } catch (error) {
                addLogErr(`❌ UDP ${this.id} 发送失败: ${error.message}`);
                return false;
            }
        }
        
        Close() {
            try {
                if (window.udpModule && window.udpModule.disconnectUDP) {
                    window.udpModule.disconnectUDP();
                    this.connected = false;
                    addLogErr(`🔌 UDP ${this.id} 已关闭`);
                    return true;
                }
            } catch (error) {
                addLogErr(`❌ UDP ${this.id} 关闭失败: ${error.message}`);
                return false;
            }
        }
    }
    
    // TCP类封装
    class TCP {
        constructor(remoteIP, remotePort) {
            this.remoteIP = remoteIP;
            this.remotePort = remotePort;
            this.connected = false;
            this.id = `tcp_${Date.now()}_${Math.random()}`;
            
            console.log(`创建TCP实例: ${this.id}`);
            console.log(`远程地址: ${remoteIP}:${remotePort}`);
        }
        
        async Open() {
            try {
                // 切换到TCP模式
                document.getElementById('type-tcp').checked = true;
                document.getElementById('type-tcp').dispatchEvent(new Event('change'));
                
                // 设置TCP配置
                document.getElementById('tcp-remote-ip').value = this.remoteIP;
                document.getElementById('tcp-remote-port').value = this.remotePort;
                
                // 触发配置更新
                document.getElementById('tcp-remote-ip').dispatchEvent(new Event('change'));
                document.getElementById('tcp-remote-port').dispatchEvent(new Event('change'));
                
                // 连接TCP
                if (window.tcpModule && window.tcpModule.connectTCP) {
                    await window.tcpModule.connectTCP();
                    this.connected = true;
                    addLogErr(`✅ TCP ${this.id} 连接成功`);
                    return true;
                } else {
                    throw new Error('TCP模块未加载');
                }
            } catch (error) {
                addLogErr(`❌ TCP ${this.id} 连接失败: ${error.message}`);
                return false;
            }
        }
        
        async SendData(data) {
            if (!this.connected) {
                addLogErr(`❌ TCP ${this.id} 未连接，无法发送数据`);
                return false;
            }
            
            try {
                let sendData;
                if (typeof data === 'string') {
                    sendData = new TextEncoder().encode(data);
                } else if (typeof data === 'number') {
                    sendData = new Uint8Array([data]);
                } else if (Array.isArray(data)) {
                    sendData = new Uint8Array(data);
                } else {
                    sendData = new Uint8Array(data);
                }
                
                if (window.tcpModule && window.tcpModule.sendTCPData) {
                    await window.tcpModule.sendTCPData(sendData);
                    addLogErr(`📤 TCP ${this.id} 发送数据: ${data}`);
                    return true;
                } else {
                    throw new Error('TCP发送功能不可用');
                }
            } catch (error) {
                addLogErr(`❌ TCP ${this.id} 发送失败: ${error.message}`);
                return false;
            }
        }
        
        Close() {
            try {
                if (window.tcpModule && window.tcpModule.disconnectTCP) {
                    window.tcpModule.disconnectTCP();
                    this.connected = false;
                    addLogErr(`🔌 TCP ${this.id} 已关闭`);
                    return true;
                }
            } catch (error) {
                addLogErr(`❌ TCP ${this.id} 关闭失败: ${error.message}`);
                return false;
            }
        }
    }
    
    // COM类封装（串口）
    class COM {
        constructor(port, baudRate, dataBits = 8, stopBits = 1, parity = "none") {
            this.port = port;
            this.baudRate = baudRate;
            this.dataBits = dataBits;
            this.stopBits = stopBits;
            this.parity = parity;
            this.connected = false;
            this.id = `com_${Date.now()}_${Math.random()}`;
            
            console.log(`创建COM实例: ${this.id}`);
            console.log(`串口配置: ${port}, ${baudRate}, ${dataBits}, ${stopBits}, ${parity}`);
        }
        
        async Open() {
            try {
                // 切换到串口模式
                document.getElementById('type-serial').checked = true;
                document.getElementById('type-serial').dispatchEvent(new Event('change'));
                
                // 设置串口配置
                document.getElementById('serial-baud').value = this.baudRate;
                document.getElementById('serial-data-bits').value = this.dataBits;
                document.getElementById('serial-stop-bits').value = this.stopBits;
                document.getElementById('serial-parity').value = this.parity;
                
                // 触发配置更新
                document.getElementById('serial-baud').dispatchEvent(new Event('change'));
                document.getElementById('serial-data-bits').dispatchEvent(new Event('change'));
                document.getElementById('serial-stop-bits').dispatchEvent(new Event('change'));
                document.getElementById('serial-parity').dispatchEvent(new Event('change'));
                
                addLogErr(`🔌 正在连接串口 ${this.port}...`);
                addLogErr(`📋 串口配置: ${this.baudRate} baud, ${this.dataBits}${this.parity[0].toUpperCase()}${this.stopBits}`);
                
                // 直接连接到指定的串口
                if (!navigator.serial) {
                    throw new Error('浏览器不支持Web Serial API');
                }
                
                // 获取所有可用的串口
                const ports = await navigator.serial.getPorts();
                let targetPort = null;
                
                // 尝试找到匹配的串口
                for (const port of ports) {
                    const info = port.getInfo();
                    // 这里可以根据需要添加更多的匹配逻辑
                    // 由于Web Serial API的限制，我们无法直接通过COM端口名匹配
                    // 所以我们使用第一个可用的端口，或者让用户选择
                    if (ports.length > 0) {
                        targetPort = ports[0]; // 使用第一个已授权的端口
                        break;
                    }
                }
                
                // 如果没有找到已授权的端口，请求用户选择
                if (!targetPort) {
                    addLogErr(`📌 未找到已授权的串口，请选择 ${this.port}`);
                    targetPort = await navigator.serial.requestPort();
                }
                
                // 配置串口参数
                const serialOptions = {
                    baudRate: this.baudRate,
                    dataBits: this.dataBits,
                    stopBits: this.stopBits,
                    parity: this.parity
                };
                
                // 打开串口
                await targetPort.open(serialOptions);
                
                // 保存串口引用到全局变量（与现有代码兼容）
                window.serialPort = targetPort;
                
                this.connected = true;
                addLogErr(`✅ COM ${this.id} 连接成功`);
                addLogErr(`🔗 串口 ${this.port} 已打开`);
                
                // 更新UI状态
                const statusDiv = document.getElementById('serial-status');
                if (statusDiv) {
                    statusDiv.innerHTML = '<div class="alert alert-success" role="alert">串口已连接</div>';
                }
                
                const button = document.getElementById('serial-open-or-close');
                if (button) {
                    button.textContent = '关闭串口';
                    button.classList.remove('btn-primary');
                    button.classList.add('btn-danger');
                }
                
                return true;
                
            } catch (error) {
                addLogErr(`❌ COM ${this.id} 连接失败: ${error.message}`);
                if (error.name === 'NotFoundError') {
                    addLogErr(`💡 提示: 请确保 ${this.port} 设备已连接并且驱动程序已安装`);
                } else if (error.name === 'SecurityError') {
                    addLogErr(`🔒 安全错误: 请在HTTPS环境下使用，或者用户取消了端口选择`);
                } else if (error.name === 'NetworkError') {
                    addLogErr(`🔌 网络错误: 串口可能已被其他应用程序占用`);
                }
                return false;
            }
        }
        
        async SendData(data) {
            if (!this.connected) {
                addLogErr(`❌ COM ${this.id} 未连接，无法发送数据`);
                return false;
            }
            
            try {
                let sendData;
                if (typeof data === 'string') {
                    sendData = new TextEncoder().encode(data);
                } else if (typeof data === 'number') {
                    sendData = new Uint8Array([data]);
                } else if (Array.isArray(data)) {
                    sendData = new Uint8Array(data);
                } else {
                    sendData = new Uint8Array(data);
                }
                
                if (window.serialPort && window.serialPort.writable) {
                    const writer = window.serialPort.writable.getWriter();
                    await writer.write(sendData);
                    writer.releaseLock();
                    addLogErr(`📤 COM ${this.id} 发送数据: ${data}`);
                    return true;
                } else {
                    throw new Error('串口不可写入');
                }
            } catch (error) {
                addLogErr(`❌ COM ${this.id} 发送失败: ${error.message}`);
                return false;
            }
        }
        
        async Close() {
            try {
                if (window.serialPort && this.connected) {
                    addLogErr(`🔌 正在关闭串口 ${this.port}...`);
                    
                    // 直接关闭串口
                    await window.serialPort.close();
                    window.serialPort = null;
                    
                    this.connected = false;
                    addLogErr(`✅ COM ${this.id} 已关闭`);
                    
                    // 更新UI状态
                    const statusDiv = document.getElementById('serial-status');
                    if (statusDiv) {
                        statusDiv.innerHTML = '<div class="alert alert-info" role="alert">未选择串口</div>';
                    }
                    
                    const button = document.getElementById('serial-open-or-close');
                    if (button) {
                        button.textContent = '打开串口';
                        button.classList.remove('btn-danger');
                        button.classList.add('btn-primary');
                    }
                    
                    return true;
                } else {
                    addLogErr(`⚠️ COM ${this.id} 未连接，无需关闭`);
                    return true;
                }
            } catch (error) {
                addLogErr(`❌ COM ${this.id} 关闭失败: ${error.message}`);
                return false;
            }
        }
    }
    
    // 代码执行器
    class CodeExecutor {
        constructor() {
            this.instances = new Map();
        }
        
        // 解析并执行代码
        async executeCode(code) {
            try {
                addLogErr('🚀 开始执行代码...');
                addLogErr('📝 代码内容:');
                addLogErr(code);
                addLogErr('─'.repeat(50));
                
                // 创建安全的执行环境
                const context = {
                    UDP: UDP,
                    TCP: TCP,
                    COM: COM,
                    console: console,
                    setTimeout: setTimeout,
                    setInterval: setInterval,
                    clearTimeout: clearTimeout,
                    clearInterval: clearInterval,
                    Promise: Promise
                };
                
                // 将代码包装在async函数中
                const wrappedCode = `
                    return (async function() {
                        ${code}
                    })();
                `;
                
                // 使用Function构造器创建安全的执行环境
                const func = new Function(...Object.keys(context), wrappedCode);
                const result = await func(...Object.values(context));
                
                addLogErr('✅ 代码执行完成');
                return result;
            } catch (error) {
                addLogErr(`❌ 代码执行错误: ${error.message}`);
                console.error('代码执行错误:', error);
                throw error;
            }
        }
        
        // 执行预定义的示例代码
        async executeExample(type) {
            let exampleCode = '';
            
            switch (type) {
                case 'udp':
                    exampleCode = `
// UDP示例代码
console.log("🚀 开始UDP测试...");
const udp1 = new UDP("127.0.0.1", 8080, "192.168.1.101", 8081);
await udp1.Open();
await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
await udp1.SendData("Hello UDP Server!");
await udp1.SendData([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello" 的十六进制
await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
udp1.Close();
console.log("✅ UDP测试完成!");
                    `;
                    break;
                    
                case 'tcp':
                    exampleCode = `
// TCP示例代码
console.log("🚀 开始TCP测试...");
const tcp1 = new TCP("127.0.0.1", 8080);
await tcp1.Open();
await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
await tcp1.SendData("Hello TCP Server!");
await tcp1.SendData(65); // 发送字符 'A'
await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
tcp1.Close();
console.log("✅ TCP测试完成!");
                    `;
                    break;
                    
                case 'com':
                    exampleCode = `
// 串口示例代码
console.log("🚀 开始串口测试...");
const com1 = new COM("COM3", 115200, 8, 1, "none");

// 直接连接到指定串口
await com1.Open();

// 发送文本数据
await com1.SendData("Hello Serial Port!");

// 发送数字数据
await com1.SendData(67); // 发送字符 'C'

// 发送字节数组
await com1.SendData([0x41, 0x42, 0x43]); // "ABC"

// 等待一段时间
await new Promise(resolve => setTimeout(resolve, 1000));

// 关闭串口
await com1.Close();
console.log("✅ 串口测试完成!");
                    `;
                    break;
                    
                default:
                    exampleCode = `
// 综合示例代码
console.log("🚀 开始综合测试...");

// 1. UDP测试
console.log("📡 UDP通信测试");
const udp1 = new UDP("127.0.0.1", 8080, "192.168.1.101", 8081);
await udp1.Open();
await udp1.SendData("UDP Test Message");
udp1.Close();

await new Promise(resolve => setTimeout(resolve, 2000));

// 2. TCP测试
console.log("🔌 TCP通信测试");
const tcp1 = new TCP("127.0.0.1", 8080);
await tcp1.Open();
await tcp1.SendData("TCP Test Message");
tcp1.Close();

console.log("✅ 综合测试完成!");
                    `;
            }
            
            return await this.executeCode(exampleCode);
        }
    }
    
    // 创建全局实例
    window.codeExecutor = new CodeExecutor();
    
    // 导出类供全局使用
    window.UDP = UDP;
    window.TCP = TCP;
    window.COM = COM;
    
    // 添加到现有的代码编辑器
    if (window.addCodeExecutionSupport) {
        window.addCodeExecutionSupport();
    }
    
    addLogErr('📚 API封装模块已加载');
    addLogErr('💡 支持的类: UDP, TCP, COM');
    addLogErr('🔧 使用方法: 在代码编辑器中编写代码并执行');
    
})();