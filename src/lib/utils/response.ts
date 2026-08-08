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
        },
    });
};
