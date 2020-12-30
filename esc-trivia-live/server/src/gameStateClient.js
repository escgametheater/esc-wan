import redis from "redis";

const gameStateClient = redis.createClient({
	host: process.env.REDIS_URL,

});

// Eventual todo, fulfill more namespaced setters/getters

console.log(gameStateClient);
export default (namespace) => ({
	_client: gameStateClient,
	get: (key, cb) => gameStateClient.get(`${namespace}.${key}`, cb),
	set: (key, value) => {
		gameStateClient.set(`${namespace}.${key}`, value)
	},
	mget: (keys, cb	) => gameStateClient.mget(keys.map(key => `${namespace}.${key}`), cb),
	mset: (keyValues) => {
		gameStateClient.mset(keyValues.map((kv, i) => i % 2 === 0 ? `${namespace}.${kv}` : kv))
	},
	incr: (key) => gameStateClient.incr(`${namespace}.${key}`),
	decr: (key) => gameStateClient.decr(`${namespace}.${key}`),
	hmset: (hashkey, ...args) => {
		gameStateClient.hmset(`${namespace}.${hashkey}`, args.map((kv, i) => i % 2 === 0 ? `${namespace}.${kv}` : kv))
	},
	hget: (hashkey, field, cb) => {
		gameStateClient.hget(`${namespace}.${hashkey}`, field, cb);
	},
	hset: (hashkey, field, value) => {
		gameStateClient.hset(`${namespace}.${hashkey}`, field, value);
	},
	hmset: (hashkey, field, value) => {
		gameStateClient.hmset(`${namespace}.${hashkey}`, field, value);
	},
	hgetall: (hashkey, cb) => {
		gameStateClient.hgetall(`${namespace}.${hashkey}`, cb);
	},
	expire: (key, ttl) => gameStateClient.expire(`${namespace}.${key}`, ttl),
});

/**
 * Potential Game State
 *
{
  ${slug}.activationId: 1,
  ${slug}.phase: "play-answer", 
  ${slug}.questionIndex: 124,
  ${slug}.questionId: "abc-123-xyz",
  ${slug}.questions.${questionId}.answers.${guestHash}.answerId - TTL 30s
  ${slug}.questions.${questionId}.answers.${guestHash}.answerTime - TTL 30s
  ${slug}.questions.${questionId}.text
  ${slug}.questions.${questionId}.answer1Text
  ${slug}.questions.${questionId}.answer1Count
  ${slug}.questions.${questionId}.answer2Text
  ${slug}.questions.${questionId}.answer2Count
  ${slug}.questions.${questionId}.answer3Text
  ${slug}.questions.${questionId}.answer3Count
}
*/