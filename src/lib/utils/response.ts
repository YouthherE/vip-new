export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T | null;
}

export const success = <T>(data: T, message: string = 'Success'): ApiResponse<T> => {
  return {
    code: 200,
    message,
    data,
  };
};

export const error = (code: number, message: string): ApiResponse<null> => {
  return {
    code,
    message,
    data: null,
  };
};

export const jsonResponse = (response: ApiResponse, status: number = 200) => {
    return new Response(JSON.stringify(response), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'",
        },
    });
};
