import type { Response } from 'express';

export class ApiResponse {
  // Base success method
  static success(res: Response, message: string, data: any = null, statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  // Shorthand for 201 Created
  static created(res: Response, message: string, data: any = null) {
    return this.success(res, message, data, 201);
  }
  // Shorthand for 204 No Content (Deletes)
  static noContent(res: Response) {
    return res.status(204).send();
  }
}
