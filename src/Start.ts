// Importing the active-win package to get the active window
// Importing the FormatWindowName function from the Formatting.ts file
// Importing the SqliteCreate, SqliteInsert, and SqliteUpdateEndTime functions from the Database.ts file
// Creating a table in the database called Processes
// Creating a variable to store the last ID, app, and window
// Creating a function that logs the active window every second
// If the last app and window are the same as the current app and window, update the end time in the database
// If the last app and window are different from the current app and window, insert a new record in the database and update the last app and window
// Setting an interval to call the LogActiveWindow function every second

import activeWin from 'active-win';
import FormatWindowName from './Formatting';
import { SqliteInsert, SqliteUpdateEndTime, SqliteSelect } from './Database';

let LastID: number = 0;
let LastApp: string = '';
let LastWindow: string = '';

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

export default LogActiveWindow;


