let x = 0.01
let y = 0.01
let z = 0.01

let a = 10
let b = 28
let c = 8 / 3

let dt = 0.005
let inc = 0

let lorenzArr = []
const arrLen = 1000

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL)

  pixelDensity(displayDensity())
  stroke(255)
  strokeWeight(2.5)
  noFill()
}

function draw() {
  background(0)
  rotateY(radians(-30))
  scale(10)

  // Create the differential equations
  let dx = (a * (y - x)) * dt
  x += dx

  let dy = (x * (b - z) - y) * dt
  y += dy

  let dz = (x*y - c*z) * dt
  z += dz


  if (lorenzArr.length < arrLen) {
    lorenzArr.unshift([x, y, z])
  } else {
    lorenzArr.pop()
    lorenzArr.unshift([x, y, z])
  }

  drawLorenzLine()
}

function drawLorenzLine() {
  beginShape()
  for(let i = 0; i < lorenzArr.length; i ++) {
    vertex(lorenzArr[i][0], lorenzArr[i][1], lorenzArr[i][2])
  }
  endShape()
}