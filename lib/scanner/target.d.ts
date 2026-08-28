export type SafeTarget = { hostname: string; displayTarget: string };
export function normalizeTarget(raw: string): SafeTarget;
export function assertPublicDns(hostname: string): Promise<string[]>;
export function isPublicIp(ip: string): boolean;
