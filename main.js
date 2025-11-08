// main.js

// Initialize Kaboom with a canvas size and background color
kaboom({
    background: [135, 206, 235], // sky blue
    width: 800,
    height: 600,
});

// Load a Kaboom official sprite for testing CORS/rendering
loadSprite("bean", "https://kaboomjs.com/sprites/bean.png");
loadSprite("chest", "https://kaboomjs.com/sprites/coin.png"); // Kaboom coin used as a treasure chest
loadSprite("monster", "https://kaboomjs.com/sprites/ghosty.png"); // Monster sprite

// --- Constants ---
const PLAYER_SPEED = 600;
const JUMP_FORCE = 700;
const GRAVITY = 1600;
const MONSTER_SPEED = 150; // Speed at which monsters chase the player
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
        area(),
        body({ isStatic: true }),
        color(...GROUND_COLOR),
        "ground"
    ]);

    // Add floating platforms (static physics bodies)
    const platforms = [
        [200, 470, 260, 24],    // Increased width from 180 to 260
        [520, 380, 240, 24],    // Increased width from 160 to 240
        [300, 270, 200, 24],    // Increased width from 120 to 200
        [700, 215, 220, 24],    // Increased width from 140 to 220
        [180, 130, 180, 20],    // Increased width from 100 to 180
        [600, 80, 180, 20],     // Increased width from 100 to 180
    ];

    // Store monster references for chasing behavior
    const monsters = [];
    
    platforms.forEach(([x, y, w, h], i) => {
        add([
            rect(w, h),
            pos(x, y),
            area(),
            body({ isStatic: true }),
            color(...PLATFORM_COLOR),
            "platform"
        ]);
        // Place a treasure chest (coin) on the highest platform
        if (i === platforms.length - 1) {
            add([
                sprite("chest"),
                pos(x + w / 2, y - 10), // center of the platform, slightly above
                area(),
                anchor("bot"),
                scale(1.2),
                z(20),
                "chest"
            ]);
        }
        // Add monsters on some platforms (not on the first, last, or ground-level platforms)
        if (i > 0 && i < platforms.length - 1 && i % 2 === 0) {
            const initialY = y - 20; // Store initial Y position (on platform)
            const monster = add([
                sprite("monster"),
                pos(x + w / 2, initialY), // center of the platform, slightly above
                area(),
                anchor("bot"),
                scale(0.5), // Reduced from 0.8 to 0.5 to make monsters smaller
                z(15),
                "monster"
            ]);
            // Store monster with its initial Y position
            monsters.push({ monster, initialY }); // Store reference for chasing with Y position
        }
    });

    // TEST: Add the player as a Kaboom built-in sprite (bean)
    const player = add([
        sprite("bean"), // Use Kaboom's built-in CORS-friendly sprite
        pos(100, 180),
        area(),
        body(),
        anchor("bot"),
        scale(1),
        z(10),
        "player"
    ]);

    // Scene-local controls (stored so we can clean them up later if needed)
    let win = false;
    let lose = false;
    let jumpCount = 0; // Track number of jumps used (max 2 for double jump)
    const leftHandler = onKeyDown("left", () => { if (!win && !lose) player.move(-PLAYER_SPEED, 0); });
    const rightHandler = onKeyDown("right", () => { if (!win && !lose) player.move(PLAYER_SPEED, 0); });
    const jumpHandler = onKeyPress("space", () => {
        if (!win && !lose) {
            // Allow jump if grounded OR if player has only used 1 jump (double jump)
            if (player.isGrounded() || jumpCount < 2) {
                player.jump(JUMP_FORCE);
                jumpCount++;
            }
        }
    });

    // Detect collision with chest (coin) - WIN condition
    player.onCollide("chest", () => {
        if (win || lose) return; // Prevent multiple triggers
        win = true;
        // Remove the coin (chest)
        get("chest").forEach((chest) => destroy(chest));
        // Show win message at the center of the camera (observed view)
        add([
            text("YOU WIN!", { size: 64 }),
            color(32, 34, 255),
            pos(player.pos),
            anchor("center"),
            z(1000),
        ]);
        // Remove player controls
        leftHandler.cancel();
        rightHandler.cancel();
        jumpHandler.cancel();
        player.use(body({ isStatic: true })); // freeze
        // On any key press, reload game (go to main)
        onKeyPress(() => {
            go("main");
        });
    });

    // Detect collision with monster - LOSE condition
    player.onCollide("monster", () => {
        if (win || lose) return; // Prevent multiple triggers
        lose = true;
        // Show YOU LOSE message at center
        add([
            text("YOU LOSE", { size: 64 }),
            color(255, 40, 40),
            pos(player.pos),
            anchor("center"),
            z(1000),
        ]);
        // Remove player controls
        leftHandler.cancel();
        rightHandler.cancel();
        jumpHandler.cancel();
        player.use(body({ isStatic: true })); // freeze
        // After a short delay, listen for any key to restart
        wait(0.1, () => {
            onKeyPress(() => {
                go("main");
            });
        });
    });

    // Camera follows player, reset jump count on landing, check for fall, and make monsters chase player
    onUpdate(() => {
        camPos(player.pos);
        
        // Reset jump count when player lands on ground or platform
        if (player.isGrounded()) {
            jumpCount = 0;
        }
        
        // Make monsters chase the player horizontally (only move on X axis)
        if (!win && !lose) {
            monsters.forEach(({ monster, initialY }) => {
                if (monster.exists()) {
                    const dx = player.pos.x - monster.pos.x;
                    // Move toward player horizontally
                    if (Math.abs(dx) > 2) {
                        const direction = dx > 0 ? 1 : -1;
                        // Calculate movement per frame (assuming 60 FPS, adjust as needed)
                        const moveAmount = (MONSTER_SPEED / 60) * direction;
                        // Update X position and keep Y fixed on platform
                        monster.moveTo(vec2(monster.pos.x + moveAmount, initialY));
                    } else {
                        // Keep Y position fixed even when not moving
                        monster.moveTo(vec2(monster.pos.x, initialY));
                    }
                }
            });
        }
        
        // Check if player fell off screen
        if (!win && !lose && player.pos.y > height()) {
            lose = true;
            // Show YOU LOSE message at center for clarity
            add([
                text("YOU LOSE", { size: 64 }),
                color(255, 40, 40),
                pos(player.pos), // Changed to player.pos for consistency
                anchor("center"),
                z(1000),
            ]);
            // Remove player controls
            leftHandler.cancel();
            rightHandler.cancel();
            jumpHandler.cancel();
            player.use(body({ isStatic: true })); // freeze
            // After a short delay, listen for any key to restart
            wait(0.1, () => {
                onKeyPress(() => {
                    go("main");
                });
            });
        }
    });
});

// Start the game in the main scene
go("main");
