import { useUser, APP_USERS, AppUserName } from '@/contexts/UserContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function AuthPage() {
  const { selectUser, isLoggedIn } = useUser();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  const handleUserSelect = async (name: AppUserName) => {
    await selectUser(name);
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
          <span className="text-primary-foreground font-bold text-3xl">AC</span>
        </div>
        <h1 className="text-3xl font-bold text-foreground">Painel AC</h1>
        <p className="text-muted-foreground mt-1">SISRAMOS</p>
      </div>

      {/* Title */}
      <h2 className="text-xl font-semibold text-foreground mb-6">
        Selecione seu usuário
      </h2>

      {/* User Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-3xl">
        {APP_USERS.map((user) => (
          <button
            key={user.name}
            onClick={() => handleUserSelect(user.name)}
            className="group relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-offset-2"
            style={{
              borderColor: user.color,
              backgroundColor: `${user.color}10`,
            }}
          >
            {/* Avatar */}
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mb-4 text-white font-bold text-2xl shadow-lg transition-transform group-hover:scale-110"
              style={{ backgroundColor: user.color }}
            >
              {user.initials}
            </div>
            
            {/* Name */}
            <span 
              className="text-xl font-bold transition-colors"
              style={{ color: user.color }}
            >
              {user.name}
            </span>

            {/* Hover effect overlay */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity"
              style={{ backgroundColor: user.color }}
            />
          </button>
        ))}
      </div>

      {/* Footer */}
      <p className="mt-8 text-sm text-muted-foreground">
        Clique no seu nome para entrar no sistema
      </p>
    </div>
  );
}
