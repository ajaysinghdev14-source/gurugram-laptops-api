import type { Request, Response } from 'express';
import { HealthService } from './health.service.js';
import { ApiResponse } from '../../common/utils/api-response.js';

export class HealthController {
  public static check = (req: Request, res: Response) => {
    const data = HealthService.checkStatus();

    return ApiResponse.success(res, 'Health check passed', data);
  };
}
