// main.js

// Initialize Kaboom with a canvas size and background color
kaboom({
    background: [135, 206, 235], // sky blue
    width: 800,
    height: 600,
});

// --- Constants ---
const PLAYER_SPEED = 600;
const JUMP_FORCE = 700;
const GRAVITY = 1600;
const PLATFORM_COLOR = [100, 200, 100];
const GROUND_COLOR = [80, 60, 40];

// Set gravity for the game world
setGravity(GRAVITY);

// --- Scene Setup ---
scene("main", () => {
    // Add ground (static physics body + collider)
    add([
        rect(width(), 48),
        pos(0, height() - 48),
        area(), // just a basic rectangle collider
        body({ isStatic: true }), // immovable, supports player
        color(...GROUND_COLOR),
        "ground"
    ]);

    // Add floating platforms (static physics bodies)
    const platforms = [
        [200, 470, 180, 24],
        [520, 380, 160, 24],
        [300, 270, 120, 24],
        [700, 215, 140, 24],
        [180, 130, 100, 20],    // new higher platform left
        [600, 80, 100, 20],     // new highest platform right
    ];

    platforms.forEach(([x, y, w, h]) => {
        add([
            rect(w, h),
            pos(x, y),
            area(), // rectangle collider
            body({ isStatic: true }), // immovable
            color(...PLATFORM_COLOR),
            "platform"
        ]);
    });

    // Add the player as a rectangle
    // Start the player much higher for a visible fall at game start.
    const player = add([
        rect(40, 60),
        pos(80, 400), // start much higher up
        area(), // for collisions
        body(), // enables gravity and jumping
        color(220, 90, 90),
        z(10), 
        "player"
    ]);

    // Scene-local controls
    onKeyDown("left", () => {
        player.move(-PLAYER_SPEED, 0);
    });

    onKeyDown("right", () => {
        player.move(PLAYER_SPEED, 0);
    });

    // Only allow jump if the player is grounded
    onKeyPress("space", () => {
        if (player.isGrounded()) {
            player.jump(JUMP_FORCE);
        }
    });

    // Camera follows player and resets if fallen
    onUpdate(() => {
        camPos(player.pos);
        if (player.pos.y > height()) {
            go("main");
        }
    });
});

// Start the game in the main scene
go("main");
