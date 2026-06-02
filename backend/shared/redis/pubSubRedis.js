class RedisConfig {
    constructor(Redis, options = {}) {
        this.publisher = new Redis(options);
        this.subscriber = new Redis(options);

        process.on("SIGINT", async () => {
            await this.publisher.quit();
            await this.subscriber.quit();
            console.log("Redis connections closed");
        });
    }

    async produce(channel, message) {
        await this.publisher.publish(channel, message);
    }

    async consume(channel, callback) {
        await this.subscriber.subscribe(channel);

        this.subscriber.on("message", async (ch, message) => {
            if (ch === channel) {
                await callback(message);
            }
        });
    }

    async disconnect() {
        await this.publisher.quit();
        await this.subscriber.quit();
    }
}

export default RedisPubSub;