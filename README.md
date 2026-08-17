# SSH File Manager

A web application to connect to a remote server via SSH and manage files through a Windows Explorer-like graphical interface.

## Features

- **Windows Explorer-Style Interface**: Address bar, breadcrumbs navigation, quick access sidebar, context menus, and status bar.
- **Full Column Sorting**: Click any header (`Name`, `Date modified`, `Type`, `Size`) to cycle through sort states:
  - **1st click**: First order (e.g. A-Z, Most Recent, or Largest first)
  - **2nd click**: Reverse order (e.g. Z-A, Oldest, or Smallest first)
  - **3rd click**: Reset to default folder order
- **Remote SFTP Operations**: Create folders, rename, delete files and folders, and navigate directory structures.
- **GitHub Pages Ready**: Host the frontend statically on GitHub Pages.

## Project Structure

```text
/
├── .github/workflows/
│   └── deploy.yml          # GitHub Actions workflow for GitHub Pages
├── backend/                # Node.js Express Server
│   ├── src/
│   │   ├── index.js        # Main entry point with Socket.io & SFTP bridge
│   │   └── ssh-manager.js  # SSH connection & SFTP logic
│   ├── .env                # Environment variables
│   ├── .gitignore
│   └── package.json
└── frontend/               # Web Interface
    ├── public/
    │   ├── index.html      # Main HTML interface
    │   ├── css/
    │   │   └── style.css   # Windows Explorer theme styles
    │   └── js/
    │       └── app.js      # Client logic & sorting
    ├── .gitignore
    └── package.json
```

## Getting Started

### 1. Running Backend

The backend acts as the bridge connecting your browser to remote SSH/SFTP servers.

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
   By default, the backend runs on `http://localhost:3000`.

### 2. Running Frontend Locally

You can serve the frontend locally or open `frontend/public/index.html` directly in your browser:
```bash
cd frontend
npx serve public
```

---

## Hosting Frontend on GitHub Pages

You can host the frontend for free using GitHub Pages:

### Automatic Deployment (GitHub Actions)

1. Push your repository to GitHub (`main` branch).
2. Go to your repository on GitHub -> **Settings** -> **Pages**.
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. The included workflow (`.github/workflows/deploy.yml`) will automatically deploy the `frontend/public` directory.
5. Once deployed, access your file manager at `https://<your-github-username>.github.io/<repository-name>/`.
