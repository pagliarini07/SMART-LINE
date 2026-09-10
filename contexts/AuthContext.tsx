import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

type User = {
  email: string;
};

type AuthContextData = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthProviderProps = {
  children: ReactNode;
};

const STORAGE_KEY = "@smartline:session";

const AuthContext = createContext<AuthContextData | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSession();
  }, []);

  async function loadSession() {
    try {
      const storedSession = await AsyncStorage.getItem(STORAGE_KEY);

      if (storedSession) {
        const session: User = JSON.parse(storedSession);
        setUser(session);
      }
    } catch (error) {
      console.error("Erro ao carregar sessão:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(email: string) {
    const session: User = {
      email,
    };

    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(session)
    );

    setUser(session);
  }

  async function signOut() {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth deve ser utilizado dentro de um AuthProvider"
    );
  }

  return context;
}
