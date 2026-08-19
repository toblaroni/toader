const { Engine, World, Bodies, Body, Events } = Matter;

const engine = Engine.create();
const world = engine.world;

engine.gravity.y = 0;

const complimentaryColor = getComputedStyle(document.documentElement)
    .getPropertyValue('--complimentary-color')
    .trim();


let restoreTimerId = null;
let isRestoring = false;
let restoreStart;
const restoreDelay = 3000;  // 3 Seconds

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

window.addEventListener('pointerdown', (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const forceRadius = 150;
    const forceStrength = 0.05;

    for (const letter of letters) {
        const dx = letter.body.position.x - mouseX;
        const dy = letter.body.position.y - mouseY;

        const distance = Math.hypot(dx, dy);

        if (distance < forceRadius) {
            // Direction away from the pointer
            const nx = dx / distance;
            const ny = dy / distance;

            const strength = forceStrength * (1 - distance / forceRadius);
            Body.applyForce(letter.body, letter.body.position, {
                x: nx * strength,
                y: ny * strength
            })

            // Rotate letter
            const rotationStrength = 0.5 * (1 - distance / forceRadius);

            Body.setAngularVelocity(
                letter.body,
                (Math.random() - 0.5) * rotationStrength
            );
        }
    }

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
    }, restoreDelay);
});


Events.on(engine, "beforeUpdate", () => {
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
    Engine.update(engine, 1000 / 60);

    for (let letter of letters) {
        const dx = letter.body.position.x - (letter.initX + letter.width / 2);
        const dy = letter.body.position.y - (letter.initY + letter.height / 2);
        letter.el.style.transform = 
            `translate3d(${dx}px, ${dy}px, 0) rotate(${letter.body.angle}rad)`;
    }

    requestAnimationFrame(renderLoop);
}

renderLoop();