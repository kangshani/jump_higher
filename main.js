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

    // Infinite mode: Platform generation system
    let highestPlatformY = 80; // Track the highest platform Y position
    const PLATFORM_GENERATION_DISTANCE = 200; // Generate new platforms when player is within this distance
    const PLATFORM_REMOVAL_DISTANCE = 400; // Remove platforms this far below player
    const PLATFORM_SPACING = 120; // Vertical spacing between platforms
    const PLATFORM_MIN_WIDTH = 120;
    const PLATFORM_MAX_WIDTH = 260;
    
    // Store monster references for chasing behavior
    const monsters = [];
    let chestSpawned = false; // Track if chest has been spawned
    let lastChestY = -1000; // Track Y position of last spawned chest
    
    // Function to create a platform at a given Y position
    function createPlatform(y) {
        const w = rand(PLATFORM_MIN_WIDTH, PLATFORM_MAX_WIDTH);
        const x = rand(100, width() - 100 - w); // Random X position within screen bounds
        
        const platform = add([
            rect(w, 24),
            pos(x, y),
            area(),
            body({ isStatic: true }),
            color(...PLATFORM_COLOR),
            "platform"
        ]);
        
        // 30% chance to spawn a monster on this platform (except on the very first platform near ground)
        if (rand() < 0.2 && y < height() - 100) { // Allow monsters on all platforms except very close to ground
            const initialY = y - 20;
            const monster = add([
                sprite("monster"),
                pos(x + w / 2, initialY),
                area(),
                anchor("bot"),
                scale(0.5),
                z(15),
                "monster"
            ]);
            monsters.push({ monster, initialY });
        }
        
        // Spawn chest periodically (every ~400 pixels of height)
        if (!chestSpawned && y < lastChestY - 400 && rand() < 0.4) {
            chestSpawned = true;
            lastChestY = y;
            add([
                sprite("chest"),
                pos(x + w / 2, y - 10),
                area(),
                anchor("bot"),
                scale(1.2),
                z(20),
                "chest"
            ]);
        }
        
        return platform;
    }
    
    // Create initial platforms
    for (let y = 470; y >= 80; y -= PLATFORM_SPACING) {
        createPlatform(y);
        highestPlatformY = Math.min(highestPlatformY, y);
    }

    // TEST: Add the player as a Kaboom built-in sprite (bean)
    const player = add([
        sprite("bean"), // Use Kaboom's built-in CORS-friendly sprite
        pos(100, 180),
        area(),
        body(),
        anchor("bot"),
        scale(0.7),
        z(10),
        "player"
    ]);

    // Scene-local controls (stored so we can clean them up later if needed)
    let win = false;
    let lose = false;
    let jumpCount = 0; // Track number of jumps used (max 2 for double jump)
    let lives = 3; // Player starts with 3 lives
    let highestHeight = height() - 48; // Track highest platform Y reached (starts at ground level)
    
    // Create lives display in top left corner
    const livesDisplay = add([
        text(`Lives: ${lives}`, { size: 32 }),
        color(255, 255, 255),
        pos(20, 20),
        z(1000),
        "livesDisplay"
    ]);
    
    // Create height display below lives
    const heightDisplay = add([
        text(`Height: ${Math.floor((height() - 48 - highestHeight) / 10)}m`, { size: 28 }),
        color(255, 255, 200),
        pos(20, 60),
        z(1000),
        "heightDisplay"
    ]);
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

    // ---- TOUCH CONTROL BUTTONS WITH ICONS ----

    // Button sizes adapt to screen width
    const BTN_SIZE = width() * 0.06 ;
    const BTN_MARGIN = width() * 0.04;

    // Container height
    const CONTROL_HEIGHT = height() * 0.22;

    // Reusable button creator
    function touchBtn(icon, posX) {
        const btn = add([
            pos(posX, height() - CONTROL_HEIGHT / 2),
            circle(BTN_SIZE),
            area(),
            outline(4),
            color(255, 255, 255),
            opacity(0.35),
            anchor("center"),
            fixed(), 
            { pressed: false },
        ]);

        // Icon (text child)
        btn.add([
            text(icon, {
                size: BTN_SIZE * 0.9,          // scale icon to button size
                font: "sans-serif",
            }),
            anchor("center"),
            color(0, 0, 0),                    // black icon
        ]);

        return btn;
    }

    // Create buttons
    const leftBtn  = touchBtn("←", width() - BTN_MARGIN * 2 - BTN_SIZE * 3);
    const rightBtn = touchBtn("→", width() - BTN_MARGIN - BTN_SIZE);
    const jumpBtn  = touchBtn("⤒", BTN_MARGIN + BTN_SIZE);

    // Multi-touch state
    let leftPressed = false;
    let rightPressed = false;
    let jumpPressed = false;

    // Assign handlers
    function setupTouchButton(btn, setPressed) {
        btn.onMouseDown(() => setPressed(true));
        btn.onMouseRelease(() => setPressed(false));
        btn.onTouchStart(() => setPressed(true));
        btn.onTouchEnd(() => setPressed(false));
    }

    // Bind interactive behavior
    setupTouchButton(leftBtn,  v => leftPressed = v);
    setupTouchButton(rightBtn, v => rightPressed = v);
    setupTouchButton(jumpBtn,  v => jumpPressed = v);

    // Safety: release if any touch ends off-button
    onMouseRelease(() => {
        leftPressed = rightPressed = jumpPressed = false;
    });
    onTouchEnd(() => {
        leftPressed = rightPressed = jumpPressed = false;
    });

    // Apply movement every frame (joystick-style)
    onUpdate(() => {
        if (!win && !lose) {
            if (leftPressed)  player.move(-PLAYER_SPEED, 0);
            if (rightPressed) player.move( PLAYER_SPEED, 0);
            if (jumpPressed && player.isGrounded()) {
                player.jump(JUMP_FORCE);
            }
        }
    });


    // Detect collision with chest (coin) - BONUS (infinite mode)
    player.onCollide("chest", (chest) => {
        if (win || lose) return; // Prevent multiple triggers
        
        // Remove the collected chest
        if (chest.exists()) {
            destroy(chest);
            chestSpawned = false; // Allow new chest to spawn
            // Update lastChestY to allow new chests to spawn
            if (get("chest").length === 0) {
                lastChestY = player.pos.y - 400;
            }
        }
        
        // Give bonus: restore one life (up to max 10)
        if (lives < 10) {
            lives++;
            livesDisplay.text = `Lives: ${lives}`;
        }
        
        // Show bonus message briefly
        const bonusText = add([
            text("+1 LIFE!", { size: 48 }),
            color(0, 255, 0),
            pos(player.pos),
            anchor("center"),
            z(1000),
        ]);
        // Remove bonus text after 1 second
        wait(1, () => {
            if (bonusText.exists()) destroy(bonusText);
        });
    });

    // Detect collision with monster - reduce lives
    let monsterCollisionCooldown = 0; // Prevent multiple collisions in quick succession
    player.onCollide("monster", () => {
        if (win || lose || monsterCollisionCooldown > 0) return; // Prevent multiple triggers
        monsterCollisionCooldown = 60; // Cooldown for 1 second (60 frames at 60 FPS)
        
        lives--; // Reduce life
        livesDisplay.text = `Lives: ${lives}`; // Update display
        
        // If lives reach 0, player loses
        if (lives <= 0) {
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
        }
    });

    // Camera follows player, reset jump count on landing, check for fall, and make monsters chase player
    onUpdate(() => {
        camPos(player.pos);
        
        // Update lives display position to stay in top left of screen (relative to camera)
        // Since camera follows player, screen top-left is at player.pos - (width/2, height/2)
        if (livesDisplay.exists()) {
            livesDisplay.pos = vec2(player.pos.x - width() / 2 + 20, player.pos.y - height() / 2 + 20);
        }
        
        // Update height display position and track highest height reached
        if (heightDisplay.exists()) {
            heightDisplay.pos = vec2(player.pos.x - width() / 2 + 20, player.pos.y - height() / 2 + 60);
            
            // Track highest height (remember: lower Y = higher up)
            if (player.pos.y < highestHeight) {
                highestHeight = player.pos.y;
                // Update display with height in meters (scaled for game feel)
                const heightInMeters = Math.floor((height() - 48 - highestHeight) / 10);
                heightDisplay.text = `Height: ${heightInMeters}m`;
            }
        }
        
        // Reduce collision cooldown
        if (monsterCollisionCooldown > 0) {
            monsterCollisionCooldown--;
        }
        
        // Reset jump count when player lands on ground or platform
        if (player.isGrounded()) {
            jumpCount = 0;
        }
        
        // Infinite mode: Generate new platforms above player
        if (!win && !lose) {
            const playerY = player.pos.y;
            
            // Generate new platforms when player gets close to the top
            while (highestPlatformY > playerY - PLATFORM_GENERATION_DISTANCE) {
                highestPlatformY -= PLATFORM_SPACING;
                createPlatform(highestPlatformY);
            }
            
            // Platforms, monsters, and chests are NOT removed - they persist forever
            // This allows the world to keep growing and players can go back down if needed
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
