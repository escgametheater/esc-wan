const slug = process.env.NODE_ENV !== 'production' ? require("os").hostname().replace(/\./g, "-") : "esc-trivia-live";

module.exports = {
    apps: [{
        name: 'ESC Trivia Live',
        script: 'src/bootstrap.js',

        // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
        args: slug,
        instances: 1,
        autorestart: false,
        watch: false,
        max_memory_restart: '1G',
        env: {
            NODE_ENV: 'development',
            PUBNUB_SUBSCRIBE_KEY: "<<<REDACTED>>>",
            PUBNUB_PUBLISH_KEY: "<<<REDACTED>>>",
            ESC_API_HOST: "https://api.esc.games",
            ESC_API_KEY: ""
        },
        env_production: {
            NODE_ENV: 'production',
            PUBNUB_SUBSCRIBE_KEY: "<<<REDACTED>>>",
            PUBNUB_PUBLISH_KEY: "<<<REDACTED>>>",
            ESC_API_HOST: "https://api.esc.games",
            ESC_API_KEY: ""
        }
    }],

    deploy: {
        production: {
            user: 'node',
            ref: 'origin/master',
            repo: 'git@bitbucket.org:escgametheater/esc-wan.git',
            path: '/var/www/production',
            'post-deploy': 'npm install && pm2 --interpreter reload ecosystem.config.js --env production'
        }
    }
};
