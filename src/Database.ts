// Database.ts
// Importing the sqlite3 package to use SQLite
// Creating a new database object
// Creating a variable to store the timezone offset
// Creating a function to create a table in the database
// Creating a function to insert a record into the database
// Creating a function to update the end time and duration in the database
// Exporting the SqliteCreate, SqliteInsert, and SqliteUpdateEndTime functions

import { Database } from 'sqlite3';
const db: Database = new Database('Processes.db');
const TimezoneOffset = -new Date().getTimezoneOffset() / 60;

function SqliteCreate(TableName: string) {
    db.run(`CREATE TABLE IF NOT EXISTS ${TableName} (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        App TEXT,
        Window TEXT,
        Start DateTime,
        End DateTime,
        Duration INTEGER,
        Project TEXT)`
    );
};

function SqliteInsert(App: string, Window: string): Promise<number> {
    return new Promise((resolve) => {
        db.run(`INSERT INTO Processes(App, Window, Start, End) 
        VALUES(?, ?, datetime(CURRENT_TIMESTAMP, '+${TimezoneOffset} hours'), datetime(CURRENT_TIMESTAMP, '+${TimezoneOffset} hours', '+5 seconds'))`, [App, Window], function () {
            resolve(this.lastID);
        });
    });
};

function SqliteUpdateEndTime(LastID: number, App: string, Window: string){
        db.run(`UPDATE Processes SET End = datetime(CURRENT_TIMESTAMP, '+${TimezoneOffset} hours') WHERE ID = ? and App = ? and Window = ?`, [LastID, App, Window]);
        db.run(`UPDATE Processes SET Duration = (strftime('%s', End) - strftime('%s', Start)) WHERE ID = ? or Duration IS NULL`, [LastID]);    
};

async function SqliteSelect() {
    return new Promise((resolve, reject) => {
        db.all(`SELECT 
        MAX(duration) as MaxDuration,
        strftime('%Y-%m-%d %H:%M', Start) as MinuteBlock,
        strftime('%Y-%m-%d %H:%M:00', Start) as Start,
        strftime('%Y-%m-%d %H:%M:59', Start) as End,
        App,
        Window
    FROM (
        SELECT 
            App,
            Window,
            Start,
            End,
            (strftime('%s', End) - strftime('%s', Start)) as duration
        FROM Processes
    )
    GROUP BY MinuteBlock
    ORDER BY MinuteBlock ASC;`, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            };
        });
    });
};

export { SqliteCreate, SqliteInsert, SqliteUpdateEndTime, SqliteSelect };