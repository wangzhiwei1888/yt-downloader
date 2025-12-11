const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const YTDlpWrap = require('yt-dlp-wrap-plus').default;

let mainWindow;
let ytDlpEventEmitter = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile('index.html');
    // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// 处理下载请求
ipcMain.handle('download-video', async (event, downloadOptions) => {
    const { url, format, outputPath, proxy } = downloadOptions;
    
    try {
        // 检查 yt-dlp 是否安装
        const ytDlpPath = '/opt/homebrew/bin/yt-dlp';
        const ytDlpWrap = new YTDlpWrap(ytDlpPath);
        
        // 构建参数
        const args = [
            url,
            '-f',
            format || '137',
            '-o',
            outputPath || 'output.mp4'
        ];
        
        // 添加代理参数（如果提供）
        if (proxy) {
            args.push('--proxy', proxy);
        }
        
        // 执行下载
        ytDlpEventEmitter = ytDlpWrap.exec(args)
            .on('progress', (progress) => {
                mainWindow.webContents.send('download-progress', progress);
            })
            .on('ytDlpEvent', (eventType, eventData) => {
                mainWindow.webContents.send('yt-dlp-event', { eventType, eventData });
            })
            .on('error', (error) => {
                mainWindow.webContents.send('download-error', error);
            })
            .on('close', () => {
                mainWindow.webContents.send('download-complete');
            });
        
        return { success: true, message: 'Download started' };
    } catch (error) {
        return { success: false, message: error.message };
    }
});

// 处理取消下载
ipcMain.handle('cancel-download', () => {
    if (ytDlpEventEmitter && ytDlpEventEmitter.ytDlpProcess) {
        ytDlpEventEmitter.ytDlpProcess.kill();
        return { success: true, message: 'Download cancelled' };
    }
    return { success: false, message: 'No download in progress' };
});

// 处理选择保存路径
ipcMain.handle('select-output-path', async () => {
    const result = await dialog.showSaveDialog(mainWindow, {
        title: 'Save Video As',
        filters: [
            { name: 'MP4 Files', extensions: ['mp4'] },
            { name: 'All Files', extensions: ['*'] }
        ],
        defaultPath: 'output.mp4'
    });
    
    if (!result.canceled && result.filePath) {
        return { success: true, filePath: result.filePath };
    }
    return { success: false, message: 'No path selected' };
});