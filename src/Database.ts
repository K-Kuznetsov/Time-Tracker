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
        db.all(`WITH RECURSIVE MinuteSeries AS (
            SELECT datetime('2024-02-19 16:00:00') AS TimePoint
            UNION ALL
            SELECT datetime(TimePoint, '+1 minute') FROM MinuteSeries
            WHERE TimePoint < (SELECT MAX(End) FROM Processes)
        )
        SELECT 
            strftime('%Y-%m-%d %H:%M', ms.TimePoint) as MinuteBlock,
            p.App,
            p.Window,
            ms.TimePoint as Start,
            datetime(ms.TimePoint, '+1 minute') as End
        FROM 
            MinuteSeries ms
        JOIN 
            Processes p ON ms.TimePoint >= strftime('%Y-%m-%d %H:%M', p.Start) AND ms.TimePoint < strftime('%Y-%m-%d %H:%M', p.End)
        ORDER BY 
            MinuteBlock, p.App, p.Window;`, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            };
        });
    });
};

export { SqliteCreate, SqliteInsert, SqliteUpdateEndTime, SqliteSelect };