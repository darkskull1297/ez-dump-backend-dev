export interface ErrorCode {
  code: string;
  msg: string;
}

const errorCodes: Record<string, ErrorCode> = {};
export default errorCodes;

export function registerErrorCode(code: string, msg: string): string {
  if (errorCodes[code]) {
    throw new Error(`Code ${code} already in use`);
  }
  const errorCode: ErrorCode = {
    code,
    msg,
  };
  errorCodes[code] = errorCode;
  return code;
}
