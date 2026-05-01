import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react';

const SKILL_CATEGORIES = ['Coding', 'Design', 'Languages', 'Music', 'Finance', 'Writing', 'Marketing', 'Other'];

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const navigate = useNavigate();
  const { login, register } = useAuth();
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    skillsOffering: [],
    skillsSeeking: []
  });

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'signup');
  }, [searchParams]);

  const handleToggle = () => {
    setSearchParams({ mode: isLogin ? 'signup' : 'login' });
    setError('');
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSkillChange = (type, category) => {
    const list = formData[type];
    if (list.some(s => s.category === category)) {
      setFormData({ ...formData, [type]: list.filter(s => s.category !== category) });
    } else {
      setFormData({ ...formData, [type]: [...list, { name: category, category, level: 'Beginner' }] });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!isLogin && formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }
    
    setLoading(true);
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/discover');
      } else {
        const resUser = await register({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          skillsOffering: formData.skillsOffering,
          skillsSeeking: formData.skillsSeeking,
          bio: '',
          portfolioLinks: []
        });
        // navigate to own profile after registration
        navigate(`/profile/me`);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordStrong = formData.password.length >= 8;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-md p-8 rounded-2xl border border-border shadow-2xl mt-8 mb-8">
        
        {/* Toggle */}
        <div className="flex p-1 bg-background rounded-lg mb-8">
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-card shadow text-primary' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={handleToggle}
          >
            Log In
          </button>
          <button 
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-card shadow text-primary' : 'text-slate-400 hover:text-slate-200'}`}
            onClick={handleToggle}
          >
            Sign Up
          </button>
        </div>

        <h2 className="text-2xl font-bold text-center mb-6">
          {isLogin ? 'Welcome Back' : 'Create an Account'}
        </h2>

        {error && (
          <div className="p-3 mb-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-400">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input required type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-primary transition-colors" placeholder="John Doe" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-400">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-primary transition-colors" placeholder="you@example.com" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-400">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-primary transition-colors" placeholder="••••••••" />
            </div>
            {!isLogin && formData.password && (
              <div className="text-xs mt-1">
                <span className={isPasswordStrong ? 'text-green-400' : 'text-amber-400'}>
                  {isPasswordStrong ? 'Strong password' : 'Weak password (min 8 chars)'}
                </span>
              </div>
            )}
          </div>

          {!isLogin && (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-400">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full bg-background border border-border rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:border-primary transition-colors" placeholder="••••••••" />
                </div>
              </div>
              
              <div className="pt-4 border-t border-border mt-4">
                <label className="text-sm font-medium text-slate-400 mb-2 block">Skills I Can Teach (Select categories)</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {SKILL_CATEGORIES.map(cat => {
                    const selected = formData.skillsOffering.some(s => s.category === cat);
                    return (
                      <button type="button" key={cat} onClick={() => handleSkillChange('skillsOffering', cat)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${selected ? 'bg-primary/20 border-primary text-primary' : 'bg-background border-border text-slate-400 hover:border-slate-500'}`}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-400 mb-2 block">Skills I Want to Learn</label>
                <div className="flex flex-wrap gap-2">
                  {SKILL_CATEGORIES.map(cat => {
                    const selected = formData.skillsSeeking.some(s => s.category === cat);
                    return (
                      <button type="button" key={cat} onClick={() => handleSkillChange('skillsSeeking', cat)} className={`px-3 py-1 rounded-full text-sm border transition-colors ${selected ? 'bg-accent/20 border-accent text-accent' : 'bg-background border-border text-slate-400 hover:border-slate-500'}`}>
                        {cat}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          <button disabled={loading} type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 rounded-lg mt-6 transition-colors shadow">
            {loading ? 'Processing...' : (isLogin ? 'Log In' : 'Sign Up')}
          </button>
        </form>
      </div>
    </div>
  );
}
