const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

ctx.strokeStyle = "white";
let drawing = false;

function getMouseCoords(element, event) {
    return {
        mouseX: event.clientX - canvas.offsetLeft,
        mouseY: event.clientY - canvas.offsetTop
    }
}

function draw(e) {
    if (drawing == false) return;
    
    let { mouseX, mouseY } = getMouseCoords(canvas, e);

    ctx.lineTo(mouseX, mouseY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(mouseX, mouseY);
}


canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    ctx.beginPath();
    draw(e);
});
canvas.addEventListener("mouseup", () => drawing = false);
canvas.addEventListener("mousemove", draw);