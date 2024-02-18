"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const Database_1 = require("./Database");
const active_win_1 = __importDefault(require("active-win"));
const Formatting_1 = __importDefault(require("./Formatting"));
let LastID = 0;
let LastApp = '';
let LastWindow = '';
let MainWindow;
async function LogActiveWindow() {
    const ActiveWindow = await (0, active_win_1.default)();
    const AppName = ActiveWindow?.owner.name ?? '';
    const FormattedWindowName = (0, Formatting_1.default)(ActiveWindow?.title ?? '');
    if (LastApp === AppName && LastWindow === FormattedWindowName) {
        (0, Database_1.SqliteUpdateEndTime)(LastID, AppName, FormattedWindowName);
    }
    else {
        LastID = await (0, Database_1.SqliteInsert)(AppName, FormattedWindowName);
    }
    ;
    LastApp = AppName;
    LastWindow = FormattedWindowName;
}
;
function CreateWindow() {
    MainWindow = new electron_1.BrowserWindow({
        width: 1920,
        height: 1080,
        icon: './ApplicationIcon.png',
        webPreferences: {
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            preload: __dirname + '/Preload.js',
            contentSecurityPolicy: "default-src 'self'; script-src 'self';"
        }
    });
    MainWindow.loadFile('./src/GoogleTimeline.html');
    return MainWindow;
}
;
electron_1.app.whenReady().then(async () => {
    (0, Database_1.SqliteCreate)('Processes');
    CreateWindow();
    (0, Database_1.SqliteSelect)().then(data => {
        MainWindow.webContents.send('processData', data);
    }).catch(err => {
        console.error('Error fetching data:', err);
    });
    //MainWindow.webContents.openDevTools();
    setInterval(async () => {
        await LogActiveWindow();
    }, 1000);
    setInterval(async () => {
        (0, Database_1.SqliteSelect)().then(data => {
            console.log('Data to send to renderer:', JSON.stringify(data, null, 2)); // Detailed log
            MainWindow.webContents.send('processData', data);
        }).catch(err => {
            console.error('Error fetching data:', err);
        });
    }, 5000);
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            CreateWindow();
    });
});
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
