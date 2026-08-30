// lib/errors.ts — ApiError class + JSON serializer for route handlers

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toJSON(): { error: string; code: string; details?: unknown } {
    return {
      error: this.message,
      code: this.code,
      ...(this.details !== undefined ? { details: this.details } : {}),
    };
  }
}

export function errorResponse(err: unknown): { status: number; body: unknown } {
  if (err instanceof ApiError) {
    return { status: err.status, body: err.toJSON() };
  }
  const message = err instanceof Error ? err.message : "Unknown error";
  return { status: 500, body: { error: message, code: "internal_error" } };
}
