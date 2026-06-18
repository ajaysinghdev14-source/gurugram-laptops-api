export class ApiError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(statusCode: number, message: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Ensure the name of this error is the same as the class name
    this.name = this.constructor.name;

    // Capturing stack trace, excluding the constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }

  // static factory methods

  static badRequest(message: string) {
    return new ApiError(400, message);
  }

  static unauthorized(message: string = 'Unauthorized') {
    return new ApiError(401, message);
  }

  static forbidden(message: string = 'Forbidden') {
    return new ApiError(403, message);
  }

  static notFound(message: string = 'Not found') {
    return new ApiError(404, message);
  }

  static internal(message: string = 'Internal Server Error') {
    return new ApiError(500, message, false);
  }
}
