# SSH File Manager

A web application to connect to a remote server via SSH and manage files through a Windows Explorer-like graphical interface.

## Project Structure

```text
/
├── backend/                # Node.js Express Server
│   ├── src/
│   │   ├── index.js        # Main entry point
│   │   └── ssh-manager.js  # SSH connection & SFTP logic
│   ├── .env                # Environment variables
│   ├── .gitignore
│   └── package.json
└── frontend/               # Web Interface
    ├── public/
    │   ├── index.html
    │   ├── css/
    │   │   └── style.css
    │   └── js/
    │       └── app.js
    ├── .gitignore
    └── package.json
```

## Getting Started

### Backend
1. Navigate to the `backend` directory: `cd backend`
2. Install dependencies: `npm install`
3. Configure your environment variables in `.env`
4. Start the server: `npm run dev`

### Frontend
1. Navigate to the `frontend` directory: `cd frontend`
2. Start a static server (e.g. using `npx serve public` or opening `public/index.html` directly)
