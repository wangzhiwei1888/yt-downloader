// 获取 DOM 元素
const videoUrlInput = document.getElementById('video-url');
const formatSelect = document.getElementById('format-select');
const outputPathInput = document.getElementById('output-path');
const browseBtn = document.getElementById('browse-btn');
const proxyInput = document.getElementById('proxy-input');
const downloadBtn = document.getElementById('download-btn');
const cancelBtn = document.getElementById('cancel-btn');
const progressBar = document.getElementById('progress-bar');
const progressPercent = document.getElementById('progress-percent');
const progressSpeed = document.getElementById('progress-speed');
const progressEta = document.getElementById('progress-eta');
const logContainer = document.getElementById('log-container');

// 初始化事件监听器
function initEventListeners() {
    // 下载按钮点击事件
    downloadBtn.addEventListener('click', handleDownload);
    
    // 取消下载按钮点击事件
    cancelBtn.addEventListener('click', handleCancel);
    
    // 浏览按钮点击事件
    browseBtn.addEventListener('click', handleBrowse);
    
    // 初始化 Electron API 事件监听
    initElectronEvents();
}

// 初始化 Electron API 事件监听
function initElectronEvents() {
    // 监听下载进度
    window.electronAPI.onDownloadProgress((progress) => {
        updateProgress(progress);
    });
    
    // 监听 yt-dlp 事件
    window.electronAPI.onYtDlpEvent((eventType, eventData) => {
        addLog(`[${eventType}] ${JSON.stringify(eventData)}`, 'info');
    });
    
    // 监听下载错误
    window.electronAPI.onDownloadError((error) => {
        addLog(`Error: ${error.message}`, 'error');
        resetUI();
    });
    
    // 监听下载完成
    window.electronAPI.onDownloadComplete(() => {
        addLog('Download completed successfully!', 'success');
        resetUI();
    });
}

// 处理下载
async function handleDownload() {
    const videoUrl = videoUrlInput.value.trim();
    const format = formatSelect.value;
    const outputPath = outputPathInput.value.trim();
    const proxy = proxyInput.value.trim();
    
    // 验证输入
    if (!videoUrl || !outputPath) {
        addLog('Please enter video URL and output path', 'error');
        return;
    }
    
    // 禁用按钮
    downloadBtn.disabled = true;
    cancelBtn.disabled = false;
    
    // 重置进度条
    resetProgress();
    
    // 添加日志
    addLog(`Starting download for: ${videoUrl}`, 'info');
    addLog(`Format: ${format}, Output: ${outputPath}`, 'info');
    if (proxy) {
        addLog(`Using proxy: ${proxy}`, 'info');
    }
    
    // 调用主进程的下载功能
    const result = await window.electronAPI.downloadVideo({
        url: videoUrl,
        format: format,
        outputPath: outputPath,
        proxy: proxy
    });
    
    if (!result.success) {
        addLog(`Failed to start download: ${result.message}`, 'error');
        resetUI();
    }
}

// 处理取消下载
async function handleCancel() {
    const result = await window.electronAPI.cancelDownload();
    
    if (result.success) {
        addLog('Download cancelled by user', 'info');
    } else {
        addLog('Failed to cancel download', 'error');
    }
    
    resetUI();
}

// 处理浏览文件
async function handleBrowse() {
    const result = await window.electronAPI.selectOutputPath();
    
    if (result.success) {
        outputPathInput.value = result.filePath;
    }
}

// 更新下载进度
function updateProgress(progress) {
    const percent = progress.percent ? parseFloat(progress.percent).toFixed(2) : '0.00';
    const speed = progress.currentSpeed || '-';
    const eta = progress.eta || '-';
    
    // 更新进度条
    progressBar.style.width = `${percent}%`;
    
    // 更新进度信息
    progressPercent.textContent = `${percent}%`;
    progressSpeed.textContent = `速度: ${speed}`;
    progressEta.textContent = `预计剩余: ${eta}`;
    
    // 添加进度日志
    addLog(`Progress: ${percent}% | Speed: ${speed} | ETA: ${eta}`, 'info');
}

// 重置进度条
function resetProgress() {
    progressBar.style.width = '0%';
    progressPercent.textContent = '0%';
    progressSpeed.textContent = '-';
    progressEta.textContent = '-';
}

// 重置 UI 状态
function resetUI() {
    downloadBtn.disabled = false;
    cancelBtn.disabled = true;
}

// 添加日志
function addLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    
    logContainer.appendChild(logEntry);
    
    // 滚动到底部
    logContainer.scrollTop = logContainer.scrollHeight;
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    addLog('Application initialized. Ready to download videos!', 'success');
});