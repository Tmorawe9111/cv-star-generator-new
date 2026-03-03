/** Standard error with message - use for catch blocks */
export interface ErrorWithMessage {
  message?: string;
  [key: string]: unknown;
}

/** Type guard for ErrorWithMessage */
export function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as ErrorWithMessage).message === "string"
  );
}

/** Extract error message from unknown error */
export function getErrorMessage(error: unknown): string {
  if (isErrorWithMessage(error)) return error.message ?? "Unknown error";
  if (error instanceof Error) return error.message;
  return String(error);
}
