import { insertCanvas, startDb } from "./database.js";
import http from "http";
const port = 8080;


function saveCanvas(body) {
    if (body === '') return;
    try {
        const bodyData = JSON.parse(body);
        // Save the canvas
        insertCanvas(bodyData.canvasStr);

    } catch (error) {
        console.log(error)
    }
}

const server = http.createServer(async (req, res) => {
    // For CORS
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    let body = '';

    if (req.url === "/api/saveCanvas" && req.method === "POST") {
        req.on("data", (chunk) => {
            body += chunk;
        });

        req.on("end", () => saveCanvas(body));
    }

    if (req.url === "/api/startDb" && req.method === "GET") {
        // Fetching the latest canvas
        res.write(JSON.stringify(await startDb()))
        // res.write(canvas.canvasStr);
    }

    res.end();
});

server.listen(port, () => console.log(`listening on port ${port}`))