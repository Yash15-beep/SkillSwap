import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserById, updateUserProfile } from '../api/users';
import { User, MapPin, Edit2, PlaySquare, Calendar, ShieldCheck } from 'lucide-react';

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});

  const isOwnProfile = userId === 'me' || (currentUser && profileUser && currentUser.id === profileUser.id);
  const actualUserId = userId === 'me' ? currentUser?.id : userId;

  useEffect(() => {
    if (!actualUserId) {
      if (!currentUser) {
        navigate('/auth?mode=login');
      }
      return;
    }
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await getUserById(actualUserId);
        setProfileUser(data);
        setEditForm(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [actualUserId, currentUser, navigate]);

  const handleSave = async () => {
    try {
      const updated = await updateUserProfile(actualUserId, { bio: editForm.bio, location: editForm.location });
      setProfileUser(updated);
      if (isOwnProfile) setUser(updated);
      setEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-20 text-center text-slate-500">Loading profile...</div>;
  if (!profileUser) return <div className="p-20 text-center text-red-400">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      {/* Header section */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-8 relative shadow-lg">
        {isOwnProfile && !editing && (
          <button onClick={() => setEditing(true)} className="absolute top-6 right-6 text-slate-400 hover:text-primary transition-colors">
            <Edit2 size={20} />
          </button>
        )}
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-28 h-28 rounded-full bg-slate-800 border-4 border-primary/20 overflow-hidden flex-shrink-0">
            {profileUser.avatarUrl ? (
              <img src={profileUser.avatarUrl} alt={profileUser.fullName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                <User size={48} />
              </div>
            )}
          </div>
          
          <div className="flex-grow space-y-3">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {profileUser.fullName}
              <ShieldCheck className="text-green-400" size={24} />
            </h1>
            
            {editing ? (
              <div className="space-y-4 pt-2">
                <input 
                  type="text" 
                  value={editForm.location || ''} 
                  onChange={e => setEditForm({...editForm, location: e.target.value})} 
                  placeholder="Location (e.g. New York, USA)"
                  className="w-full bg-background border border-border rounded-lg py-2 px-4 focus:outline-none focus:border-primary"
                />
                <textarea 
                  value={editForm.bio || ''} 
                  onChange={e => setEditForm({...editForm, bio: e.target.value})} 
                  placeholder="Tell others about yourself..."
                  className="w-full bg-background border border-border rounded-lg py-2 px-4 focus:outline-none focus:border-primary h-24 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={handleSave} className="bg-primary hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">Save Changes</button>
                  <button onClick={() => setEditing(false)} className="bg-background border border-border px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm">
                  {profileUser.location && <div className="flex items-center gap-1"><MapPin size={16} />{profileUser.location}</div>}
                  <div className="flex items-center gap-1"><Calendar size={16} /> Joined {new Date(profileUser.createdAt).toLocaleDateString()}</div>
                </div>
                <p className="max-w-2xl text-slate-300 leading-relaxed text-lg">{profileUser.bio || 'No bio provided yet.'}</p>
              </>
            )}
          </div>

          {!isOwnProfile && currentUser && (
             <button 
               onClick={() => navigate(`/swaps?recipientId=${profileUser.id}`)}
               className="bg-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:-translate-y-1 flex items-center gap-2 whitespace-nowrap mt-4 md:mt-0"
             >
               <PlaySquare size={20} />
               Propose Swap
             </button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-card border border-border rounded-2xl p-6 shadow">
           <h3 className="text-xl font-bold mb-4 flex items-center gap-2">Skills I can teach</h3>
           <div className="space-y-3">
             {profileUser.skillsOffering?.map((skill, i) => (
                <div key={i} className="flex justify-between items-center bg-primary/5 p-4 rounded-xl border border-primary/10">
                  <span className="font-semibold text-primary">{skill.name}</span>
                  <span className="text-xs px-3 py-1 bg-background rounded-full border border-border text-slate-300">{skill.level}</span>
                </div>
             ))}
             {(!profileUser.skillsOffering || profileUser.skillsOffering.length === 0) && <p className="text-slate-500 italic">None listed</p>}
           </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow">
           <h3 className="text-xl font-bold mb-4 flex items-center gap-2">Skills I want to learn</h3>
           <div className="space-y-3">
             {profileUser.skillsSeeking?.map((skill, i) => (
                <div key={i} className="flex justify-between items-center bg-accent/5 p-4 rounded-xl border border-accent/10">
                  <span className="font-semibold text-accent">{skill.name}</span>
                  <span className="text-xs px-3 py-1 bg-background rounded-full border border-border text-slate-300">{skill.level}</span>
                </div>
             ))}
             {(!profileUser.skillsSeeking || profileUser.skillsSeeking.length === 0) && <p className="text-slate-500 italic">None listed</p>}
           </div>
        </div>
      </div>
      
      {/* Swap History Mock */}
      <div className="mt-8 bg-card border border-border rounded-2xl p-6 shadow">
         <h3 className="text-xl font-bold mb-4">Completed Swaps ({profileUser.swapCount || 0})</h3>
         {profileUser.swapCount > 0 ? (
           <p className="text-slate-400">This user is an active member of the SkillSwap community, having successfully completed {profileUser.swapCount} reciprocal sessions.</p>
         ) : (
           <p className="text-slate-500 italic">No completed swaps on record yet.</p>
         )}
      </div>
    </div>
  );
}
