import type { User } from "@lt/core";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

export {};
