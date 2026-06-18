export class HealthService {
  // Added "static"
  public static checkStatus() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      message: 'All Services are up',
    };
  }
}
