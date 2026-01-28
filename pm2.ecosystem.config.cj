module.exports = {
  apps: [
    // ---------- Backend ----------
    {
      name: "insight-backend",
      cwd: "./backend",
      script: "npm",
      args: "start",               // expects a "start" script in backend/package.json
      interpreter: "none",
      env: {
        NODE_ENV: "production",
        // All other env vars are read from backend/.env automatically
      },
      watch: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
      out_file: "./logs/backend.out.log",
      error_file: "./logs/backend.err.log",
      combine_logs: true,
    },

    // ---------- Front‑end ----------
    {
      name: "insight-frontend",
      cwd: "./",                     // repo root – where `dist/` lives
      script: "npm",
      args: "run preview -- --port 3001", // Vite preview serves the static build
      interpreter: "none",
      env: {
        NODE_ENV: "production",
      },
      watch: false,
      log_date_format: "YYYY-MM-DD HH:mm Z",
      out_file: "./logs/frontend.out.log",
      error_file: "./logs/frontend.err.log",
      combine_logs: true,
    },
  ],
};