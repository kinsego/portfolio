# Your Portfolio

A plain HTML/CSS/JS portfolio site — no build step, no dependencies.

## Structure

```
index.html      → homepage: project index + about + contact
styles.css       → all styling (design tokens at the top of the file)
script.js        → hover-preview interaction + fixed nav active-state
projects/         → one .html file per case study (add as you finish them)
assets/           → images, resume PDF, etc.
```

## Running it locally

No build tools needed. Either:
- Open `index.html` directly in a browser, or
- Run a tiny local server so relative paths behave exactly like production:
  ```
  python3 -m http.server 8000
  ```
  then visit `http://localhost:8000`

## Deploying to GitHub Pages

1. Create a new repo on GitHub (e.g. `yourname.github.io` for a root domain,
   or any name like `portfolio` for a project site).
2. Push this folder's contents to the repo's `main` branch:
   ```
   git init
   git add .
   git commit -m "Initial portfolio"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```
3. In the repo on GitHub: **Settings → Pages**.
4. Under "Build and deployment," set **Source** to `Deploy from a branch`,
   branch `main`, folder `/ (root)`. Save.
5. GitHub gives you a live URL within a minute or two:
   - `https://yourusername.github.io` (if the repo is named `yourusername.github.io`)
   - `https://yourusername.github.io/your-repo` (any other repo name)

Every time you push a change to `main`, the live site updates automatically —
no rebuild step, no deploy command.

## Adding a new project

1. Duplicate `projects/project-one.html` (once you've built it out) and
   rename it for the new project.
2. Add a new `.contents__row` in `index.html` pointing to it, with a
   `data-preview` image for the hover panel.
3. Drop the project's images into `assets/`.

## Notes on the design

- Colors, type, and layout tokens are documented at the top of `styles.css`.
- The bottom nav (`.dock`) is `position: fixed`, so it stays in place
  through scroll — same idea as poch.studio's nav.
- The hover-preview panel on the homepage only shows on wider screens
  (860px+); it's hidden on mobile since there's no hover there anyway.
