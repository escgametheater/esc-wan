# ESC Trivia Live


## Controller
Listens for ESC Trivia Live cues and displays them
```bash
cd controller
npm install
npm run start
```

## Server
Publishes and subscribes / aggregates trivia questions and answers
```bash
cd server
```
#3# Running in dev mode

one time environment setup:
```bash
source ./env.sh
```

to iterate:
```bash
npm install
node src/bootstrap.js
```

redis:
When iterating locally, redis should be installed locally:
```bash
brew install redis
redis-server redis.conf
```

to docker build:

```bash
cd esc-trivia-live
docker-compose build
```

to docker run:
```bash
cd esc-trivia-live
docker-compose up
```

to Docker push #TODO evaluate this
```
docker push registry.gitlab.com/escgametheater/escdockerqa/esc-trivia-live:latest
```