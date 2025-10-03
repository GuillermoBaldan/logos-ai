export interface User {
  id: string;
  email: string;
  password: string; // Hash de la contraseña
  name: string;
  roles: string[];
  created_at: Date;
  updated_at: Date;
  last_login_at?: Date;
  is_active: boolean;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  roles?: string[];
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  roles?: string[];
  last_login_at?: Date;
  is_active?: boolean;
}

// Simulación de base de datos en memoria (para desarrollo)
export class UserModel {
  private static users: User[] = [];

  static async findById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  static async findByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  static async create(userData: CreateUserData): Promise<User> {
    const user: User = {
      id: require('uuid').v4(),
      email: userData.email,
      password: userData.password,
      name: userData.name,
      roles: userData.roles || ['user'],
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true
    };

    this.users.push(user);
    return user;
  }

  static async update(id: string, updateData: UpdateUserData): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updateData,
      updated_at: new Date()
    };

    return this.users[userIndex];
  }

  static async delete(id: string): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    return true;
  }

  static async findAll(): Promise<User[]> {
    return this.users;
  }
}