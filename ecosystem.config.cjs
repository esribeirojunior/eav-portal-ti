const path = require('path');

module.exports = {
    apps: [{
        name: 'gestao-ativos',
        script: 'server.js',
        cwd: __dirname,
        instances: 1,
        autorestart: true,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'production',
            PORT: 3000
        },
        error_file: path.join(__dirname, 'logs', 'pm2-error.log'),
        out_file: path.join(__dirname, 'logs', 'pm2-out.log'),
        log_file: path.join(__dirname, 'logs', 'pm2-combined.log'),
        time: true,
        kill_timeout: 5000
    }]
};
