export function allowedOrigin(request: Request): string | null;
export function corsHeaders(origin: string): Record<string, string>;
export function withCors(response: Response, origin: string): Response;
export function requirePublicOrigin(request: Request): string;
export function anonymousOwnerKey(request: Request): Promise<string>;
export class PublicApiError extends Error {
  status: number;
  constructor(message: string, status: number);
}
