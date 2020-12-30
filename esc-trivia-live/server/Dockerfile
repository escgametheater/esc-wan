FROM keymetrics/pm2:latest-alpine

# Bundle APP files
ADD . /code
WORKDIR /code


# COPY server/src src/
# COPY server/package.json .
# COPY server/ecosystem.config.js .
# COPY common common/
# COPY server/trivia-question-data.json .

# Install app dependencies
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install --production

# Expose the listening port of your app
EXPOSE 8000

CMD [ "pm2-runtime", "--env", "production", "start", "ecosystem.config.js" ]