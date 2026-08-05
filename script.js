const { Engine, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 0;
engine.gravity.scale = 0.002;

const complimentaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--complimentary-color')
    .trim();

const scoreEl = document.getElementById('score');

let score = 0;
let isBallOnGround = false;
let respawnPending = false;
let ball = null

let restoreTimerId = null;
let isRestoring = false;
let restoreStart;

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
        "element": el,
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

// this will store the initial and current position of each letter
let letters = [];

// Display the text in initial positions
// We actually need to store positions of each character 
// Also need to add polygons into the matter.js world

for (const el of textElements) {
    const textNode = el.element.firstChild;
    let a = null;
    let parent = document.body;

    if (el.href) {
        a = document.createElement("a");
        a.href = el.href;
        a.target = el.element.getAttribute("target") || "_self";
        parent = a;
    }

    let rects = [];
    for (let i = 0; i < textNode.length; i++) {

        // Measure each character in the range
        const range = document.createRange();

        range.setStart(textNode, i);
        range.setEnd(textNode, i+1);

        const rect = range.getBoundingClientRect();
        rects.push(rect);
    }

    rects.forEach((rect, i) => {

        if (rect.width === 0 || rect.height === 0)
            return;

        const char = textNode.textContent[i];

        // Add letter to DOM
        let span = document.createElement("span");
        span.textContent = char;

        Object.assign(span.style, {
            fontSize: el.styles.fontsize,
            font: el.styles.font,
            position: "absolute",
            left: rect.x + "px",
            top: rect.y + "px",
            userSelect: "none",
            
        });

        parent.appendChild(span);

        // Add body to the physics sim
        const scale = 0.55;
        const body = Bodies.rectangle(
            rect.x + rect.width/2, rect.y + rect.height/2,
            rect.width * scale, rect.height * scale,
            {
                restitution: 0.1,
                friction: 0.1,
                frictionAir: 0.05,
                density: 0.01,
            }
        );
        World.add(world, body);

        // Store initial position
        letters.push({
            el: span,
            initX: rect.x,
            initY: rect.y,
            width: rect.width,
            height: rect.height,
            body: body
        })
    });

    if (a) {
        document.body.appendChild(a);
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
    willChange: 'transform',
    transform: 'translate3d(-9999px, -9999px, 0px)',
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

        // Reset the letters when the mouse hasn't been clicked for a bit
        if (restoreTimerId) {
            clearTimeout(restoreTimerId);
            restoreTimerId = null;
            isRestoring = false;
        } 

        restoreTimerId = setTimeout(() => {
            isRestoring = true;

            // Give each letter an offset 
            for (let letter of letters) {
                // Between zero and 3 seconds
                letter["restoreOffset"] = Math.random() * 12000;
                letter["restoreSpeed"] = 0.1 + Math.random() * 0.2;
                restoreStart = Date.now();
            }
        }, 2500);

        if (!isBallOnGround) {
            score += 1;
            renderScore();
        } 

        const dx = clickPosition.x - ball.position.x;
        const dy = clickPosition.y - ball.position.y;
        const magnitude = Math.hypot(dx, dy) || 1;
        const nx = dx / magnitude;
        const ny = dy / magnitude;
        const forceStrength = 0.075 * ball.mass;
        const horizontalDamping = 0.3;
        const inverseY = -ny;
        const upwardY = -Math.max(Math.abs(inverseY), 0.35);

        Body.applyForce(
            ball, 
            ball.position, 
            { 
                x: -nx * forceStrength * horizontalDamping, 
                y: upwardY * forceStrength 
            }
        );
    }
});


Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
        const ballHitFloor = (pair.bodyA === ball && pair.bodyB === floor) || 
            (pair.bodyB === ball && pair.bodyA === floor);
        if (ballHitFloor) {
            isBallOnGround = true;
            score = 0;
            renderScore();
        }

    }
});


Events.on(engine, 'collisionEnd', (event) => {
    for (const pair of event.pairs) {
        const ballLeftFloor = (pair.bodyA === ball && pair.bodyB === floor) || 
            (pair.bodyB === ball && pair.bodyA === floor);
        if (ballLeftFloor) {
            isBallOnGround = false;
        }
    }
});

function renderScore() {
    if (scoreEl) 
        scoreEl.textContent = String(score);
}


Events.on(engine, "beforeUpdate", () => {
    if (ball) {
        // Apply gravity only to the ball
        Body.applyForce(ball, ball.position, {
            x: 0,
            y: ball.mass * engine.gravity.scale
        });
    }

    if (isRestoring) {
        const elapsedTime = Date.now() - restoreStart;

        for (const letter of letters) {
            if (elapsedTime < letter.restoreOffset)
                continue;

            const minSpeed = 0.05; // Prevent jittery crawling....
            const maxSpeed = letter.restoreSpeed;
            const slowRadius = 30;

            const targetX = letter.initX + letter.width/2;
            const targetY = letter.initY + letter.height/2;

            const dx = targetX - letter.body.position.x;
            const dy = targetY - letter.body.position.y;

            const dist = Math.hypot(dx, dy);

            let speed;

            if (dist > slowRadius) {
                speed = maxSpeed;
            } else {
                // Cubic ease out
                const t = Math.min(dist / slowRadius, 1);
                speed = minSpeed + 
                    (maxSpeed * (1 - Math.pow(1 - t, 3)));
            }

            if (dist <= 0.5) {
                Body.setPosition(letter.body, { x: targetX, y: targetY });
                Body.setVelocity(letter.body, { x: 0, y: 0 });
                Body.setAngularVelocity(letter.body, 0);
            } else {
                // Normalise
                Body.setVelocity(letter.body, {
                    x: dx / dist * speed,
                    y: dy / dist * speed  
                });

                Body.setAngularVelocity(
                    letter.body,
                    -letter.body.angle * speed * 0.03
                );
            }

        }
    }
});


function renderLoop() {
    Engine.update(engine);
    // Render the ball
    if (ball) {
        // Translate3d is gpu accelated
        ballEl.style.transform = ` translate3d( 
            ${ball.position.x - ballRadius}px, 
            ${ball.position.y - ballRadius}px,
            0px
        )`;
    }

    console.log(restoreTimerId);

    for (let letter of letters) {
        const dx = letter.body.position.x - (letter.initX + letter.width / 2);
        const dy = letter.body.position.y - (letter.initY + letter.height / 2);
        letter.el.style.transform = 
            `translate3d(${dx}px, ${dy}px, 0) rotate(${letter.body.angle}rad)`;
    }

    requestAnimationFrame(renderLoop);
}

renderLoop();