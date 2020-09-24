import { RateLimiterClass, ExplorerMiddleware, ExplorerBase } from 'heat-server-common';
export declare class Explorer extends ExplorerBase {
    host: string;
    rateLimiter: RateLimiterClass;
    constructor(protocol: string, host: string, rateLimiter: RateLimiterClass, apiKey?: string, middleWare?: ExplorerMiddleware);
}
