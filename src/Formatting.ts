// Function to format the window name to remove any special characters and unwanted text

function FormatWindowName(WindowName: string) {
    const NewWindowName: string = WindowName.replace(/[^\x20-\x7E]/g, '')
        .replace(/ and \d+ more pages/g, '')
        .replace(/ and 1 more page/g, '')
        .replace(/\d+% complete/g, 'File Transfer')
        .replace(/\d+% Extracting/g, 'Extracting')
        .trim();

    return NewWindowName === 'Program Manager' || NewWindowName === 'Desktop' ? 'Desktop' 
    : NewWindowName === 'Windows Default Lock Screen' || NewWindowName === 'LockingWindow' || NewWindowName === 'UnlockingWindow' ? 'Windows Default Lock Screen' 
    : NewWindowName;
};

export default FormatWindowName ;