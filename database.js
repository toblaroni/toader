const { create } = require("domain");

const sqlite3 = require("sqlite3").verbose();

// Open the db
let db = new sqlite3.Database("./db/canvases.db", err => {
    if (err) return console.error(err.message);
    console.log("Connected to database")
})

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


db.close(err => {
    if (err) return console.error(err.message);
    console.log("Closed the database");
});