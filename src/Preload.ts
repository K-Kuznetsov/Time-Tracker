import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    receive: (channel: string, func: (arg0: any) => void) => {
        ipcRenderer.on(channel, (event, ...args) => func(args));
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector: string, text: string | undefined) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text ?? ''
    };

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    };
});
