module.exports = {
  apps: [
    {
      name: "telegram-bot",
      script: "./app.js",
      instances: 1,
      exec_mode: "fork",
      watch: true,
      ignore_watch: ["node_modules"],
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "development",
        PORT: 4000,
        BOT_TOKEN: "7138446706:AAHzQWn13YC3PRyO3S6jLbUq8z_NpwWAJqs",
        DB_HOST: "103.161.184.180",
        DB_USER: "botdriver",
        DB_PASSWORD: "Akasia!23",
        DB_NAME: "botdriver_dev",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 4000,
        BOT_TOKEN: "7138446706:AAHzQWn13YC3PRyO3S6jLbUq8z_NpwWAJqs",
        DB_HOST: "103.161.184.180",
        DB_USER: "botdriver",
        DB_PASSWORD: "Akasia!23",
        DB_NAME: "botdriver_prod",
      },
    },
  ],
};
