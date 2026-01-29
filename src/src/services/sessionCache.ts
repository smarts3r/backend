import NodeCache from "node-cache";

const sessionCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 120 });

export const setSession = (userId, userData) => {
  return sessionCache.set(userId, userData);
};

export const getSession = (userId) => {
  return sessionCache.get(userId);
};

export const deleteSession = (userId) => {
  return sessionCache.del(userId);
};

export const clearAllSessions = () => {
  return sessionCache.flushAll();
};

export default sessionCache;
