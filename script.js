const { Engine, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 0;
engine.gravity.scale = 0.002;

const complimentaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--complimentary-color')
    .trim();

let score = 0;
let isBallOnGround = false;
let respawnPending = false;
let ball = null

const scoreEl = document.getElementById('score');


function getCssStyle(element, prop) {
    return window.getComputedStyle(element, null).getPropertyValue(prop);
}

function getCanvasFont(el) {
  const fontWeight = getCssStyle(el, 'font-weight') || 'normal';
  const fontSize = getCssStyle(el, 'font-size') || '16px';
  const fontFamily = getCssStyle(el, 'font-family') || 'Times New Roman';
  
  return `${fontWeight} ${fontSize} ${fontFamily}`;
}

// Store position and value data
// Create the text
const els = document.querySelectorAll(".text-physics")

// Wait for fonts to load
await document.fonts.ready;

let textElements = [];
for (const el of els) {
    textElements.push({
        "value": el.textContent,
        "width": el.getBoundingClientRect().width,
        "position": {
            "top": el.getBoundingClientRect().top,
            "left": el.getBoundingClientRect().left,
        },
        "styles": {
            "font": getCanvasFont(el),
            "fontsize": getCssStyle(el, "font-size"),
        },
        "href": el.getAttribute("href"),
    });
}

for (const el of els) {
    el.style.display = "none";
}


function getCharDimensions(char, font) {
    const canvas = getCharDimensions.canvas || (getCharDimensions.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    context.font = font;
    const metrics = context.measureText(char);
    return [ 
        metrics.width, 
        metrics.actualBoundingBoxAscent +
        metrics.actualBoundingBoxDescent
    ];
}

// this will store the initial and current position of each letter
let letters = [];

// Display the text in initial positions
// We actually need to store positions of each character 
// Also need to add polygons into the matter.js world

for (const el of textElements) {
    let textLeft = el.position.left;
    let textTop = el.position.top;
    let lineHeight = null;

    let a = null;
    if (el.href) {
        a = document.createElement("a");
        a.href = el.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
    }

    // Split into words for text wrapping
    // You could avoid this by letting the browser do the wrapping
    for (const word of el.value.split(" ")) {
        const [wordWidth, wordHeight] = getCharDimensions(word, el.styles.font);
        const WRAP_TOLERANCE = 4;
        if (textLeft + wordWidth > el.position.left + el.width + WRAP_TOLERANCE) {
            // Newline
            lineHeight = !lineHeight ? wordHeight * 1.2 : lineHeight;
            textLeft = el.position.left;
            textTop += lineHeight;
        }

        for (const char of word) {
            const [charWidth, charHeight] = getCharDimensions(char, el.styles.font);
            // Add letter to DOM
            let span = document.createElement("span");
            span.textContent = char;

            Object.assign(span.style, {
                fontSize: el.styles.fontsize,
                font: el.styles.font,
                position: "absolute",
                left: textLeft + "px",
                top: textTop + "px",
                userSelect: "none"
            });

            if (a) {
                a.appendChild(span);
            } else {
                document.body.appendChild(span);
            }

            // Add body to the physics sim
            const scale = 0.95;
            const body = Bodies.rectangle(
                textLeft + charWidth/2, textTop + charHeight/2,
                charWidth * scale, charHeight * scale,
                {
                    restitution: 0.1,
                    friction: 0.1,
                    frictionAir: 0.05,
                    density: 0.006,
                }
            );
            World.add(world, body);

            // Store initial position
            letters.push({
                el: span,
                initX: textLeft,
                initY: textTop,
                width: charWidth,
                height: charHeight,
                body: body
            })

            textLeft += charWidth; 
        }
        // Add one link with all spans in for accessibility
        if (a)
            document.body.appendChild(a);

        // Add in a space after each word
        const [spaceWidth, spaceHeight] = getCharDimensions(" ", el.styles.font);
        textLeft += spaceWidth;
    }
}

// Create the ball in the DOM
const ballRadius = 50;
const ballEl = document.createElement("div")
Object.assign(ballEl.style, {
    position: 'fixed',
    width: `${ballRadius*2}px`,
    height: `${ballRadius*2}px`,
    borderRadius: '50%',
    background: complimentaryColor,
    left: '0',
    top: '0',
    transform: 'translate(-9999px, -9999px)',
});
document.body.appendChild(ballEl);

function createBall() {
    const range = window.innerWidth*0.75;
    return Bodies.circle(
        window.innerWidth/2 + (-range/2 + Math.random() * range),
        window.innerHeight / 2,
        ballRadius,
        { restitution: 0.2, friction: 0.05}
    );
} 

const floor = Bodies.rectangle(
    window.innerWidth / 2, window.innerHeight + 20, window.innerWidth + ballRadius, 40, 
    { isStatic: true, render: { visible: false } }
);
World.add(world, [floor]);

setTimeout(() => {
    ball = createBall();
    World.add(world, ball);
}, 1500);


// Check ball is out of bounds
Events.on(engine, 'afterUpdate', () => {
    if (!ball || respawnPending) return;
    const outOfBounds = ball.position.x < -ballRadius*1.5 || 
        ball.position.x > window.innerWidth + ballRadius*1.5 || 
        ball.position.y > window.innerHeight + ballRadius*1.5;
    if (outOfBounds) {
        World.remove(world, ball);
        ball = null;
        score = 0;
        renderScore();
        scheduleBallRespawn();
    }
});


function scheduleBallRespawn() {
    if (respawnPending) return;
    respawnPending = true;
    setTimeout(() => {
        ball = createBall();
        World.add(world, ball);
        isBallOnGround = false;
        respawnPending = false;
    }, 1500);
}

function isPointInBall(point, circleBody) { 
    if (!circleBody) return false; 
    const clickPadding = 5; 
    const effectiveRadius = ballRadius + clickPadding; 
    const dx = point.x - circleBody.position.x; 
    const dy = point.y - circleBody.position.y; 
    return dx * dx + dy * dy <= effectiveRadius * effectiveRadius;
}

window.addEventListener('pointerdown', (event) => {
    const clickPosition = { x: event.clientX, y: event.clientY };
    if (isPointInBall(clickPosition, ball)) {
        if (!isBallOnGround) {
            score += 1;
            renderScore();
        } const dx = clickPosition.x - ball.position.x;
        const dy = clickPosition.y - ball.position.y;
        const magnitude = Math.hypot(dx, dy) || 1;
        const nx = dx / magnitude;
        const ny = dy / magnitude;
        const forceStrength = 0.075 * ball.mass;
        const horizontalDamping = 0.3;
        const inverseY = -ny;
        const upwardY = -Math.max(Math.abs(inverseY), 0.35);
        Body.applyForce(ball, ball.position, { x: -nx * forceStrength * horizontalDamping, y: upwardY * forceStrength });
    }
});


Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
        const ballHitFloor = (pair.bodyA === ball && pair.bodyB === floor) || (pair.bodyB === ball && pair.bodyA === floor);
        if (ballHitFloor) {
            isBallOnGround = true;
            score = 0;
            renderScore();
        }
    }
});

Events.on(engine, 'collisionEnd', (event) => {
    for (const pair of event.pairs) {
        const ballLeftFloor = (pair.bodyA === ball && pair.bodyB === floor) || (pair.bodyB === ball && pair.bodyA === floor);
        if (ballLeftFloor) {
            isBallOnGround = false;
        }
    }
});

function renderScore() {
    if (scoreEl) scoreEl.textContent = String(score);
}


Events.on(engine, "beforeUpdate", () => {
    if (ball) {
        Body.applyForce(ball, ball.position, {
            x: 0,
            y: ball.mass * engine.gravity.scale
        });
    }

    const k = 0.0001;
    const damping = 0.0007;

    for (const letter of letters) {

        const targetX = letter.initX + letter.width/2;
        const targetY = letter.initY + letter.height/2;

        const dx = targetX - letter.body.position.x;
        const dy = targetY - letter.body.position.y;
        const dist2 = dx * dx + dy * dy;
        if (letter.body.speed < 0.02) {
            // Snap to position
            // Body.setPosition(letter.body, {
            //     x: targetX,
            //     y: targetY
            // })

            // Just stop moving
            Body.setVelocity(letter.body, {x: 0, y: 0});

        } else {
            Body.applyForce(letter.body, letter.body.position, {
                x: dx * k - letter.body.velocity.x * damping,
                y: dy * k - letter.body.velocity.y * damping
            });
        }

        const dr = -letter.body.angle;
        if (Math.abs(letter.body.angularVelocity) < 0.006) {
            Body.setAngularVelocity(letter.body, 0);
        } else {
            letter.body.torque += -letter.body.angle * 0.002;
        }
    }
});

function renderLoop() {
    Engine.update(engine);
    // Render the ball
    if (ball) {
        ballEl.style.transform = ` translate( 
            ${ball.position.x - ballRadius}px, 
            ${ball.position.y - ballRadius}px
        )`;
    }

    for (let letter of letters) {
        const dx = letter.body.position.x - (letter.initX + letter.width / 2);
        const dy = letter.body.position.y - (letter.initY + letter.height / 2);
        // Translate3d is gpu accelated
        letter.el.style.transform = 
            `translate3d(${dx}px, ${dy}px, 0) rotate(${letter.body.angle}rad)`;
    }

    requestAnimationFrame(renderLoop);
}

renderLoop();