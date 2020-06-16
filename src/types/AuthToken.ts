export interface AuthToken {
  token: string;
  expireInSeconds: number;
  expiresAt?: number;
}
