# Kaboom.js Platformer Game

A simple browser platformer game built with [Kaboom.js](https://kaboomjs.com/) where you move and jump across platforms. This project is beginner-friendly and easy to extend.

---

## How To Play

- **Controls:**
  - Left arrow: Move left
  - Right arrow: Move right
  - Spacebar: Jump (hold for longer jumps)
- Objective: Jump your way from platform to platform. If you fall out of the screen, the game resets!
- The camera follows your character.

---

## How To Run

1. **Open `index.html` in your web browser** (Double-click the file or use "Open with" > your browser).
2. That's it! No installation or server is required. The game loads Kaboom.js from a CDN.

---

## Project Structure

- `index.html` — Minimal HTML that loads Kaboom.js and your game logic in `main.js`.
- `main.js` — All game logic (level layout, player, controls, physics, camera, reset).
- `README.md` — This document.

---

## Customization

**Change jump height:**
- In `main.js`, find `const JUMP_FORCE = ...` and increase the value for bigger jumps (e.g., 1200 for very high jumps).

**Change movement speed:**
- In `main.js`, change `const PLAYER_SPEED = ...`.

**Add or move platforms:**
- In `main.js`, look for the `platforms = [...]` array. Each entry is `[x, y, width, height]` for a platform. Add more arrays or adjust values for custom levels.

---

## How The Code Works

- **Kaboom Initialization:** Sets up an 800x600 canvas and a sky-blue background.
- **Gravity:** `setGravity(GRAVITY)` gives the player real platformer physics.
- **Ground and Platforms:** Created as static physics objects (`body({ isStatic: true })`) so the player won't fall through.
- **Player:** A controllable rectangle with gravity and jump. Uses `body()` for physics and `area()` for collision.
- **Controls:** Arrow keys and space to move and jump.
- **Camera:** Follows the player with `camPos(player.pos)`.
- **Reset:** If the player falls below the bottom of the screen, the level resets.

---

## Troubleshooting

- If your player falls through the ground:
  - Make sure platforms/ground use both `area()` **and** `body({ isStatic: true })`.
  - Player should use `body()` and `area()`.
- Press `F1` while the game is open to enter inspect mode and check collision boxes (useful for debugging).

---

## Learn More

- [Kaboom.js documentation](https://kaboomjs.com/doc)
- [Play with Kaboom online](https://kaboomjs.com/play)
