// src/features/auth/application/use-cases/LoginUseCase.ts
import { AuthError } from '../../../../shared/domain/errors/AppError';
import { User } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class LoginUseCase {
    constructor(private readonly authRepo: IAuthRepository) {}

    /**
     * Ejecuta el inicio de sesión validando credenciales básicas antes de ir a infraestructura.
     */
    async execute(email: string, password: string): Promise<User> {
        if (!email || !password) {
            throw new AuthError('Email y contraseña son requeridos');
        }

        try {
            return await this.authRepo.login(email, password);
        } catch (error: any) {
            // Evaluamos la traza del error de forma segura
            throw new AuthError(error?.message || 'Credenciales inválidas', error);
        }
    }
}