# Indigenous Language Sensitivity Review — Web Version

A standalone web app that scans text for language that may be offensive or biased toward Indigenous peoples. Powered by OpenAI — no server required.

**[Launch the tool →](https://YOUR-USERNAME.github.io/indigenous-language-review-web/)**  
*(Update this link after deploying)*

---

## How It Works

1. Open the web page in any browser
2. Enter your OpenAI API key (stored only in your browser — never sent to us)
3. Paste or type your text
4. Click **Scan** — flagged phrases are highlighted with colour-coded severity
5. Click any highlight or result card for details and a respectful alternative

---

## Deploy to GitHub Pages

### Option 1 — Manual (easiest)

1. Create a new repository on GitHub
2. Push this folder to it:
   ```bash
   cd indigenous-language-review-web
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/indigenous-language-review-web.git
   git push -u origin main
   ```
3. Go to **Settings → Pages** in your repository
4. Under **Source**, select **Deploy from a branch → main → / (root)**
5. Click **Save** — your site will be live in ~60 seconds at:  
   `https://YOUR-USERNAME.github.io/indigenous-language-review-web/`

### Option 2 — GitHub Actions (automatic)

A workflow file is included at `.github/workflows/deploy.yml`. It deploys automatically on every push to `main`.

1. Push the code to GitHub (same as above)
2. Go to **Settings → Pages** and change Source to **GitHub Actions**
3. That's it — every push deploys automatically

---

## Sharing With Colleagues

Just send them the GitHub Pages link. They need:
- A web browser (any modern browser works)
- An OpenAI API key

No installs, no downloads, no technical setup.

---

## Customising Guidelines

### For End Users
Click **"Edit Review Guidelines"** at the bottom of the page. Changes are saved in the browser.

### For Maintainers
Edit `guidelines-default.js` and push — this updates the defaults for all new users. Existing users who haven't customised guidelines will get the new defaults automatically.

---

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `style.css` | All styles |
| `app.js` | Application logic, OpenAI integration, highlighting |
| `guidelines-default.js` | Default guidelines (embedded, no server needed) |
| `.github/workflows/deploy.yml` | Auto-deploy workflow (optional) |

---

## Privacy

- Your API key is stored in `localStorage` — it never leaves your browser except when sent directly to OpenAI's API
- No analytics, no tracking, no cookies
- The page is entirely static — there is no backend server
- Text you scan is sent to OpenAI for analysis and is subject to [OpenAI's usage policies](https://openai.com/policies/usage-policies)
