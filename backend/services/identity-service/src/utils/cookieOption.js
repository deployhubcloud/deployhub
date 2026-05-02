import { AUTH_ENV } from "../lib/env.js";

const baseOptions = {
  httpOnly: true
};

export const getAccessTokenOptions = () => ({
  ...baseOptions,
  secure: AUTH_ENV.NODE_ENV === "production",
  sameSite: AUTH_ENV.NODE_ENV === "production" ? "Strict" : "Lax",
  expires: new Date(Date.now() + 15 * 60 * 1000)
});

export const getRefreshTokenOptions = () => ({
  ...baseOptions,
  secure: AUTH_ENV.NODE_ENV === "production",
  sameSite: AUTH_ENV.NODE_ENV === "production" ? "Strict" : "Lax",
  domain: AUTH_ENV.NODE_ENV === "production" ? ".deployhub.cloud" : undefined,
  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
});

export const getClearAccessTokenOptions = () => ({
  ...baseOptions,
  secure: AUTH_ENV.NODE_ENV === "production",
  sameSite: AUTH_ENV.NODE_ENV === "production" ? "Strict" : "Lax"
});

export const getClearRefreshTokenOptions = () => ({
  ...getClearAccessTokenOptions(),
  domain: AUTH_ENV.NODE_ENV === "production" ? ".deployhub.cloud" : undefined
});
