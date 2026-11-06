import type { DataResponse } from '../types/api';
import type { User } from '../types/user';
import { apiRequest } from './api';

export async function getUsers(): Promise<User[]> {
  const { data } = await apiRequest<DataResponse<User[]>>('/users');
  return data;
}
