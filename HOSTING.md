# Hosting this project on GitHub Pages

Follow these steps so the site runs without errors when opened from GitHub.

## 1. Push the right files

Make sure your repo has at the **root** of the branch you use for GitHub Pages:

- `index.html` (main PBL page)
- `demo.html` (demo instructions)
- `.nojekyll` (tells GitHub not to use Jekyll; avoids broken links and missing files)

The `.nojekyll` file is empty; it just has to exist. It prevents GitHub from ignoring some folders or treating the site as Jekyll.

## 2. Turn on GitHub Pages

1. Open your repo on GitHub.
2. Go to **Settings** → **Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Under **Branch**, pick the branch (e.g. `main`) and set the folder to **/ (root)**.
5. Click **Save**.

Your site will be at: `https://<username>.github.io/<repo-name>/`

## 3. Use relative links (already done)

Links in this project are already relative (`index.html`, `demo.html`, `./index.html`), so they work on GitHub Pages. Do not change them to absolute URLs that point to your own machine.

## 4. If you still see errors

- **404 or blank page**  
  Ensure `index.html` is at the root of the branch you selected in Pages (not inside a subfolder unless you set that folder in Settings → Pages).

- **“View Code / Demo” shows wrong content**  
  On the live site, the demo page explains that the Lecture Mind app runs locally and shows how to run it. The “Open Lecture Mind” button only works when you run the app on your computer (e.g. `npm run dev` in `lecture-mind`).

- **Styles or fonts missing**  
  The site uses Google Fonts over HTTPS. If you are offline or behind a strict firewall, fonts may not load; the rest of the page should still work.

## 5. Optional: deploy the Lecture Mind app

To give visitors a live demo without running it locally, deploy the `lecture-mind` app (e.g. [Vercel](https://vercel.com) or [Netlify](https://netlify.com)), then replace the demo instructions link with your deployed URL (e.g. `https://your-lecture-mind.vercel.app`).
