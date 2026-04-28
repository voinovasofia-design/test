# Pixel Plumber (Mario-style HTML5 Game)

A lightweight Mario-inspired platformer made with pure HTML5 Canvas, CSS, and JavaScript.

## Play locally

1. Clone this repository.
2. Open `index.html` in your browser.

## Controls

- Move: Arrow Left/Right or A/D
- Jump: Space, Arrow Up, or W
- Restart (after win/lose): R

## Publish with GitHub Pages

This repository includes a workflow at `.github/workflows/deploy-pages.yml` that deploys the site automatically.

1. Push this repo to GitHub.
2. In GitHub, open **Settings → Pages**.
3. Under **Build and deployment**, select **GitHub Actions** as the source.
4. Push to your default branch (or run the workflow manually in **Actions**).
5. Your game will be published at:
   - `https://<your-username>.github.io/<repo-name>/`

## Notes

- This project is intentionally framework-free and uses no external assets.
- You can tune difficulty by editing values in `game.js` (gravity, speed, enemy patterns, lives).
