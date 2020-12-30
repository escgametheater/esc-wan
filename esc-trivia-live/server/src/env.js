export const pubnubConfig = {
    subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY || "",
    publish_key: process.env.PUBNUB_PUBLISH_KEY || "",
    secret_key: process.env.PUBNUB_SECRET_KEY || "",
    transactionalRequestTimeout: process.env.PUBNUB_TIMEOUT || 2000
};

export const escConfig = {
    host: process.env.ESC_API_HOST || "",
    apiKey: process.env.ESC_API_KEY|| ""
};

export const env = process.env.NODE_ENV || "";

