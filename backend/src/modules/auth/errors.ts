import { AppError } from '../../errors';

export class AuthError extends AppError {
  constructor(status: number, code: string, message: string) {
    super(status, code, message);
    this.name = 'AuthError';
  }
}
