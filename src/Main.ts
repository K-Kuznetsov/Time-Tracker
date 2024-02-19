import { app, BrowserWindow, WebPreferences } from 'electron';
import { SqliteCreate, SqliteSelect, SqliteInsert, SqliteUpdateEndTime } from './Database';
import activeWin from 'active-win';
import FormatWindowName from './Formatting';

let LastID: number = 0;
let LastApp: string = '';
let LastWindow: string = '';
let MainWindow: BrowserWindow;

async function LogActiveWindow() {
    const ActiveWindow = await activeWin();
    const AppName: string = ActiveWindow?.owner.name ?? '';
    const FormattedWindowName: string = FormatWindowName(ActiveWindow?.title ?? '');

    if (LastApp === AppName && LastWindow === FormattedWindowName) {
        SqliteUpdateEndTime(LastID, AppName, FormattedWindowName);
    } else {
        LastID = await SqliteInsert(AppName, FormattedWindowName);
    };

    LastApp = AppName;
    LastWindow = FormattedWindowName;
};

function CreateWindow() {
    MainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        icon: './ApplicationIcon.png',
        webPreferences: {
            contextIsolation: true,
            sandbox: true,
            nodeIntegration: false,
            preload: __dirname + '/Preload.js',
            contentSecurityPolicy: "default-src 'self'; script-src 'self';"
        } as WebPreferences
    });
    MainWindow.loadFile('./src/GoogleTimeline.html');
    return MainWindow;
};

app.whenReady().then(async () => {
    SqliteCreate('Processes');
    CreateWindow();

    SqliteSelect().then(data => {
        MainWindow.webContents.send('processData', data);
    }).catch(err => {
        console.error('Error fetching data:', err);
    });

    //MainWindow.webContents.openDevTools();

    setInterval(async () => {
        await LogActiveWindow();
    }, 1000);    

    setInterval(async () => {
        SqliteSelect().then(data => {
            console.log('Data to send to renderer:', JSON.stringify(data, null, 2)); // Detailed log
            MainWindow.webContents.send('processData', data);
        }).catch(err => {
            console.error('Error fetching data:', err);
        });
    }, 10000);

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) CreateWindow()
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});