module.exports = {
  apps: [
    {
      name: 'iara-scale-demo',
      script: './backend/src/server.js',
      cwd: '/root/iara-scale',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      restart_delay: 3000,
      max_restarts: 10,
      watch: false,
    },
  ],
};
