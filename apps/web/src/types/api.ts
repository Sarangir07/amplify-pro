/** The response from GET /health on the Express API. */
export interface HealthResponse {
  status: string;
  message: string;
}

/** The shape of a successful response that carries data. */
export interface DataResponse<T> {
  status: 'success';
  data: T;
}
