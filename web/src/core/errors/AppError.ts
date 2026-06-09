export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details: any;

  constructor(message: string, statusCode = 500, code = "INTERNAL_SERVER_ERROR", details: any = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new TargetConcreteError(this.constructor));
  }
}

// Helper subclass target configuration helper
class TargetConcreteError extends Error {
  constructor(constructorFunc: Function) {
    super();
    Error.captureStackTrace(this, constructorFunc);
  }
}
