  import helmet from "helmet";

export const helmetMiddleware = () => {
  return helmet({
    contentSecurityPolicy: false,
  });
};
