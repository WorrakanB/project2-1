import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const AuthContext = createContext(null);

const USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Admin User',
  },
  {
    username: 'tech',
    password: 'tech123',
    role: 'technician',
    name: 'Technician User',
  },
  {
    username: 'exec',
    password: 'exec123',
    role: 'executive',
    name: 'Executive User',
  },
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('authUser');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('authUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('authUser');
    }
  }, [user]);

  const login = (username, password) => {
    const found = USERS.find(
      (item) => item.username === username && item.password === password,
    );

    if (!found) {
      throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    }

    setUser(found);
    return found;
  };

  const logout = () => setUser(null);

  const value = useMemo(() => ({ user, login, logout }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
