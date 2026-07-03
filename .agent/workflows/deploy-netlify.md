---
description: How to push to GitHub and deploy the application on Netlify
---
Follow these steps to deploy your FinScan AI application to Netlify and access it on your mobile phone:

### Step 1: Create a GitHub Repository
1. Go to [GitHub](https://github.com/) and log in.
2. Click **New** to create a new repository.
3. Name it `finscan-ai` (or any name you prefer). Leave it public or private, then click **Create repository** (do not add a README, license, or gitignore file).

### Step 2: Push your Code to GitHub
Open your terminal in this project directory and run the following commands (replace `<YOUR_GITHUB_USERNAME>` and `<YOUR_REPOSITORY_NAME>` with your details):
```bash
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy on Netlify
1. Go to [Netlify](https://www.netlify.com/) and sign in.
2. Click **Add new site** -> **Import an existing project**.
3. Choose **GitHub** and authorize Netlify to access your repositories.
4. Select the repository you just pushed (`finscan-ai`).
5. Netlify will automatically detect the settings from our `netlify.toml` file:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click **Deploy finscan-ai**.

### Step 4: Access on Mobile
Once the deployment finishes (usually takes less than 30 seconds):
1. Netlify will give you a unique public URL (e.g., `https://glowing-finance-abcde.netlify.app`).
2. Open this link on your mobile phone's Safari or Chrome browser.
3. You can tap the browser's "Share" button and select **"Add to Home Screen"** to save it as a native web app!
