import { Link } from 'react-router-dom';
import { User, MapPin, Award } from 'lucide-react';

export default function UserCard({ user }) {
  return (
    <div className="bg-card border border-border hover:border-primary/50 transition-colors rounded-2xl p-6 flex flex-col h-full relative group">
      <div className="absolute top-4 right-4 bg-background border border-border px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
        <Award size={14} className="text-yellow-400" />
        {user.swapCount || 0} Swaps
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-slate-800 overflow-hidden border-2 border-primary/20">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              <User size={32} />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{user.fullName}</h3>
          {user.location && (
            <div className="flex items-center gap-1 text-slate-400 text-sm">
              <MapPin size={14} />
              <span className="truncate">{user.location}</span>
            </div>
          )}
        </div>
      </div>

      <p className="text-slate-400 text-sm mb-6 line-clamp-2 min-h-[40px]">
        {user.bio || 'No bio provided by this user.'}
      </p>

      <div className="mt-auto space-y-4">
        <div>
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-2">Can Teach</div>
          <div className="flex flex-wrap gap-1.5">
            {user.skillsOffering?.map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded-md text-xs font-medium">
                {skill.name} • {skill.level}
              </span>
            ))}
            {(!user.skillsOffering || user.skillsOffering.length === 0) && <span className="text-sm text-slate-500">None listed</span>}
          </div>
        </div>
        
        <div>
          <div className="text-xs font-semibold tracking-wider text-slate-500 uppercase mb-2">Wants to Learn</div>
          <div className="flex flex-wrap gap-1.5">
            {user.skillsSeeking?.map((skill, i) => (
              <span key={i} className="px-2 py-1 bg-accent/10 text-accent border border-accent/20 rounded-md text-xs font-medium">
                {skill.name} • {skill.level}
              </span>
            ))}
            {(!user.skillsSeeking || user.skillsSeeking.length === 0) && <span className="text-sm text-slate-500">None listed</span>}
          </div>
        </div>
      </div>

      <Link to={`/profile/${user.id}`} className="mt-6 w-full py-2 bg-background border border-border text-center rounded-lg font-medium hover:bg-slate-800 transition-colors">
        View Profile
      </Link>
    </div>
  );
}
