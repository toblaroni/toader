const http = require("http");
const fs = require("fs");
const port = 8080;

function saveCanvas(body) {
    if (body === '') return;
    try {
        console.log(JSON.parse(body));
        // Save to the csv file
    } catch (error) {
        console.log(error)
    }
}

const server = http.createServer((req, res) => {
    // For CORS
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    let body = '';

    req.on("data", (chunk) => {
        body += chunk;
    });

    req.on("end", () => saveCanvas(body));

    if (req.url === "/api/getCanvas" && req.method === "GET") {
        // Fetching the latest canvas
    }

    res.end();
});

server.listen(port, () => console.log(`listening on port ${port}`))