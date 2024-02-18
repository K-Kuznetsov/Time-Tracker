"use strict";
// Function to format the window name to remove any special characters and unwanted text
Object.defineProperty(exports, "__esModule", { value: true });
function FormatWindowName(WindowName) {
    const NewWindowName = WindowName.replace(/[^\x20-\x7E]/g, '')
        .replace(/ and \d+ more pages/g, '')
        .replace(/ and 1 more page/g, '')
        .replace(/\d+% complete/g, 'File Transfer')
        .replace(/\d+% Extracting/g, 'Extracting')
        .trim();
    return NewWindowName === 'Program Manager' || NewWindowName === 'Desktop' ? 'Desktop'
        : NewWindowName === 'Windows Default Lock Screen' || NewWindowName === 'LockingWindow' || NewWindowName === 'UnlockingWindow' ? 'Windows Default Lock Screen'
            : NewWindowName;
}
;
exports.default = FormatWindowName;
