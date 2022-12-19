let cnv 

// A 2D array that holds the coordinates for each point.
let points = [[-3, 1], [-3, -1], [-2, -1], [-2, 1], [0, 1], [0, -1], [2, -1], [2, 1], [4, 1], [4, 0], [3, -1], [2, -1],
              [2, 0], [0, 0], [0, -1], [-4, -1], [-4, 0]]

// array to hold the original values
let og = []

// Array to hold the values to change the vertices by.
let shuffleVals = []

let gap


function windowResized(){
  resizeCanvas(windowWidth, windowHeight)
}


function setup(){
  cnv = createCanvas(windowWidth, windowHeight)

  // Stop the context menu popping up when finger is held down.
  cnv.touchStarted(e => e.preventDefault())

  pixelDensity(displayDensity()) // Set the pixel density to the display density.

  smooth()
  strokeCap(SQUARE)


  // Initialise the shuffleVals array and og array
  for(let i = 0; i < points.length; i ++){
    shuffleVals.push([points[i][0], points[i][1]])
    og.push([points[i][0], points[i][1]])
  }
}

function draw(){
  background(0)
  stroke(255)
  noFill()

  translate(width / 2, height / 2)
  // if(width < 1024){
  //   rotate(radians(-90))
  // }
  
  if(frameCount % 60 == 0 && !mouseIsPressed && window.innerWidth >= 1024){
    randomiseVals(0.15, 0.15)
  } else if (frameCount % 60 == 0 && !mouseIsPressed && window.innerWidth < 1024) {
    randomiseVals(0.12, 0.15)
  }

  // Responsive web
  if(window.innerWidth > 1024){
    gap = window.innerWidth * 0.1
    strokeWeight(20)
    shuffleToad(0.05)
    drawToad(gap, gap / 2)
  } else {
    gap = window.innerWidth * 0.2
    strokeWeight(11)
    shuffleToad(0.05)
    drawToad(gap / 2, gap)
  }


}

// randomise the shuffle Vals array
function randomiseVals(vx, vy){
  // Populate the shuffleVals array with values to change the points by.
  for(let i = 0; i < points.length; i ++){
    let randX = random(-vx, vx)
    let randY = random(-vy, vy)

    shuffleVals[i][0] = points[i][0] + randX 
    shuffleVals[i][1] = points[i][1] + randY 
  }
}

// Function that lerps the values of the points array to the new value.
function shuffleToad(s){
  // If the mouse if pressed return to original points
  if(mouseIsPressed){
    for(let i = 0; i < points.length; i ++){
      shuffleVals[i][0] = lerp(shuffleVals[i][0], og[i][0], 0.5)
      shuffleVals[i][1] = lerp(shuffleVals[i][1], og[i][1], 0.5)
      points[i][0] = lerp(points[i][0], shuffleVals[i][0], s)
      points[i][1] = lerp(points[i][1], shuffleVals[i][1], s)
    }
  } else {
    for(let i = 0; i < points.length; i ++){
      points[i][0] = lerp(points[i][0], shuffleVals[i][0], s)
      points[i][1] = lerp(points[i][1], shuffleVals[i][1], s)
    }
  }
}

// Function for drawing type.
// Takes the gap width and height between points as parameters.
function drawToad(gx, gy){
  beginShape()
  for(let i = 0; i < points.length; i ++){
    let x = points[i][0] * gx
    let y = points[i][1] * gy
    vertex(x, y)
  }
  endShape()
}
