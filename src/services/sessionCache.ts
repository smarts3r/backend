import NodeCache from "node-cache";
import type { User } from "../types";

const sessionCache = new NodeCache({ stdTTL: 15 * 60, checkperiod: 120 });

export const setSession = (userId: string, userData: User): boolean => {
  return sessionCache.set(userId, userData);
};

export const getSession = (userId: string): User | undefined => {
  return sessionCache.get<User>(userId);
};

export const deleteSession = (userId: string): number => {
  return sessionCache.del(userId);
};

export const clearAllSessions = () => {
  return sessionCache.flushAll();
};

export default sessionCache;
