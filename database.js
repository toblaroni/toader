import sql from "sqlite3";
const sqlite3 = sql.verbose();

// Open the db
async function openDB() {
    let db = new sqlite3.Database("./db/canvases.db", err => {
        if (err) {
            console.error(err.message);
            exit(-1);
        }
    });
    return db;
}

/*
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS canvases (
        canvas_id INTEGER PRIMARY KEY,
        canvas_string NOT NULL UNIQUE
    );
`
db.serialize(() => {
    db.run(createTableQuery, err => {
        if (err) return console.error(err.message);
        console.log("Created table successfully.")
    });

    db.all(`SELECT * FROM canvases`, [], (err, rows) => {
        if (err) throw err;
        rows.forEach(row => console.log(row));
    });
});
*/

function closeDb(db) {
    db.close(err => {
        if (err) {
            console.error(err.message);
            exit(-1)
        }
    })
}

// Function for inserting a new canvas string
export async function insertCanvas(canvas_str) {
    // Open db
    let db = await openDB();

    db.serialize(() => {
        // Insert the canvas string into db
        let insertSQL = `INSERT INTO canvases(canvas_string) VALUES(?)`

        db.run(insertSQL, [canvas_str], err => {
            if (err) return console.error(err.message);
        })

        closeDb(db)
    })
}
