const { contextBridge, ipcRenderer } = require('electron');

// 向渲染进程暴露安全的 API
contextBridge.exposeInMainWorld('electronAPI', {
    // 下载视频
    downloadVideo: (downloadOptions) => {
        return ipcRenderer.invoke('download-video', downloadOptions);
    },
    
    // 取消下载
    cancelDownload: () => {
        return ipcRenderer.invoke('cancel-download');
    },
    
    // 选择保存路径
    selectOutputPath: () => {
        return ipcRenderer.invoke('select-output-path');
    },
    
    // 监听下载进度
    onDownloadProgress: (callback) => {
        ipcRenderer.on('download-progress', (event, progress) => {
            callback(progress);
        });
    },
    
    // 监听 yt-dlp 事件
    onYtDlpEvent: (callback) => {
        ipcRenderer.on('yt-dlp-event', (event, data) => {
            callback(data.eventType, data.eventData);
        });
    },
    
    // 监听下载错误
    onDownloadError: (callback) => {
        ipcRenderer.on('download-error', (event, error) => {
            callback(error);
        });
    },
    
    // 监听下载完成
    onDownloadComplete: (callback) => {
        ipcRenderer.on('download-complete', callback);
    }
});