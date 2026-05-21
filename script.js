const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
const world = engine.world;

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

function createBall() {
  return Bodies.circle(
    50 + Math.random() * (window.innerWidth - 50),
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
  window.innerWidth,
  40,
  {
    isStatic: true,
    render: {
      visible: false
    }
  }
);

const leftWall = Bodies.rectangle(-20, window.innerHeight / 2, 40, window.innerHeight, {
  isStatic: true,
  render: { visible: false }
});

const rightWall = Bodies.rectangle(
  window.innerWidth + 20,
  window.innerHeight / 2,
  40,
  window.innerHeight,
  {
    isStatic: true,
    render: { visible: false }
  }
);

const topWall = Bodies.rectangle(window.innerWidth / 2, -20, window.innerWidth, 40, {
  isStatic: true,
  render: { visible: false }
});

World.add(world, [floor, leftWall, rightWall, topWall]);

setTimeout(() => {
  ball = createBall();
  World.add(world, ball);
}, 1500);

Render.run(render);
Runner.run(Runner.create(), engine);

function isPointInBall(point, circleBody) {
  if (!circleBody) return false;
  const clickPadding = 18;
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

    Body.setPosition(leftWall, {
      x: -20,
      y: window.innerHeight / 2
    });
    Body.setVertices(leftWall, [
      { x: -40, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: window.innerHeight },
      { x: -40, y: window.innerHeight }
    ]);

    Body.setPosition(rightWall, {
      x: window.innerWidth + 20,
      y: window.innerHeight / 2
    });
    Body.setVertices(rightWall, [
      { x: window.innerWidth, y: 0 },
      { x: window.innerWidth + 40, y: 0 },
      { x: window.innerWidth + 40, y: window.innerHeight },
      { x: window.innerWidth, y: window.innerHeight }
    ]);

    Body.setPosition(topWall, {
      x: window.innerWidth / 2,
      y: -20
    });
    Body.setVertices(topWall, [
      { x: 0, y: -40 },
      { x: window.innerWidth, y: -40 },
      { x: window.innerWidth, y: 0 },
      { x: 0, y: 0 }
    ]);
  }
});

window.addEventListener('pointerdown', (event) => {
  const clickPosition = { x: event.clientX, y: event.clientY };

  if (isPointInBall(clickPosition, ball)) {
    const dx = clickPosition.x - ball.position.x;
    const dy = clickPosition.y - ball.position.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const nx = dx / magnitude;
    const ny = dy / magnitude;

    const forceStrength = 0.06 * ball.mass;
    const horizontalDamping = 0.3;
    const inverseY = -ny;
    const upwardY = -Math.max(Math.abs(inverseY), 0.35);

    Body.applyForce(ball, ball.position, {
      x: -nx * forceStrength * horizontalDamping,
      y: upwardY * forceStrength
    });
  }
});