;(function () {
	if (!('serial' in navigator)) {
		alert('当前浏览器不支持串口操作,请更换Edge或Chrome浏览器')
	}
	let serialPort = null
	navigator.serial.getPorts().then((ports) => {
		if (ports.length > 0) {
			serialPort = ports[0]
			serialStatuChange(true)
		}
	})
	let reader
	//串口目前是打开状态
	let serialOpen = false
	//串口目前是手动关闭状态
	let serialClose = true
	//串口分包合并时钟
	let serialTimer = null
	//串口循环发送时钟
	let serialloopSendTimer = null
	//串口缓存数据
	let serialData = []
	//文本解码
	let textdecoder = new TextDecoder()
	let currQuickSend = []
	//快捷发送列表
	let quickSendList = [
		{
			name: '指令',
			list: [
				{
					name: '测试 AT 启动',
					content: 'AT',
					hex: false,
				},
				{
					name: '重启模块',
					content: 'AT+RST',
					hex: false,
				}
				
			],
		},
	]
	let worker = null
	//工具配置
	let toolOptions = {
		//自动滚动
		autoScroll: true,
		//显示时间 界面未开放
		showTime: true,
		//日志类型
		logType: 'hex&text',
		//分包合并时间
		timeOut: 50,
		//末尾加回车换行
		addCRLF: false,
		//HEX发送
		hexSend: false,
		//循环发送
		loopSend: false,
		//循环发送时间
		loopSendTime: 1000,
		//输入的发送内容
		sendContent: '',
		//快捷发送选中索引
		quickSendIndex: 0,
	}

	//生成快捷发送列表
	let quickSend = document.getElementById('serial-quick-send')
	let sendList = localStorage.getItem('quickSendList')
	if (sendList) {
		quickSendList = JSON.parse(sendList)
	}
	quickSendList.forEach((item, index) => {
		let option = document.createElement('option')
		option.innerText = item.name
		option.value = index
		quickSend.appendChild(option)
	})

	//快捷发送列表被单击
	document.getElementById('serial-quick-send-content').addEventListener('click', (e) => {
		let curr = e.target
		if (curr.tagName != 'BUTTON') {
			curr = curr.parentNode
		}
		if (curr.tagName != 'BUTTON') {
			return
		}
		const index = Array.from(curr.parentNode.parentNode.children).indexOf(curr.parentNode)
		if (curr.classList.contains('quick-remove')) {
			currQuickSend.list.splice(index, 1)
			curr.parentNode.remove()
			saveQuickList()
			return
		}
		if (curr.classList.contains('quick-send')) {
			let item = currQuickSend.list[index]
			if (item.hex) {
				sendHex(item.content)
				return
			}
			sendText(item.content)
		}
	})
	//快捷列表双击改名
	document.getElementById('serial-quick-send-content').addEventListener('dblclick', (e) => {
		let curr = e.target
		if (curr.tagName != 'INPUT' || curr.type != 'text') {
			return
		}
		const index = Array.from(curr.parentNode.parentNode.children).indexOf(curr.parentNode)
		changeName((name) => {
			currQuickSend.list[index].name = name
			curr.parentNode.outerHTML = getQuickItemHtml(currQuickSend.list[index])
			saveQuickList()
		}, currQuickSend.list[index].name)
	})
	//快捷发送列表被改变
	document.getElementById('serial-quick-send-content').addEventListener('change', (e) => {
		let curr = e.target
		if (curr.tagName != 'INPUT') {
			return
		}
		const index = Array.from(curr.parentNode.parentNode.children).indexOf(curr.parentNode)
		if (curr.type == 'text') {
			currQuickSend.list[index].content = curr.value
		}
		if (curr.type == 'checkbox') {
			currQuickSend.list[index].hex = curr.checked
		}
		saveQuickList()
	})
	function saveQuickList() {
		localStorage.setItem('quickSendList', JSON.stringify(quickSendList))
	}

	const quickSendContent = document.getElementById('serial-quick-send-content')
	//快捷发送列表更换选项
	quickSend.addEventListener('change', (e) => {
		let index = e.target.value
		if (index != -1) {
			changeOption('quickSendIndex', index)
			currQuickSend = quickSendList[index]
			//
			quickSendContent.innerHTML = ''
			currQuickSend.list.forEach((item) => {
				quickSendContent.innerHTML += getQuickItemHtml(item)
			})
		}
	})
	//添加快捷发送
	document.getElementById('serial-quick-send-add').addEventListener('click', (e) => {
		const item = {
			name: '发送',
			content: '',
			hex: false,
		}
		currQuickSend.list.push(item)
		quickSendContent.innerHTML += getQuickItemHtml(item)
		saveQuickList()
	})
	function getQuickItemHtml(item) {
		return `<div class="d-flex p-1 border-bottom quick-item">
			<button type="button" title="移除该项" class="btn btn-sm btn-outline-secondary me-1 quick-remove"><i class="bi bi-x"></i></button>
			<input class="form-control form-control-sm me-1" placeholder="要发送的内容,双击改名" value="${item.content}">
			<button class="flex-shrink-0 me-1 align-self-center btn btn-secondary btn-sm  quick-send" title="${item.name}">${item.name}</button>
			<input class="form-check-input flex-shrink-0 align-self-center" type="checkbox" ${item.hex ? 'checked' : ''}>
		</div>`
	}
	//快捷发送分组新增
	document.getElementById('serial-quick-send-add-group').addEventListener('click', (e) => {
		changeName((name) => {
			quickSendList.push({
				name: name,
				list: [],
			})
			quickSend.innerHTML += `<option value="${quickSendList.length - 1}">${name}</option>`
			quickSend.value = quickSendList.length - 1
			quickSend.dispatchEvent(new Event('change'))
			saveQuickList()
		})
	})
	//快捷发送分组重命名
	document.getElementById('serial-quick-send-rename-group').addEventListener('click', (e) => {
		changeName((name) => {
			currQuickSend.name = name
			quickSend.options[quickSend.value].innerText = name
			saveQuickList()
		}, currQuickSend.name)
	})
	//快捷发送分组删除
	document.getElementById('serial-quick-send-remove-group').addEventListener('click', (e) => {
		if (quickSendList.length == 1) {
			return
		}
		//弹窗询问是否删除
		if (!confirm('是否删除该分组?')) {
			return
		}
		quickSendList.splice(quickSend.value, 1)
		quickSend.options[quickSend.value].remove()
		quickSend.value = 0
		quickSend.dispatchEvent(new Event('change'))
		saveQuickList()
	})

	//导出
	document.getElementById('serial-quick-send-export').addEventListener('click', (e) => {
		let data = JSON.stringify(currQuickSend.list)
		let blob = new Blob([data], { type: 'text/plain' })
		saveAs(blob, currQuickSend.name + '.json')
	})
	//导入
	document.getElementById('serial-quick-send-import-btn').addEventListener('click', (e) => {
		document.getElementById('serial-quick-send-import').click()
	})
	document.getElementById('serial-quick-send-import').addEventListener('change', (e) => {
		let file = e.target.files[0]
		e.target.value = ''
		let reader = new FileReader()
		reader.onload = function (e) {
			let data = e.target.result
			try {
				let list = JSON.parse(data)
				currQuickSend.list.push(...list)
				list.forEach((item) => {
					quickSendContent.innerHTML += getQuickItemHtml(item)
				})
				saveQuickList()
			} catch (e) {
				showMsg('导入失败:' + e.message)
			}
		}
		reader.readAsText(file)
	})
	//重置参数
	document.getElementById('serial-reset').addEventListener('click', (e) => {
		if (!confirm('是否重置参数?')) {
			return
		}
		localStorage.removeItem('serialOptions')
		localStorage.removeItem('toolOptions')
		localStorage.removeItem('quickSendList')
		localStorage.removeItem('code')
		location.reload()
	})
	//导出参数
	document.getElementById('serial-export').addEventListener('click', (e) => {
		let data = {
			serialOptions: localStorage.getItem('serialOptions'),
			toolOptions: localStorage.getItem('toolOptions'),
			quickSendList: localStorage.getItem('quickSendList'),
			code: localStorage.getItem('code'),
		}
		let blob = new Blob([JSON.stringify(data)], { type: 'text/plain' })
		saveAs(blob, 'web-serial-debug.json')
	})
	//导入参数
	document.getElementById('serial-import').addEventListener('click', (e) => {
		document.getElementById('serial-import-file').click()
	})
	function setParam(key, value) {
		if (value == null) {
			localStorage.removeItem(key)
		} else {
			localStorage.setItem(key, value)
		}
	}
	document.getElementById('serial-import-file').addEventListener('change', (e) => {
		let file = e.target.files[0]
		e.target.value = ''
		let reader = new FileReader()
		reader.onload = function (e) {
			let data = e.target.result
			try {
				let obj = JSON.parse(data)
				setParam('serialOptions', obj.serialOptions)
				setParam('toolOptions', obj.toolOptions)
				setParam('quickSendList', obj.quickSendList)
				setParam('code', obj.code)
				location.reload()
			} catch (e) {
				showMsg('导入失败:' + e.message)
			}
		}
		reader.readAsText(file)
	})
	const serialCodeContent = document.getElementById('serial-code-content')
	const serialCodeSelect = document.getElementById('serial-code-select')
	const code = localStorage.getItem('code')
	if (code) {
		serialCodeContent.value = code
	}
	//代码编辑器
	var editor = CodeMirror.fromTextArea(serialCodeContent, {
		lineNumbers: true, // 显示行数
		indentUnit: 4, // 缩进单位为4
		styleActiveLine: true, // 当前行背景高亮
		matchBrackets: true, // 括号匹配
		mode: 'javascript', // 设置编辑器语言为JavaScript
		// lineWrapping: true,    // 自动换行
		theme: 'idea', // 主题
	})
	//读取本地文件
	serialCodeSelect.onchange = function (e) {
		var fr = new FileReader()
		fr.onload = function () {
			editor.setValue(fr.result)
		}
		fr.readAsText(this.files[0])
	}
	document.getElementById('serial-code-load').onclick = function () {
		serialCodeSelect.click()
	}
	//运行或停止脚本
	const code_editor_run = document.getElementById('serial-code-run')
	code_editor_run.addEventListener('click', (e) => {
		if (worker) {
			worker.terminate()
			worker = null
			code_editor_run.innerHTML = '<i class="bi bi-play"></i>运行'
			editor.setOption('readOnly', false)
			editor.getWrapperElement().classList.remove('CodeMirror-readonly')
			return
		}
		editor.setOption('readOnly', 'nocursor')
		editor.getWrapperElement().classList.add('CodeMirror-readonly')
		localStorage.setItem('code', editor.getValue())
		code_editor_run.innerHTML = '<i class="bi bi-stop"></i>停止'
		var blob = new Blob([editor.getValue()], { type: 'text/javascript' })
		worker = new Worker(window.URL.createObjectURL(blob))
		worker.onmessage = function (e) {
			if (e.data.type == 'uart_send') {
				writeData(new Uint8Array(e.data.data))
			} else if (e.data.type == 'uart_send_hex') {
				sendHex(e.data.data)
			} else if (e.data.type == 'uart_send_txt') {
				sendText(e.data.data)
			} else if (e.data.type == 'log') {
				addLogErr(e.data.data)
			}
		}
	})

	// API代码执行按钮
	const api_code_run = document.getElementById('api-code-run')
	if (api_code_run) {
		api_code_run.addEventListener('click', async (e) => {
			if (worker) {
				worker.terminate()
				worker = null
				api_code_run.innerHTML = '<i class="bi bi-lightning"></i>执行API'
				editor.setOption('readOnly', false)
				editor.getWrapperElement().classList.remove('CodeMirror-readonly')
				return
			}
			
			try {
				editor.setOption('readOnly', 'nocursor')
				editor.getWrapperElement().classList.add('CodeMirror-readonly')
				localStorage.setItem('code', editor.getValue())
				api_code_run.innerHTML = '<i class="bi bi-stop"></i>停止'
				
				// 使用API封装执行器执行代码
				if (window.codeExecutor) {
					await window.codeExecutor.executeCode(editor.getValue())
				} else {
					addLogErr('❌ API封装模块未加载')
				}
			} catch (error) {
				addLogErr(`❌ API代码执行错误: ${error.message}`)
			} finally {
				api_code_run.innerHTML = '<i class="bi bi-lightning"></i>执行API'
				editor.setOption('readOnly', false)
				editor.getWrapperElement().classList.remove('CodeMirror-readonly')
			}
		})
	}

	// 显示API执行按钮
	function showAPIButton() {
		const apiButton = document.getElementById('api-code-run')
		if (apiButton) {
			apiButton.style.display = 'inline-block'
			addLogErr('💡 已加载API示例代码，点击"执行API"按钮运行')
		}
	}

	// API示例按钮事件
	const exampleButtons = {
		'example-udp': () => `// UDP API示例代码
console.log("🚀 开始UDP测试...");
const udp1 = new UDP("192.168.1.101", 8080, "192.168.1.101", 8081);

// 打开UDP连接
await udp1.Open();

// 等待连接建立
await new Promise(resolve => setTimeout(resolve, 2000));

// 发送文本数据
await udp1.SendData("Hello UDP Server!");

// 发送数字数据
await udp1.SendData(65); // 发送字符 'A'

// 发送十六进制数组
await udp1.SendData([0x48, 0x65, 0x6C, 0x6C, 0x6F]); // "Hello"

// 等待一段时间
await new Promise(resolve => setTimeout(resolve, 1000));

// 关闭连接
udp1.Close();
console.log("✅ UDP测试完成!");`,

		'example-tcp': () => `// TCP API示例代码
console.log("🚀 开始TCP测试...");
const tcp1 = new TCP("192.168.1.101", 8080);

// 打开TCP连接
await tcp1.Open();

// 等待连接建立
await new Promise(resolve => setTimeout(resolve, 2000));

// 发送文本数据
await tcp1.SendData("Hello TCP Server!");

// 发送数字数据
await tcp1.SendData(66); // 发送字符 'B'

// 发送字节数组
await tcp1.SendData([0x54, 0x43, 0x50]); // "TCP"

// 等待一段时间
await new Promise(resolve => setTimeout(resolve, 1000));

// 关闭连接
tcp1.Close();
console.log("✅ TCP测试完成!");`,

		'example-com': () => `// 串口 API示例代码
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
console.log("✅ 串口测试完成!");`,

		'example-comprehensive': () => `// 综合API示例代码
console.log("🚀 开始综合通信测试...");

// 1. UDP通信测试
console.log("📡 UDP通信测试");
const udp1 = new UDP("192.168.1.101", 8080, "192.168.1.101", 8081);
await udp1.Open();
await new Promise(resolve => setTimeout(resolve, 2000));
await udp1.SendData("UDP: Hello World!");
udp1.Close();

// 等待间隔
await new Promise(resolve => setTimeout(resolve, 2000));

// 2. TCP通信测试
console.log("🔌 TCP通信测试");
const tcp1 = new TCP("192.168.1.101", 8080);
await tcp1.Open();
await new Promise(resolve => setTimeout(resolve, 2000));
await tcp1.SendData("TCP: Hello World!");
tcp1.Close();

// 等待间隔
await new Promise(resolve => setTimeout(resolve, 2000));

// 3. 串口通信测试
console.log("🔗 串口通信测试");
const com1 = new COM("COM3", 115200, 8, 1, "none");
await com1.Open();
await com1.SendData("COM: Hello World!");
await com1.Close();

console.log("✅ 综合测试完成!");`
	}

	// 绑定示例按钮事件
	Object.keys(exampleButtons).forEach(buttonId => {
		const button = document.getElementById(buttonId)
		if (button) {
			button.addEventListener('click', (e) => {
				e.preventDefault()
				const exampleCode = exampleButtons[buttonId]()
				editor.setValue(exampleCode)
				showAPIButton()
			})
		}
	})
	//读取参数
	let options = localStorage.getItem('serialOptions')
	if (options) {
		let serialOptions = JSON.parse(options)
		set('serial-baud', serialOptions.baudRate)
		set('serial-data-bits', serialOptions.dataBits)
		set('serial-stop-bits', serialOptions.stopBits)
		set('serial-parity', serialOptions.parity)
		set('serial-buffer-size', serialOptions.bufferSize)
		set('serial-flow-control', serialOptions.flowControl)
	}
	options = localStorage.getItem('toolOptions')
	if (options) {
		toolOptions = JSON.parse(options)
	}
	document.getElementById('serial-timer-out').value = toolOptions.timeOut
	document.getElementById('serial-log-type').value = toolOptions.logType
	document.getElementById('serial-auto-scroll').innerText = toolOptions.autoScroll ? '自动滚动' : '暂停滚动'
	document.getElementById('serial-add-crlf').checked = toolOptions.addCRLF
	document.getElementById('serial-hex-send').checked = toolOptions.hexSend
	document.getElementById('serial-loop-send').checked = toolOptions.loopSend
	document.getElementById('serial-loop-send-time').value = toolOptions.loopSendTime
	document.getElementById('serial-send-content').value = toolOptions.sendContent
	quickSend.value = toolOptions.quickSendIndex
	quickSend.dispatchEvent(new Event('change'))
	resetLoopSend()

	//实时修改选项
	document.getElementById('serial-timer-out').addEventListener('change', (e) => {
		changeOption('timeOut', parseInt(e.target.value))
	})
	document.getElementById('serial-log-type').addEventListener('change', (e) => {
		changeOption('logType', e.target.value)
		if (e.target.value.includes('ansi')) {
			serialLogs.classList.add('ansi')
		} else {
			serialLogs.classList.remove('ansi')
		}
	})
	document.getElementById('serial-auto-scroll').addEventListener('click', function (e) {
		let autoScroll = this.innerText != '自动滚动'
		this.innerText = autoScroll ? '自动滚动' : '暂停滚动'
		changeOption('autoScroll', autoScroll)
	})
	document.getElementById('serial-send-content').addEventListener('change', function (e) {
		changeOption('sendContent', this.value)
	})
	document.getElementById('serial-add-crlf').addEventListener('change', function (e) {
		changeOption('addCRLF', this.checked)
	})
	document.getElementById('serial-hex-send').addEventListener('change', function (e) {
		changeOption('hexSend', this.checked)
	})
	document.getElementById('serial-loop-send').addEventListener('change', function (e) {
		changeOption('loopSend', this.checked)
		resetLoopSend()
	})
	document.getElementById('serial-loop-send-time').addEventListener('change', function (e) {
		changeOption('loopSendTime', parseInt(this.value))
		resetLoopSend()
	})

	document.querySelectorAll('#serial-options .input-group input,#serial-options .input-group select').forEach((item) => {
		item.addEventListener('change', async (e) => {
			if (!serialOpen) {
				return
			}
			//未找到API可以动态修改串口参数,先关闭再重新打开
			await closeSerial()
			//立即打开会提示串口已打开,延迟50ms再打开
			setTimeout(() => {
				openSerial()
			}, 50)
		})
	})

	//重制发送循环时钟
	function resetLoopSend() {
		clearInterval(serialloopSendTimer)
		if (toolOptions.loopSend) {
			serialloopSendTimer = setInterval(() => {
				send()
			}, toolOptions.loopSendTime)
		}
	}

	//清空
	document.getElementById('serial-clear').addEventListener('click', (e) => {
		serialLogs.innerHTML = ''
	})
	//复制
	document.getElementById('serial-copy').addEventListener('click', (e) => {
		let text = serialLogs.innerText
		if (text) {
			copyText(text)
		}
	})
	//保存
	document.getElementById('serial-save').addEventListener('click', (e) => {
		let text = serialLogs.innerText
		if (text) {
			saveText(text)
		}
	})
	//发送
	document.getElementById('serial-send').addEventListener('click', (e) => {
		send()
	})

	const serialToggle = document.getElementById('serial-open-or-close')
	const serialLogs = document.getElementById('serial-logs')

	//选择串口
	document.getElementById('serial-select-port').addEventListener('click', async () => {
		// 客户端授权
		try {
			await navigator.serial.requestPort().then(async (port) => {
				closeSerial()
				serialPort = port
				serialStatuChange(true)
			})
		} catch (e) {
			console.error('获取串口权限出错' + e.toString())
		}
	})

	//关闭串口
	async function closeSerial() {
		if (serialOpen) {
			serialOpen = false
			reader?.cancel()
			serialToggle.innerHTML = '打开串口'
		}
	}

	//打开串口
	async function openSerial() {
		let SerialOptions = {
			baudRate: parseInt(get('serial-baud')),
			dataBits: parseInt(get('serial-data-bits')),
			stopBits: parseInt(get('serial-stop-bits')),
			parity: get('serial-parity'),
			bufferSize: parseInt(get('serial-buffer-size')),
			flowControl: get('serial-flow-control'),
		}
		// console.log('串口配置', JSON.stringify(SerialOptions))
		serialPort
			.open(SerialOptions)
			.then(() => {
				serialToggle.innerHTML = '关闭串口'
				serialOpen = true
				serialClose = false
				localStorage.setItem('serialOptions', JSON.stringify(SerialOptions))
				readData()
			})
			.catch((e) => {
				showMsg('打开串口失败:' + e.toString())
			})
	}

	//打开或关闭串口
	serialToggle.addEventListener('click', async () => {
		if (!serialPort) {
			showMsg('请先选择串口')
			return
		}

		if (serialPort.writable && serialPort.readable) {
			closeSerial()
			serialClose = true
			return
		}

		openSerial()
	})

	//设置读取元素
	function get(id) {
		return document.getElementById(id).value
	}
	function set(id, value) {
		return (document.getElementById(id).value = value)
	}

	//修改参数并保存
	function changeOption(key, value) {
		toolOptions[key] = value
		localStorage.setItem('toolOptions', JSON.stringify(toolOptions))
	}

	//串口事件监听
	navigator.serial.addEventListener('connect', (e) => {
		serialStatuChange(true)
		serialPort = e.target
		//未主动关闭连接的情况下,设备重插,自动重连
		if (!serialClose) {
			openSerial()
		}
	})
	navigator.serial.addEventListener('disconnect', (e) => {
		serialStatuChange(false)
		setTimeout(closeSerial, 500)
	})
	function serialStatuChange(statu) {
		let tip
		if (statu) {
			tip = '<div class="alert alert-success" role="alert">设备已连接</div>'
		} else {
			tip = '<div class="alert alert-danger" role="alert">设备已断开</div>'
		}
		document.getElementById('serial-status').innerHTML = tip
	}
	//数据收发 (支持串口和UDP)
	async function send() {
		let content = document.getElementById('serial-send-content').value
		if (!content) {
			addLogErr('发送内容为空')
			return
		}
		
		// 检查当前连接类型
		let connectionType = 'serial';
		if (window.udpModule && window.udpModule.getCurrentConnectionType) {
			connectionType = window.udpModule.getCurrentConnectionType();
		} else if (window.tcpModule && window.tcpModule.getCurrentConnectionType) {
			connectionType = window.tcpModule.getCurrentConnectionType();
		}
		
		if (connectionType === 'udp') {
			// UDP发送
			if (!window.udpModule.isUDPConnected()) {
				addLogErr('请先连接UDP')
				return
			}
			if (toolOptions.hexSend) {
				await sendHexUDP(content)
			} else {
				await sendTextUDP(content)
			}
		} else if (connectionType === 'tcp') {
			// TCP发送
			if (!window.tcpModule.isTCPConnected()) {
				addLogErr('请先连接TCP')
				return
			}
			if (toolOptions.hexSend) {
				await sendHexTCP(content)
			} else {
				await sendTextTCP(content)
			}
		} else {
			// 串口发送
			if (toolOptions.hexSend) {
				await sendHex(content)
			} else {
				await sendText(content)
			}
		}
	}

	//发送HEX到串口
	async function sendHex(hex) {
		const value = hex.replace(/\s+/g, '')
		if (/^[0-9A-Fa-f]+$/.test(value) && value.length % 2 === 0) {
			let data = []
			for (let i = 0; i < value.length; i = i + 2) {
				data.push(parseInt(value.substring(i, i + 2), 16))
			}
			await writeData(Uint8Array.from(data))
		} else {
			addLogErr('HEX格式错误:' + hex)
		}
	}

	//发送文本到串口
	async function sendText(text) {
		const encoder = new TextEncoder()
		writeData(encoder.encode(text))
	}

	//发送HEX到UDP
	async function sendHexUDP(hex) {
		const value = hex.replace(/\s+/g, '')
		if (/^[0-9A-Fa-f]+$/.test(value) && value.length % 2 === 0) {
			let data = []
			for (let i = 0; i < value.length; i = i + 2) {
				data.push(parseInt(value.substring(i, i + 2), 16))
			}
			await window.udpModule.sendUDPData(Uint8Array.from(data))
		} else {
			addLogErr('HEX格式错误:' + hex)
		}
	}

	//发送文本到UDP
	async function sendTextUDP(text) {
		const encoder = new TextEncoder()
		let data = encoder.encode(text)
		if (toolOptions.addCRLF) {
			data = new Uint8Array([...data, 0x0d, 0x0a])
		}
		await window.udpModule.sendUDPData(data)
	}

	//发送HEX到TCP
	async function sendHexTCP(hex) {
		const value = hex.replace(/\s+/g, '')
		if (/^[0-9A-Fa-f]+$/.test(value) && value.length % 2 === 0) {
			let data = []
			for (let i = 0; i < value.length; i = i + 2) {
				data.push(parseInt(value.substring(i, i + 2), 16))
			}
			await window.tcpModule.sendTCPData(Uint8Array.from(data))
		} else {
			addLogErr('HEX格式错误:' + hex)
		}
	}

	//发送文本到TCP
	async function sendTextTCP(text) {
		const encoder = new TextEncoder()
		let data = encoder.encode(text)
		if (toolOptions.addCRLF) {
			data = new Uint8Array([...data, 0x0d, 0x0a])
		}
		await window.tcpModule.sendTCPData(data)
	}

	//写串口数据
	async function writeData(data) {
		if (!serialPort || !serialPort.writable) {
			addLogErr('请先打开串口再发送数据')
			return
		}
		const writer = serialPort.writable.getWriter()
		if (toolOptions.addCRLF) {
			data = new Uint8Array([...data, 0x0d, 0x0a])
		}
		await writer.write(data)
		writer.releaseLock()
		addLog(data, false)
	}

	//读串口数据
	async function readData() {
		while (serialOpen && serialPort.readable) {
			reader = serialPort.readable.getReader()
			try {
				while (true) {
					const { value, done } = await reader.read()
					if (done) {
						break
					}
					dataReceived(value)
				}
			} catch (error) {
			} finally {
				reader.releaseLock()
			}
		}
		await serialPort.close()
	}

	//串口分包合并
	function dataReceived(data) {
		serialData.push(...data)
		if (toolOptions.timeOut == 0) {
			if (worker) {
				worker.postMessage({ type: 'uart_receive', data: serialData })
			}
			addLog(serialData, true)
			serialData = []
			return
		}
		//清除之前的时钟
		clearTimeout(serialTimer)
		serialTimer = setTimeout(() => {
			if (worker) {
				worker.postMessage({ type: 'uart_receive', data: serialData })
			}
			//超时发出
			addLog(serialData, true)
			serialData = []
		}, toolOptions.timeOut)
	}
	var ansi_up = new AnsiUp()
	//添加日志
	function addLog(data, isReceive = true) {
		let classname = 'text-primary'
		let form = '→'
		if (isReceive) {
			classname = 'text-success'
			form = '←'
		}
		newmsg = ''
		if (toolOptions.logType.includes('hex')) {
			let dataHex = []
			for (const d of data) {
				//转16进制并补0
				dataHex.push(('0' + d.toString(16).toLocaleUpperCase()).slice(-2))
			}
			if (toolOptions.logType.includes('&')) {
				newmsg += 'HEX:'
			}
			newmsg += dataHex.join(' ') + '<br/>'
		}
		if (toolOptions.logType.includes('text')) {
			let dataText = textdecoder.decode(Uint8Array.from(data))
			if (toolOptions.logType.includes('&')) {
				newmsg += 'TEXT:'
			}
			//转义HTML标签,防止内容被当作标签渲染
			newmsg += HTMLEncode(dataText)
		}
		if (toolOptions.logType.includes('ansi')) {
			const dataText = textdecoder.decode(Uint8Array.from(data))
			const html = ansi_up.ansi_to_html(dataText)
			newmsg += html
		}
		let time = toolOptions.showTime ? formatDate(new Date()) + '&nbsp;' : ''
		const template = '<div><span class="' + classname + '">' + time + form + '</span><br>' + newmsg + '</div>'
		let tempNode = document.createElement('div')
		tempNode.innerHTML = template
		serialLogs.append(tempNode)
		if (toolOptions.autoScroll) {
			serialLogs.scrollTop = serialLogs.scrollHeight - serialLogs.clientHeight
		}
	}
	//HTML转义
	function HTMLEncode(html) {
		var temp = document.createElement('div')
		temp.textContent != null ? (temp.textContent = html) : (temp.innerText = html)
		var output = temp.innerHTML
		temp = null
		return output
	}
	//HTML反转义
	function HTMLDecode(text) {
		var temp = document.createElement('div')
		temp.innerHTML = text
		var output = temp.innerText || temp.textContent
		temp = null
		return output
	}
	//系统日志
	function addLogErr(msg) {
		let time = toolOptions.showTime ? formatDate(new Date()) + '&nbsp;' : ''
		const template = '<div><span class="text-danger">' + time + ' 系统消息</span><br>' + msg + '</div>'
		let tempNode = document.createElement('div')
		tempNode.innerHTML = template
		serialLogs.append(tempNode)
		if (toolOptions.autoScroll) {
			serialLogs.scrollTop = serialLogs.scrollHeight - serialLogs.clientHeight
		}
	}

	//复制文本
	function copyText(text) {
		let textarea = document.createElement('textarea')
		textarea.value = text
		textarea.readOnly = 'readonly'
		textarea.style.position = 'absolute'
		textarea.style.left = '-9999px'
		document.body.appendChild(textarea)
		textarea.select()
		textarea.setSelectionRange(0, textarea.value.length)
		document.execCommand('copy')
		document.body.removeChild(textarea)
		showMsg('已复制到剪贴板')
	}

	//保存文本
	function saveText(text) {
		let blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
		saveAs(blob, 'serial.log')
	}

	//下载文件
	function saveAs(blob, filename) {
		if (window.navigator.msSaveOrOpenBlob) {
			navigator.msSaveBlob(blob, filename)
		} else {
			let link = document.createElement('a')
			let body = document.querySelector('body	')
			link.href = window.URL.createObjectURL(blob)
			link.download = filename
			// fix Firefox
			link.style.display = 'none'
			body.appendChild(link)
			link.click()
			body.removeChild(link)
			window.URL.revokeObjectURL(link.href)
		}
	}

	//弹窗
	const modalTip = new bootstrap.Modal('#model-tip')
	function showMsg(msg, title = 'Web Serial') {
		//alert(msg)
		document.getElementById('modal-title').innerHTML = title
		document.getElementById('modal-message').innerHTML = msg
		modalTip.show()
	}

	//当前时间 精确到毫秒
	function formatDate(now) {
		const hour = now.getHours() < 10 ? '0' + now.getHours() : now.getHours()
		const minute = now.getMinutes() < 10 ? '0' + now.getMinutes() : now.getMinutes()
		const second = now.getSeconds() < 10 ? '0' + now.getSeconds() : now.getSeconds()
		const millisecond = ('00' + now.getMilliseconds()).slice(-3)
		return `${hour}:${minute}:${second}.${millisecond}`
	}

	//左右折叠
	document.querySelectorAll('.toggle-button').forEach((element) => {
		element.addEventListener('click', (e) => {
			const panel = e.currentTarget.parentElement
			const collapseElement = panel.querySelector('.collapse')
			const icon = e.currentTarget.querySelector('i')
			
			// 切换面板折叠状态
			panel.classList.toggle('collapsed')
			collapseElement.classList.toggle('show')
			
			// 更新图标方向
			if (panel.classList.contains('collapsed')) {
				// 面板已折叠
				if (panel.id === 'connection-options') {
					// 左侧面板折叠时显示向右箭头
					icon.className = 'bi bi-chevron-compact-right'
				} else {
					// 右侧面板折叠时显示向左箭头
					icon.className = 'bi bi-chevron-compact-left'
				}
			} else {
				// 面板已展开
				if (panel.id === 'connection-options') {
					// 左侧面板展开时显示向左箭头
					icon.className = 'bi bi-chevron-compact-left'
				} else {
					// 右侧面板展开时显示向右箭头
					icon.className = 'bi bi-chevron-compact-right'
				}
			}
			
			// 保存折叠状态到localStorage
			savePanelState(panel.id, panel.classList.contains('collapsed'))
		})
	})
	
	// 保存面板折叠状态
	function savePanelState(panelId, isCollapsed) {
		try {
			const panelStates = JSON.parse(localStorage.getItem('panelStates') || '{}')
			panelStates[panelId] = isCollapsed
			localStorage.setItem('panelStates', JSON.stringify(panelStates))
		} catch (e) {
			console.warn('无法保存面板状态:', e)
		}
	}
	
	// 恢复面板折叠状态
	function restorePanelStates() {
		try {
			const panelStates = JSON.parse(localStorage.getItem('panelStates') || '{}')
			
			Object.keys(panelStates).forEach(panelId => {
				const panel = document.getElementById(panelId)
				const isCollapsed = panelStates[panelId]
				
				if (panel && isCollapsed) {
					const collapseElement = panel.querySelector('.collapse')
					const toggleButton = panel.querySelector('.toggle-button')
					const icon = toggleButton.querySelector('i')
					
					// 应用折叠状态
					panel.classList.add('collapsed')
					collapseElement.classList.remove('show')
					
					// 设置正确的图标
					if (panelId === 'connection-options') {
						icon.className = 'bi bi-chevron-compact-right'
					} else {
						icon.className = 'bi bi-chevron-compact-left'
					}
				}
			})
		} catch (e) {
			console.warn('无法恢复面板状态:', e)
		}
	}
	
	// 页面加载完成后恢复面板状态
	document.addEventListener('DOMContentLoaded', () => {
		setTimeout(restorePanelStates, 100) // 延迟执行确保DOM完全加载
		initPanelControls() // 初始化面板控制工具栏
	})
	
	// 初始化面板控制工具栏
	function initPanelControls() {
		const panelControls = document.getElementById('panel-controls')
		const resetPanelsBtn = document.getElementById('reset-panels')
		const autoFitLeftBtn = document.getElementById('auto-fit-left')
		const autoFitRightBtn = document.getElementById('auto-fit-right')
		const balancePanelsBtn = document.getElementById('balance-panels')
		const toggleControlsBtn = document.getElementById('toggle-panel-controls')
		const leftWidthSlider = document.getElementById('left-width-slider')
		const rightWidthSlider = document.getElementById('right-width-slider')
		const leftWidthDisplay = document.getElementById('left-width-display')
		const rightWidthDisplay = document.getElementById('right-width-display')
		
		// 更新滑块和显示值
		function updateSliders() {
			if (window.panelResizer) {
				const leftWidth = window.panelResizer.getPanelWidth('connection-options')
				const rightWidth = window.panelResizer.getPanelWidth('serial-tools')
				
				if (leftWidthSlider) {
					leftWidthSlider.value = leftWidth
					leftWidthSlider.max = window.panelResizer.containerWidth * 0.8
				}
				if (rightWidthSlider) {
					rightWidthSlider.value = rightWidth
					rightWidthSlider.max = window.panelResizer.containerWidth * 0.8
				}
				if (leftWidthDisplay) leftWidthDisplay.textContent = leftWidth + 'px'
				if (rightWidthDisplay) rightWidthDisplay.textContent = rightWidth + 'px'
			}
		}
		
		// 显示面板控制工具栏的快捷键 (Ctrl + Shift + P)
		document.addEventListener('keydown', (e) => {
			if (e.ctrlKey && e.shiftKey && e.key === 'P') {
				e.preventDefault()
				panelControls.classList.toggle('d-none')
				if (!panelControls.classList.contains('d-none')) {
					updateSliders()
				}
			}
			
			// 平衡面板快捷键 (Ctrl + Shift + B)
			if (e.ctrlKey && e.shiftKey && e.key === 'B') {
				e.preventDefault()
				balancePanels()
			}
		})
		
		// 平衡面板功能
		function balancePanels() {
			if (window.panelResizer) {
				const containerWidth = window.panelResizer.containerWidth
				const minMainWidth = 300
				const availableWidth = containerWidth - minMainWidth
				const balancedWidth = Math.max(50, availableWidth / 2)
				
				window.panelResizer.setPanelToWidth('connection-options', balancedWidth)
				window.panelResizer.setPanelToWidth('serial-tools', balancedWidth)
				updateSliders()
				showMsg('面板宽度已平衡')
			}
		}
		
		// 重置面板按钮
		if (resetPanelsBtn) {
			resetPanelsBtn.addEventListener('click', () => {
				if (window.panelResizer) {
					window.panelResizer.resetToDefault()
					updateSliders()
					showMsg('面板宽度已重置为默认值')
				}
			})
		}
		
		// 自动调整左侧面板按钮
		if (autoFitLeftBtn) {
			autoFitLeftBtn.addEventListener('click', () => {
				if (window.panelResizer) {
					window.panelResizer.autoFitContent('connection-options')
					updateSliders()
					showMsg('左侧面板宽度已自动调整')
				}
			})
		}
		
		// 自动调整右侧面板按钮
		if (autoFitRightBtn) {
			autoFitRightBtn.addEventListener('click', () => {
				if (window.panelResizer) {
					window.panelResizer.autoFitContent('serial-tools')
					updateSliders()
					showMsg('右侧面板宽度已自动调整')
				}
			})
		}
		
		// 平衡面板按钮
		if (balancePanelsBtn) {
			balancePanelsBtn.addEventListener('click', balancePanels)
		}
		
		// 隐藏控制面板按钮
		if (toggleControlsBtn) {
			toggleControlsBtn.addEventListener('click', () => {
				panelControls.classList.add('d-none')
			})
		}
		
		// 左侧宽度滑块
		if (leftWidthSlider) {
			leftWidthSlider.addEventListener('input', (e) => {
				const width = parseInt(e.target.value)
				if (window.panelResizer) {
					window.panelResizer.setPanelToWidth('connection-options', width)
					leftWidthDisplay.textContent = width + 'px'
				}
			})
		}
		
		// 右侧宽度滑块
		if (rightWidthSlider) {
			rightWidthSlider.addEventListener('input', (e) => {
				const width = parseInt(e.target.value)
				if (window.panelResizer) {
					window.panelResizer.setPanelToWidth('serial-tools', width)
					rightWidthDisplay.textContent = width + 'px'
				}
			})
		}
		
		// 双击拖拽手柄显示控制面板
		document.querySelectorAll('.resize-handle').forEach(handle => {
			handle.addEventListener('dblclick', () => {
				panelControls.classList.remove('d-none')
				updateSliders()
			})
		})
		
		// 监听窗口大小变化，更新滑块最大值
		window.addEventListener('resize', () => {
			setTimeout(updateSliders, 100)
		})
		
		// 初始化滑块值
		setTimeout(updateSliders, 200)
	}

	//设置名称
	const modalNewName = new bootstrap.Modal('#model-change-name')
	function changeName(callback, oldName = '') {
		set('model-new-name', oldName)
		modalNewName.show()
		document.getElementById('model-save-name').onclick = null
		document.getElementById('model-save-name').onclick = function () {
			callback(get('model-new-name'))
			modalNewName.hide()
		}
	}

	// 积木转换按钮事件处理
	document.addEventListener('DOMContentLoaded', () => {
		// 代码转换为积木
		const codeToBlocksBtn = document.getElementById('code-to-blocks');
		if (codeToBlocksBtn) {
			codeToBlocksBtn.addEventListener('click', () => {
				if (window.blocklyProgramming) {
					const code = editor.getValue();
					if (!code.trim()) {
						addLogErr('⚠️ 代码编辑器为空，无法转换为积木');
						return;
					}
					
					// 切换到积木编程选项卡
					const blocklyTab = document.getElementById('nav-blockly-tab');
					if (blocklyTab) {
						blocklyTab.click();
						addLogErr('🧩 正在将代码转换为积木...');
						
						// 简单的代码解析转换为积木
						setTimeout(() => {
							window.blocklyProgramming.parseCodeToBlocks(code);
						}, 200);
					}
				} else {
					addLogErr('❌ 积木编程模块未加载');
				}
			});
		}

		// 积木转换为代码
		const blocksToCodeBtn = document.getElementById('blocks-to-code');
		if (blocksToCodeBtn) {
			blocksToCodeBtn.addEventListener('click', () => {
				if (window.blocklyProgramming) {
					const code = window.blocklyProgramming.generateCodeFromBlocks();
					if (!code.trim()) {
						addLogErr('⚠️ 积木工作区为空，无法生成代码');
						return;
					}
					
					editor.setValue(code);
					addLogErr('✅ 积木已转换为代码');
				} else {
					addLogErr('❌ 积木编程模块未加载');
				}
			});
		}
	});

	// 暴露函数给其他模块使用
	window.addLog = addLog
	window.addLogErr = addLogErr
})()
