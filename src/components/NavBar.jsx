import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, LogOut } from 'lucide-react';

const NavBar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full h-16 bg-card border-b border-border z-50 px-6 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:bg-accent transition-colors">
          <BookOpen size={24} />
        </div>
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          SkillSwap
        </span>
      </Link>

      <div className="flex items-center gap-6 font-medium text-sm">
        <Link to="/discover" className="hover:text-primary transition-colors">Discover</Link>
        <Link to="/contact" className="hover:text-primary transition-colors">Contact</Link>
        
        {user ? (
          <>
            <Link to="/swaps" className="hover:text-primary transition-colors">Swaps</Link>
            <div className="h-6 w-[1px] bg-border mx-2"></div>
            <Link to={`/profile/${user.id}`} className="flex items-center gap-2 hover:text-primary transition-colors">
              <User size={18} />
              <span>{user.fullName}</span>
            </Link>
            <button onClick={handleLogout} className="flex items-center gap-2 text-destructive hover:text-red-400 transition-colors">
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login" className="hover:text-primary transition-colors">Log in</Link>
            <Link to="/auth?mode=signup" className="bg-primary hover:bg-blue-600 text-primary-foreground px-4 py-2 rounded-full transition-all hover:shadow-lg hover:-translate-y-0.5">
              Sign up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default NavBar;
