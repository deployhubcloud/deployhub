import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.PORT = '3001';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = 'test';
process.env.RABBITMQ_URL = 'amqp://localhost';
process.env.GITHUB_CLIENT_ID = 'client-id';
process.env.GITHUB_CLIENT_SECRET = 'client-secret';
process.env.INTERNAL_SECRET = 'abcdefghijklmnopqrstuvwxyz123456';
process.env.ACCESS_TOKEN_SECRET = 'abcdefghijklmnopqrstuvwxyz123456';
process.env.ACCESS_TOKEN_EXPIRY = '15m';
process.env.REFRESH_TOKEN_EXPIRY = '7d';
process.env.REFRESH_TOKEN_SECRET = 'abcdefghijklmnopqrstuvwxyz123456';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.DEVLOAD_PROJECT_ID = 'project';
process.env.DEVLOAD_API_KEY = 'key';

const { createSessionKey, hashRefreshToken } = await import('./session.service.js');

test('createSessionKey uses the standard deployhub session namespace', () => {
    assert.equal(createSessionKey('user-1', 'token-1'), 'deployhub:session:user-1:token-1');
});

test('hashRefreshToken is deterministic and does not expose the original token', () => {
    const token = 'refresh-token-value';
    const hash = hashRefreshToken(token);

    assert.equal(hash, hashRefreshToken(token));
    assert.notEqual(hash, token);
    assert.equal(hash.length, 64);
});
