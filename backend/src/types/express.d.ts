import { Role } from "../constants";

declare global {
  namespace Express {
    interface Request {
      /** Unique request ID (UUID) assigned by the request logger */
      id?: string;
      user?: {
        id: number;
        name: string;
        email: string;
        role: Role;
        avatar: string | null;
      };
      // Payload produced by the zod validate() middleware.
      // Fields are typed by each route's schema via casts in controllers.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validated?: any;
    }
  }
}

export {};
