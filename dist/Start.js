"use strict";
// Importing the active-win package to get the active window
// Importing the FormatWindowName function from the Formatting.ts file
// Importing the SqliteCreate, SqliteInsert, and SqliteUpdateEndTime functions from the Database.ts file
// Creating a table in the database called Processes
// Creating a variable to store the last ID, app, and window
// Creating a function that logs the active window every second
// If the last app and window are the same as the current app and window, update the end time in the database
// If the last app and window are different from the current app and window, insert a new record in the database and update the last app and window
// Setting an interval to call the LogActiveWindow function every second
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const active_win_1 = __importDefault(require("active-win"));
const Formatting_1 = __importDefault(require("./Formatting"));
const Database_1 = require("./Database");
let LastID = 0;
let LastApp = '';
let LastWindow = '';
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
exports.default = LogActiveWindow;
