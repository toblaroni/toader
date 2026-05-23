const { Engine, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
const world = engine.world;
engine.gravity.scale = 0.002;


const complimentaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--complimentary-color')
    .trim();

let score = 0;
let isBallOnGround = false;
let respawnPending = false;
let ball = null

const scoreEl = document.getElementById('score');

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
    return Bodies.circle(
        ballRadius * 1.5 + Math.random() * (window.innerWidth - ballRadius * 1.5),
        window.innerHeight / 2,
        ballRadius,
        { restitution: 0.2, friction: 0.05, render: { fillStyle: complimentaryColor } }
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
    const outOfBounds = ball.position.x < -ballRadius || ball.position.x > window.innerWidth + ballRadius || ball.position.y > window.innerHeight + ballRadius;
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

function renderLoop() {
    Engine.update(engine);
    // Render the ball
    if (ball) {
        ballEl.style.transform = ` translate( 
            ${ball.position.x - ballRadius}px, 
            ${ball.position.y - ballRadius}px
        )`;
    }

    requestAnimationFrame(renderLoop);
}

renderLoop();