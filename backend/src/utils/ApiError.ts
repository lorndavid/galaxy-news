export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors?: Record<string, string[]>;

  constructor(
    statusCode: number,
    message: string,
    code = "ERROR",
    errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
  }

  static badRequest(message = "Bad request", errors?: Record<string, string[]>) {
    return new ApiError(400, message, "BAD_REQUEST", errors);
  }

  static unauthorized(message = "Authentication required") {
    return new ApiError(401, message, "UNAUTHORIZED");
  }

  static forbidden(message = "You do not have permission to do this") {
    return new ApiError(403, message, "FORBIDDEN");
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message, "NOT_FOUND");
  }

  static conflict(message = "Conflict") {
    return new ApiError(409, message, "CONFLICT");
  }

  static unprocessable(message = "Unprocessable entity") {
    return new ApiError(422, message, "UNPROCESSABLE_ENTITY");
  }
}
