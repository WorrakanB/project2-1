import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      const target =
        user.role === 'technician'
          ? '/tech/dashboard'
          : user.role === 'executive'
          ? '/executive/dashboard'
          : '/admin/dashboard';
      navigate(target, { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    try {
      const nextUser = login(username.trim(), password);
      const target =
        nextUser.role === 'technician'
          ? '/tech/dashboard'
          : nextUser.role === 'executive'
          ? '/executive/dashboard'
          : '/admin/dashboard';
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="left-panel">
          <div className="logo-box">TechJob 27</div>
        </div>

        <div className="right-panel">
          <h2>Sign in </h2>
          <form className="login-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Username"
              aria-label="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              aria-label="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="actions">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" />
                Remember me
              </label>
              <a href="#" onClick={(e) => e.preventDefault()}>
                Forget password
              </a>
            </div>

            {error && <p className="login-error">{error}</p>}

            <button className="signin-btn" type="submit">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
