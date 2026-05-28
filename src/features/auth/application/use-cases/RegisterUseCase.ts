import { AuthError } from '../../../../shared/domain/errors/AppError';
import { User } from '../../domain/entities/User';
import { IAuthRepository } from '../../domain/repositories/IAuthRepository';

export class RegisterUseCase {
    constructor(private readonly authRepo: IAuthRepository) {}

   async execute(email: string, password: string, username: string, role: 'cliente' | 'vendedor'): Promise<User> {
        if (!email || !password || !username || !role) 
            throw new AuthError('Todos los campos son obligatorios');
        
        if (password.length < 6)
            throw new AuthError('La contraseña debe tener al menos 6 caracteres');
            
        if (username.includes(' '))
            throw new AuthError('El nombre de usuario no puede contener espacios');
            
        if (role !== 'cliente' && role !== 'vendedor')
            throw new AuthError('El rol seleccionado no es válido');

        try {
            // Se envía el rol al repositorio
            return await this.authRepo.register(email, password, username, role);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al registrar usuario';
            throw new AuthError(message);
        }
    }
};