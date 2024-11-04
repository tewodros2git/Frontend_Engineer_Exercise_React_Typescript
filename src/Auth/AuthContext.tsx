import { createContext, useContext, useState, ReactNode } from 'react';
import { User } from '../server/db'

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (userData: User) => void;
    logout: () => void;
    setIsAuthenticated: (authState: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const login = (userData: User) => {
        setUser(userData);
        setIsAuthenticated(true); // Set authenticated state on login
    };

    const logout = () => {
        setUser(null);
        setIsAuthenticated(false); // Clear authenticated state on logout
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout ,setIsAuthenticated}}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
