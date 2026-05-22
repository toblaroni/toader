const { Engine, Render, Runner, World, Bodies, Body, Events, Common, Svg } = Matter;

const engine = Engine.create();
const world = engine.world;

Common.setDecomp(decomp)

const render = Render.create({
    element: document.body,
    engine,
    options: {
        width: window.innerWidth,
        height: window.innerHeight,
        wireframes: false,
        background: 'transparent'
    }
});

engine.gravity.scale = 0.002

// Make the Matter canvas an overlay on top of existing HTML content.
render.canvas.style.position = 'fixed';
render.canvas.style.inset = '0';
render.canvas.style.zIndex = '999';
render.canvas.style.background = 'transparent';
render.canvas.style.pointerEvents = 'none';

const ballRadius = 50;
const complimentaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--complimentary-color')
    .trim();

let ball = null;
let score = 0;
let isBallOnGround = false;
let respawnPending = false;
const scoreEl = document.getElementById('score');

function renderScore() {
    if (scoreEl) scoreEl.textContent = String(score);
}

// Parse our font so we can render it as polygons
async function loadFont() {
    const fontPath = "/static/BeVietnamPro-Regular.ttf";

    const response = await fetch(fontPath);
    const buffer = await response.arrayBuffer();

    return opentype.parse(buffer);
}

async function createTextPhysics() {
    // For each path, we need the vertices
    const toVertices = function(path) {
        const pathEl = document.createElementNS(
            'http://www.w3.org/2000/svg',
            'path'
        )
        pathEl.setAttribute('d', path)
        return Svg.pathToVertices(pathEl, 10)
    }

    // https://dev.to/thormeier/throwing-around-text-kinetic-typography-part-2-it-defies-gravity-itself-thanks-to-matterjs-239e
    // Turn the vertices into bodies
    const toBody = function (letter) {
        const vertices = toVertices(letter)
        return Bodies.fromVertices(0, 0, vertices, {
            render: {
                fillStyle: '#000',
                strokeStyle: '#000',
                lineWidth: 1,
            }
        })
    }
    const parsedFont = await loadFont()    // Parse font

    // Then we need to get the paths of the text
    const nameText = document.getElementById("name").innerText

    let bodies = []

    let x = 0
    for (const char of nameText) {
        if (char == " ") {
            x += 200
            continue
        }
        const nameTextPath = parsedFont.getPath(char, x, 300, 50);
        // get SVG path data
        const svgMarkup = nameTextPath.toPathData(3);

        bodies.push(toBody(svgMarkup))

        x += 100
    }

    Matter.Composite.add(world, bodies);

}

createTextPhysics()

function createBall() {
    return Bodies.circle(
        ballRadius * 1.5 + Math.random() * (window.innerWidth - ballRadius * 1.5),
        window.innerHeight / 2,
        ballRadius,
        {
            restitution: 0.2,
            friction: 0.05,
            render: {
                fillStyle: complimentaryColor
            }
        }
    );
}

const floor = Bodies.rectangle(
    window.innerWidth / 2,
    window.innerHeight + 20,
    window.innerWidth + ballRadius,
    40,
    {
        isStatic: true,
        render: {
            visible: false
        }
    }
);

World.add(world, [floor]);

setTimeout(() => {
    ball = createBall();
    World.add(world, ball);
}, 1500);

Render.run(render);
Runner.run(Runner.create(), engine);

function isPointInBall(point, circleBody) {
    if (!circleBody) return false;
    const clickPadding = 5;
    const effectiveRadius = ballRadius + clickPadding;
    const dx = point.x - circleBody.position.x;
    const dy = point.y - circleBody.position.y;
    return dx * dx + dy * dy <= effectiveRadius * effectiveRadius;
}

Events.on(render, 'afterRender', () => {
    // Keeps canvas size in sync if window dimensions changed.
    if (
        render.options.width !== window.innerWidth ||
        render.options.height !== window.innerHeight
    ) {
        render.canvas.width = window.innerWidth;
        render.canvas.height = window.innerHeight;
        render.options.width = window.innerWidth;
        render.options.height = window.innerHeight;
        Body.setPosition(floor, {
            x: window.innerWidth / 2,
            y: window.innerHeight + 20
        });
        Body.setVertices(floor, [
            { x: 0, y: window.innerHeight },
            { x: window.innerWidth, y: window.innerHeight },
            { x: window.innerWidth, y: window.innerHeight + 40 },
            { x: 0, y: window.innerHeight + 40 }
        ]);
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

Events.on(engine, 'afterUpdate', () => {
    if (!ball || respawnPending) return;

    const outOfBounds =
        ball.position.x < -ballRadius ||
        ball.position.x > window.innerWidth + ballRadius ||
        ball.position.y > window.innerHeight + ballRadius;

    if (outOfBounds) {
        World.remove(world, ball);
        ball = null;
        score = 0;
        renderScore();
        scheduleBallRespawn();
    }
});

window.addEventListener('pointerdown', (event) => {
    const clickPosition = { x: event.clientX, y: event.clientY };

    if (isPointInBall(clickPosition, ball)) {
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

        Body.applyForce(ball, ball.position, {
            x: -nx * forceStrength * horizontalDamping,
            y: upwardY * forceStrength
        });
    }
});

Events.on(engine, 'collisionStart', (event) => {
    for (const pair of event.pairs) {
        const ballHitFloor =
            (pair.bodyA === ball && pair.bodyB === floor) ||
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
        const ballLeftFloor =
            (pair.bodyA === ball && pair.bodyB === floor) ||
            (pair.bodyB === ball && pair.bodyA === floor);

        if (ballLeftFloor) {
            isBallOnGround = false;
        }
    }
});