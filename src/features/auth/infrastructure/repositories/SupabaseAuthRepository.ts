import { supabase } from "../../../../shared/infrastructure/supabase/client";
import { User } from "../../domain/entities/User";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository";

export class SupabaseAuthRepository implements IAuthRepository {
  async login(email: string, password: string): Promise<User> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.user) throw error;

    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email!,
      username: profile?.username ?? "",
      avatarUrl: profile?.avatar_url ?? undefined,
      role: data.user.user_metadata?.role ?? 'cliente',
    };
  }

  async loginWithGoogle(): Promise<void> {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'petadopt://',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
  }

  async register(
    email: string,
    password: string,
    username: string,
    role: 'cliente' | 'vendedor'
  ): Promise<User> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, role },
      },
    });
    
    if (error) throw error;
    if (!data.user) throw new Error("No se pudo crear el usuario");
    
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({ id: data.user.id, username });
      
    if (profileError) throw new Error(profileError.message);
    
    return { 
      id: data.user.id, 
      email: data.user.email!, 
      username, 
      role: data.user.user_metadata?.role ?? role, 
      avatarUrl: undefined 
    };
  }

  async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("id", user.id)
      .single();
      
    return {
      id: user.id,
      email: user.email!,
      username: profile?.username ?? "",
      avatarUrl: profile?.avatar_url ?? undefined,
      role: user.user_metadata?.role ?? 'cliente',
    };
  }

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'petadopt://reset-password',
    });
    if (error) throw error;
  }
}