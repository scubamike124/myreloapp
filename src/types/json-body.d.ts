/**
 * Request bodies stay `unknown` so callers must narrow them.
 * Response bodies stay loose (`any`) — upstream provider payloads vary widely
 * and are validated at use sites / runtime.
 */
interface Request {
  json(): Promise<unknown>;
}

interface Response {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  json(): Promise<any>;
}
