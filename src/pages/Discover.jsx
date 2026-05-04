import { useState, useEffect } from 'react';
import { getAllUsers } from '../api/users';
import UserCard from '../components/UserCard';
import { Search, Filter, Loader2 } from 'lucide-react';

const CATEGORIES = ['All', 'Coding', 'Design', 'Languages', 'Music', 'Finance', 'Writing', 'Marketing', 'Other'];

export default function Discover() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const data = await getAllUsers(search, category);
        setUsers(data);
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    const timeoutId = setTimeout(fetchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [search, category]);

  return (
    <div className="max-w-6xl mx-auto p-4 py-8">
      <div className="mb-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Discover Partners</h1>
          <p className="text-slate-400">Find people to exchange skills with.</p>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Search by name, bio, or skills..." 
              className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary transition-colors"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="relative md:w-64">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none z-10" size={20} />
            <select 
              className="w-full bg-[#1e293b] text-slate-100 border border-border rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c} className="bg-[#1e293b] text-slate-100">
                  {c === 'All' ? 'All Categories' : c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="animate-spin mr-2" size={24} />
          <span>Searching database...</span>
        </div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(u => (
            <UserCard key={u.id} user={u} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-card rounded-2xl border border-dashed border-border flex flex-col items-center">
          <div className="text-6xl mb-4">🏜️</div>
          <h3 className="text-xl font-bold mb-2">No partners found</h3>
          <p className="text-slate-400">Try adjusting your filters or search query.</p>
        </div>
      )}
    </div>
  );
}
