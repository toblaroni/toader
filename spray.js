
const canvas = document.getElementById("canvas");
const saveBtn = document.getElementById("save-canvas");
const changeClrBtn = document.getElementById("change-colour");

const ctx = canvas.getContext("2d");
ctx.lineCap = "round";
ctx.lineWidth = "20";
ctx.imageSmoothingEnabled = true;

const drippiness = 0.25;
let drawing = false;

// Array of all the drips
let dripArr = [];

// Animate drips
function drip() {
    // Loop the drips
    for (let i = 0; i < dripArr.length; i++) {
        let d = dripArr[i];

        // Draw a circle at the x and y with the right size
        ctx.beginPath();
        ctx.fillStyle = d.colour;
        ctx.arc(d.x, d.y, d.radius, 0, 2*Math.PI);
        ctx.fill();

        if (d.cLength >= d.length) d.dead = true;

        // Increment the y val and current length
        d.y += d.dripSpeed;
        d.cLength += d.dripSpeed;
    }
    // Remove dead drips
    // For each loop?
    for (let i = 0; i < dripArr.length; i++) {
        if (dripArr[i].dead)
            dripArr.splice(i, 1);

    }
    ctx.beginPath()
    requestAnimationFrame(drip);
}
drip();

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

document.addEventListener("DOMContentLoaded", () => {
    getLatestCanvas();
    randomColor();
});


async function getLatestCanvas() {
    // Fetch the latest canvas
    const response = await fetch('http://127.0.0.1:8080/api/getCanvas', {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    });
    const body = await response.json();

    // Make an image
    const img = new Image();
    img.src = body.canvasStr;

    img.onload = function() {
        if (body.canvasStr) 
            ctx.drawImage(img, 0, 0);
    }
}

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

function createDrip(e) {
    let {mouseX, mouseY} = getMouseCoords(canvas, e);
    // Create drip
    // Each drip is an object
    let makeDrip = Math.random();
    if (makeDrip < drippiness) {
        dripArr.push({
            x: mouseX,
            y: mouseY,
            dead: false,
            length: Math.round(Math.random()*200)+5,
            cLength: 0, // Current length of the drip
            radius: Math.round(Math.random()*3)+2,
            colour: ctx.strokeStyle,
            dripSpeed: Math.random()*2+0.1
        })
    }
}

function draw(e) {
    if (drawing == false) return;
    let { mouseX, mouseY } = getMouseCoords(canvas, e);


    createDrip(e);
    ctx.fillStyle = "rgba(0,0,0,0)"
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
}

function randomColor() {
    const colours = ["#ffffff", "#ff0000", "#00ff00", "#0000ff", "#000000", "ffff00"];

    // Prevent the same col again
    let cCol = ctx.strokeStyle;
    let nCol = colours[Math.floor(Math.random()*colours.length)];
    while (cCol === nCol) {
        nCol = colours[Math.floor(Math.random()*colours.length)];
    }

    ctx.strokeStyle = nCol;
}

saveBtn.addEventListener("submit", saveCanvas);
canvas.addEventListener("mousedown", beginDraw);
canvas.addEventListener("mouseup", () => {
    drawing = false; 
    ctx.beginPath();
});
canvas.addEventListener("mousemove", draw);
changeClrBtn.addEventListener("click", randomColor);
document.addEventListener("keydown", clearCanvas);