const min_percentage = 0.3;
const max_percentage = 1 - min_percentage;

const current_activities = [
    "reading A Portrait of the Artist as a Young Man",
    "learning the piano",
    "writing code",
    "listening to NTS radio",
    "having a coffee",
    "learning Fusion 360",
    "doing a handstand",
    "playing Red Dead Redemption 2",
    "playing chess",
    "drawing"
]

function hsl_to_rgb(h, s, l) {

    // Normalise h, s and l
    s /= 100;
    l /= 100; 
    
    // https://www.baeldung.com/cs/convert-color-hsl-rgb
    let chroma = (1 - Math.abs(2 * l - 1)) * s;

    let h_prime = h/60;
    let x = chroma * (1 - Math.abs(h_prime % 2 - 1));

    let r1, g1, b1;

    if (h_prime >= 0 && h_prime < 1) {
        r1 = chroma; g1 = x; b1 = 0;
    } else if (h_prime >= 1 && h_prime < 2) {
        r1 = x; g1 = chroma; b1 = 0;
    } else if (h_prime >= 2 && h_prime < 3) {
        r1 = 0; g1 = chroma; b1 = x;
    } else if (h_prime >= 3 && h_prime < 4) {
        r1 = 0; g1 = x; b1 = chroma;
    } else if (h_prime >= 4 && h_prime < 5) {
        r1 = x; g1 = 0; b1 = chroma;
    } else {
        r1 = chroma; g1 = 0; b1 = x;
    } 

    let m = l - chroma/2;
    let r = Math.round((r1 + m) * 255);
    let g = Math.round((g1 + m) * 255);
    let b = Math.round((b1 + m) * 255);

    return [r, g, b];
}

function calc_luminance(r, g, b) {
    // https://dev.to/alvaromontoro/building-your-own-color-contrast-checker-4j7o
    let a = [r, g, b].map(function (v) {
        v /= 255;
        return v <= 0.03928
            ? v / 12.92
            : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function calc_contrast_ratio(rgb1, rgb2) {
    let lum1 = calc_luminance(rgb1[0], rgb1[1], rgb1[2]);
    let lum2 = calc_luminance(rgb2[0], rgb2[1], rgb2[2]);

    return lum1 > lum2 ?
        (lum1 + 0.05) / (lum2 + 0.05) :
        (lum2 + 0.05) / (lum1 + 0.05);
}

function generate_complimentary_colors(requirement) {
    // Generate complimentary colours that pass WCAG colour contrast requirements
    // (7.0:1) for small text in AAA-level
    // (4.5:1) for small text in AA-level, or large text in AAA-level
    // (3.0:1) for large text in AA-level

    while (true) {
        // Generate complimentary random colours
        // This creates more varied colours than rotating Hue values 180
        const primary_color = [Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255)];
        const complimentary_color = [Math.round(Math.random() * 255), Math.round(Math.random() * 255), Math.round(Math.random() * 255)];

        const contrast_ratio = calc_contrast_ratio(primary_color, complimentary_color);

        if (contrast_ratio >= requirement) {
            return [primary_color, complimentary_color]
        }
    }
}

document.addEventListener("DOMContentLoaded", function () {
    const root = document.documentElement;
    const name_div = document.getElementById("name");
    const about_div = document.getElementById("about");
    const contact_div = document.getElementById("contact");
    
    // === Generate random color scheme ===
    let [primary_color, complimentary_color] = generate_complimentary_colors(7); // Could change the requirement based off the size of the screen

    root.style.setProperty("--primary-color", `rgb(${primary_color[0]}, ${primary_color[1]}, ${primary_color[2]})`);
    root.style.setProperty("--complimentary-color", `rgb(${complimentary_color[0]}, ${complimentary_color[1]}, ${complimentary_color[2]})`);

    // === Generate random 3-box layout ===
    // Start at top left corner
    name_div.style.position = "absolute";
    name_div.style.top = "0px";
    name_div.style.left = "0px";

    // Choose random width and height of first div
    let name_width = Math.random() * (max_percentage - min_percentage) + min_percentage;
    let name_height = Math.random() * (max_percentage - min_percentage) + min_percentage;

    let name_div_width = window.innerWidth * name_width;
    let name_div_height = window.innerHeight * name_height;

    name_div.style.width = `${name_div_width}px`;
    name_div.style.height = `${name_div_height}px`;

    // Style other two divs based off the first div
    about_div.style.position = "absolute";
    about_div.style.top = "0px";
    about_div.style.left = `${name_div_width}px`;

    contact_div.style.position = "absolute";
    contact_div.style.top = `${name_div_height}px`;
    contact_div.style.left = "0px";

    // Choose either the bottom or the right side of the page to fit to
    let right_side = Math.random() < 0.5;
    if (right_side) {
        // Fit to right side
        about_div.style.width = `${window.innerWidth - name_div_width}px`;
        about_div.style.height = `${name_div_height}px`;
        about_div.style.borderBottom = "none";

        contact_div.style.width = `${window.innerWidth}px`;
        contact_div.style.height = `${window.innerHeight - name_div_height}px`;
        contact_div.style.borderRight = "none";
    } else {
        // Fit to bottom
        about_div.style.width = `${window.innerWidth - name_div_width}px`;
        about_div.style.height = `${window.innerHeight}px`;
        about_div.style.borderBottom = "none";

        contact_div.style.width = `${name_div_width}px`;
        contact_div.style.height = `${window.innerHeight - name_div_height}px`;
        contact_div.style.borderRight = "none";
    }

    // Adjust font size based off the container width and view width
    name_div.style.fontSize = 0.13 * name_width * window.innerWidth + "px";
    name_div.style.padding = 0.03 * name_width * window.innerWidth + "px";
    about_div.style.fontSize = 0.055 * (1 - name_width) * window.innerWidth + "px";
    about_div.style.padding = 0.05 * (1 - name_width) * window.innerWidth + "px";

    // Adjust icon sizes
    const icons = contact_div.querySelectorAll("svg");
    icons.forEach((icon) => {
        icon.style.height = right_side ? 
            0.04 * window.innerWidth + "px" : 
            0.03 * window.innerWidth + "px";
        icon.style.width = "auto";
    });


    let i = 0;
    const speed = 55;
    const wait_time = 2000;
    const currently_span = document.getElementById("currently");
    let activity_idx = Math.floor(Math.random() * current_activities.length);
    let txt = current_activities[activity_idx];
    let deleting = false;
    function typeWriter() {
        if (i < txt.length && !deleting) {
            currently_span.innerHTML += txt.charAt(i);
            i++;
            setTimeout(typeWriter, speed);
        } else if (i > 0 && deleting) {
            currently_span.innerHTML = currently_span.innerHTML.slice(0, -1);
            i--;
            setTimeout(typeWriter, speed-10);
        } else if (i == txt.length && !deleting) {
            setTimeout(() => {
                deleting = true;
                typeWriter();
            }, wait_time);
        } else if (i == 0 && deleting) {
            setTimeout(() => {
                activity_idx = (activity_idx+1) % current_activities.length;
                txt = current_activities[activity_idx];
                deleting = false;
                typeWriter();
            }, 1000);

        }
    }

    typeWriter();
});
