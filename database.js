import sql from "sqlite3";
const sqlite3 = sql.verbose();


// Open the db
function openDB() {
    let db = new sqlite3.Database("./db/canvases.db", err => {
        if (err) {
            console.error(err.message);
            process.exit(-1);
        }
    });
    return db;
}

function closeDB(db) {
    db.close(err => {
        if (err) {
            console.error(err.message);
            process.exit(-1)
        }
    })
}

// Function for inserting a new canvas string
export async function insertCanvas(canvas_str) {
    // Open db
    let db = openDB();

    db.serialize(() => {
        // Insert the canvas string into db
        let insertSQL = `INSERT INTO canvases(canvas_string) VALUES(?)`;

        db.run(insertSQL, [canvas_str], err => {
            if (err) return console.error(err.message);
        });

        closeDB(db);
    });
}

// Get the latest canvas
export async function fetchLastCanvas() {
    // Create the table if it hasn't been created
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS canvases (
            canvas_id INTEGER PRIMARY KEY AUTOINCREMENT,
            canvas_string TEXT NOT NULL UNIQUE
        );
    `;

    const db = openDB();
    db.exec(createTableQuery, async (err) => {
        if (err) {
            sonsole.error("Error occurred while creating tables: ", err.message);
            process.exit(-1);
        }
        
        console.log("Successfully started database...");
    });
    
    console.log("hello")
    return new Promise(async (resolve, reject) => {
        db.serialize(async () => {
            db.get('SELECT * FROM canvases ORDER BY canvas_id DESC LIMIT 1', [],
                (err, row) => {
                    if (err) {
                        console.error("Error occurred while fetching latest canvas: ", err.message);
                        closeDB(db);
                        reject();
                    }
                    closeDB(db);
                    resolve({ canvasStr: row === undefined ? "" : row.canvas_string }); 
                })
        });

    })
}
