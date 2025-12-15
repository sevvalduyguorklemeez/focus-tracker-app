import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

interface UserData {
  odid: string;
  email: string;
  displayName: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.log('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const register = async (email: string, password: string, displayName: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const newUserData: UserData = {
        odid: user.uid,
        email: email,
        displayName: displayName,
        createdAt: new Date(),
      };

      await setDoc(doc(db, 'users', user.uid), newUserData);
      setUserData(newUserData);
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUserData(null);
    } catch (error: any) {
      throw new Error('Çıkış yapılırken bir hata oluştu');
    }
  };

  const value: AuthContextType = {
    user,
    userData,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'Bu e-posta adresi zaten kullanılıyor';
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi';
    case 'auth/operation-not-allowed':
      return 'E-posta/şifre girişi etkin değil. Firebase Console\'dan aktifleştirin.';
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalıdır';
    case 'auth/user-disabled':
      return 'Bu hesap devre dışı bırakılmış';
    case 'auth/user-not-found':
      return 'Bu e-posta ile kayıtlı kullanıcı bulunamadı';
    case 'auth/wrong-password':
      return 'Yanlış şifre';
    case 'auth/invalid-credential':
      return 'E-posta veya şifre hatalı';
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yaptınız. Lütfen daha sonra tekrar deneyin';
    default:
      return 'Bir hata oluştu. Lütfen tekrar deneyin';
  }
};

export default AuthContext;
