import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserById, updateUserProfile } from '../api/users';
import { User, Edit2, PlaySquare, Calendar, ShieldCheck, Plus, Trash2 } from 'lucide-react';

const CATEGORIES = ['Coding', 'Design', 'Languages', 'Music', 'Finance', 'Writing', 'Marketing', 'Other'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];

const emptySkill = { name: '', category: 'Coding', level: 'Beginner' };

export default function Profile() {
  const { userId } = useParams();
  const { user: currentUser, setUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [offeringSkills, setOfferingSkills] = useState([]);
  const [seekingSkills, setSeekingSkills] = useState([]);
  const [saveError, setSaveError] = useState('');

  const isOwnProfile = userId === 'me' || (currentUser && profileUser && currentUser.id === profileUser.id);
  const actualUserId = userId === 'me' ? currentUser?.id : userId;

  useEffect(() => {
    if (!actualUserId) {
      if (!currentUser) navigate('/auth?mode=login');
      return;
    }
    const fetchUser = async () => {
      setLoading(true);
      try {
        const data = await getUserById(actualUserId);
        setProfileUser(data);
        setEditForm({ fullName: data.fullName, bio: data.bio || '', avatarUrl: data.avatarUrl || '' });
        setOfferingSkills(data.skillsOffering?.map(s => ({ name: s.name, category: s.category, level: s.level })) || []);
        setSeekingSkills(data.skillsSeeking?.map(s => ({ name: s.name, category: s.category, level: s.level })) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [actualUserId, currentUser, navigate]);

  const handleSave = async () => {
    setSaveError('');
    // Validate skills have names
    const allSkills = [...offeringSkills, ...seekingSkills];
    if (allSkills.some(s => !s.name.trim())) {
      setSaveError('All skills must have a name.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateUserProfile(actualUserId, {
        fullName: editForm.fullName,
        bio: editForm.bio,
        avatarUrl: editForm.avatarUrl,
        skillsOffering: offeringSkills,
        skillsSeeking: seekingSkills,
      });
      setProfileUser(updated);
      if (isOwnProfile) setUser(updated);
      setEditing(false);
    } catch (err) {
      setSaveError(err.message || 'Failed to save. Please try again.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const updateSkill = (list, setList, index, field, value) => {
    const updated = list.map((s, i) => i === index ? { ...s, [field]: value } : s);
    setList(updated);
  };

  const removeSkill = (list, setList, index) => setList(list.filter((_, i) => i !== index));

  const SkillEditor = ({ list, setList, label, colorClass, borderClass }) => (
    <div className={`bg-card border ${borderClass} rounded-2xl p-6 shadow`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold">{label}</h3>
        {editing && (
          <button
            onClick={() => setList([...list, { ...emptySkill }])}
            className="flex items-center gap-1 text-sm text-primary hover:text-blue-400 transition-colors"
          >
            <Plus size={16} /> Add Skill
          </button>
        )}
      </div>
      <div className="space-y-3">
        {list.length === 0 && <p className="text-slate-500 italic">None listed</p>}
        {list.map((skill, i) => (
          editing ? (
            <div key={i} className="bg-background border border-border rounded-xl p-3 space-y-2">
              <div className="flex gap-2 items-center">
                <input
                  type="text"
                  value={skill.name}
                  onChange={e => updateSkill(list, setList, i, 'name', e.target.value)}
                  placeholder="Skill name"
                  className="flex-1 bg-card border border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-primary"
                />
                <button onClick={() => removeSkill(list, setList, i)} className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="flex gap-2">
                <select
                  value={skill.category}
                  onChange={e => updateSkill(list, setList, i, 'category', e.target.value)}
                  className="flex-1 bg-card border border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-primary text-slate-100"
                >
                  {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#1e293b] text-slate-100">{c}</option>)}
                </select>
                <select
                  value={skill.level}
                  onChange={e => updateSkill(list, setList, i, 'level', e.target.value)}
                  className="flex-1 bg-card border border-border rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-primary text-slate-100"
                >
                  {LEVELS.map(l => <option key={l} value={l} className="bg-[#1e293b] text-slate-100">{l}</option>)}
                </select>
              </div>
            </div>
          ) : (
            <div key={i} className={`flex justify-between items-center ${colorClass} p-4 rounded-xl`}>
              <div>
                <span className="font-semibold">{skill.name}</span>
                <span className="text-xs text-slate-400 ml-2">{skill.category}</span>
              </div>
              <span className="text-xs px-3 py-1 bg-background rounded-full border border-border text-slate-300">{skill.level}</span>
            </div>
          )
        ))}
      </div>
    </div>
  );

  if (loading) return <div className="p-20 text-center text-slate-500">Loading profile...</div>;
  if (!profileUser) return <div className="p-20 text-center text-red-400">User not found.</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      {/* Header */}
      <div className="bg-card border border-border rounded-2xl p-8 mb-8 relative shadow-lg">
        {isOwnProfile && !editing && (
          <button onClick={() => setEditing(true)} className="absolute top-6 right-6 text-slate-400 hover:text-primary transition-colors">
            <Edit2 size={20} />
          </button>
        )}
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          {/* Avatar */}
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
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={e => setEditForm({ ...editForm, fullName: e.target.value })}
                  placeholder="Full name"
                  className="w-full bg-background border border-border rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-slate-100"
                />
                <input
                  type="text"
                  value={editForm.avatarUrl}
                  onChange={e => setEditForm({ ...editForm, avatarUrl: e.target.value })}
                  placeholder="Avatar image URL (optional)"
                  className="w-full bg-background border border-border rounded-lg py-2 px-4 focus:outline-none focus:border-primary text-slate-100"
                />
                <textarea
                  value={editForm.bio}
                  onChange={e => setEditForm({ ...editForm, bio: e.target.value })}
                  placeholder="Tell others about yourself..."
                  className="w-full bg-background border border-border rounded-lg py-2 px-4 focus:outline-none focus:border-primary h-24 resize-none text-slate-100"
                />
                {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setSaveError(''); }}
                    className="bg-background border border-border px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-4 text-slate-400 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar size={16} /> Joined {new Date(profileUser.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <p className="max-w-2xl text-slate-300 leading-relaxed text-lg">
                  {profileUser.bio || 'No bio provided yet.'}
                </p>
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

      {/* Skills */}
      <div className="grid md:grid-cols-2 gap-8">
        <SkillEditor
          list={offeringSkills}
          setList={setOfferingSkills}
          label="Skills I can teach"
          colorClass="bg-primary/5 border border-primary/10 text-primary"
          borderClass="border-border"
        />
        <SkillEditor
          list={seekingSkills}
          setList={setSeekingSkills}
          label="Skills I want to learn"
          colorClass="bg-accent/5 border border-accent/10 text-accent"
          borderClass="border-border"
        />
      </div>

      {/* Swap count */}
      <div className="mt-8 bg-card border border-border rounded-2xl p-6 shadow">
        <h3 className="text-xl font-bold mb-4">Completed Swaps ({profileUser.swapCount || 0})</h3>
        {profileUser.swapCount > 0 ? (
          <p className="text-slate-400">
            This user is an active member of the SkillSwap community, having successfully completed {profileUser.swapCount} reciprocal sessions.
          </p>
        ) : (
          <p className="text-slate-500 italic">No completed swaps on record yet.</p>
        )}
      </div>
    </div>
  );
}
