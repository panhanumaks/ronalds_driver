module.exports = {
  apps: [
    {
      name: "telegram-bot", // The name of your app
      script: "./app.js", // The script to run
      instances: 1, // Number of instances to run (1 for single instance)
      exec_mode: "fork", // 'fork' for single instance, 'cluster' for multiple
      watch: true, // Restart the app if a file changes
      ignore_watch: ["node_modules"], // Ignore node_modules directory
      max_memory_restart: "500M", // Auto-restart if the app uses more than 500MB RAM
      env: {
        // Default environment variables
        NODE_ENV: "development",
        PORT: 4000,
        BOT_TOKEN: "7138446706:AAHzQWn13YC3PRyO3S6jLbUq8z_NpwWAJqs", // Add your bot token here
      },
      env_production: {
        // Production environment variables
        NODE_ENV: "production",
        PORT: 4000,
        BOT_TOKEN: "7138446706:AAHzQWn13YC3PRyO3S6jLbUq8z_NpwWAJqs", // Add your bot token here
      },
    },
  ],
};
