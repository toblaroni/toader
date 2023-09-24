const canvas = document.getElementById("canvas");
const saveBtn = document.getElementById("save-canvas");

const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

let drawing = false;

function getMouseCoords(element, event) {
    return {
        mouseX: event.clientX - canvas.offsetLeft,
        mouseY: event.clientY - canvas.offsetTop
    }
}

function beginDraw(e) {
    drawing = true;
    ctx.beginPath();
    draw(e);
}

function draw(e) {
    if (drawing == false) return;
    
    let { mouseX, mouseY } = getMouseCoords(canvas, e);

    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();
   
    ctx.beginPath();
    ctx.moveTo(mouseX, mouseY);
}

async function saveCanvas(e) {
    e.preventDefault();

    // Stringify the canvas  
    const canvasStr = canvas.toDataURL();

    // Send request to server
    const response = await fetch('http://127.0.0.1:8080/api/saveCanvas', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({canvasStr})
    });
    // console.log(response.json());
}

saveBtn.addEventListener("submit", saveCanvas);
canvas.addEventListener("mousedown", beginDraw);
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);
