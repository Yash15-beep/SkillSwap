import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUserSwaps, createSwapRequest, updateSwapStatus } from '../api/swaps';
import { getUserById } from '../api/users';
import { Check, X, Clock, FileText, Send } from 'lucide-react';

export default function Swaps() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const recipientId = searchParams.get('recipientId');
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('received');
  const [swaps, setSwaps] = useState({ sent: [], received: [] });
  const [loading, setLoading] = useState(true);
  
  // For Proposal Form
  const [proposing, setProposing] = useState(!!recipientId);
  const [recipient, setRecipient] = useState(null);
  const [formData, setFormData] = useState({
    skillOffered: '',
    skillRequested: '',
    message: '',
    proposedSchedule: ''
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth?mode=login');
      return;
    }
    
    if (recipientId) {
      getUserById(recipientId).then(data => {
        if (data) setRecipient(data);
        setProposing(true);
      });
    }

    fetchSwaps();
  }, [user, recipientId, navigate]);

  const fetchSwaps = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getUserSwaps(user.id);
      setSwaps(data);
    } catch(err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProposeSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSwapRequest({
        senderId: user.id,
        recipientId: recipient.id,
        senderName: user.fullName,
        recipientName: recipient.fullName,
        ...formData
      });
      navigate('/swaps'); 
      setProposing(false);
      fetchSwaps();
    } catch(err) {
      console.error(err);
    }
  };

  const handleStatusUpdate = async (swapId, status) => {
    try {
      await updateSwapStatus(swapId, status);
      fetchSwaps(); // Refresh list
    } catch(err) {
      console.error(err);
    }
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      pending: 'bg-amber-400/10 text-amber-500 border-amber-400/20',
      accepted: 'bg-green-400/10 text-green-500 border-green-400/20',
      declined: 'bg-red-400/10 text-red-500 border-red-400/20',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${styles[status]}`}>
        {status}
      </span>
    );
  };

  if(!user) return null;

  if (proposing && recipient) {
    return (
      <div className="max-w-2xl mx-auto p-4 py-8">
        <h1 className="text-3xl font-bold mb-6 flex items-center gap-3"><Send className="text-primary" /> Propose a Swap</h1>
        <div className="bg-card border border-border p-8 rounded-2xl mb-8 shadow-xl">
          <p className="text-slate-300 mb-6 text-lg">You are proposing a skill mutual exchange to <span className="text-white font-bold">{recipient.fullName}</span>.</p>
          
          <form onSubmit={handleProposeSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">I will teach</label>
                <input required type="text" value={formData.skillOffered} onChange={e=>setFormData({...formData, skillOffered: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary" placeholder="E.g., React.js" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">I want to learn</label>
                <input required type="text" value={formData.skillRequested} onChange={e=>setFormData({...formData, skillRequested: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary" placeholder="E.g., Figma" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Proposed Schedule (Optional)</label>
              <input type="text" value={formData.proposedSchedule} onChange={e=>setFormData({...formData, proposedSchedule: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary" placeholder="E.g., Saturdays at 10 AM EST" />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Personal Message</label>
              <textarea required value={formData.message} onChange={e=>setFormData({...formData, message: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary min-h-[120px] resize-y" placeholder="Hi! I'd love to learn from you..." />
            </div>

            <div className="flex gap-4 pt-6">
              <button type="submit" className="flex-1 bg-primary hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-xl transition-all hover:shadow-lg ">Send Proposal</button>
              <button type="button" onClick={() => navigate('/swaps')} className="px-6 py-3 border border-border rounded-xl font-medium hover:bg-slate-800 transition-colors">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Swap Dashboard</h1>
      
      <div className="flex gap-6 border-b border-border mb-8">
        <button 
          onClick={() => setActiveTab('received')}
          className={`pb-4 px-2 font-medium transition-colors text-lg ${activeTab === 'received' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Received Requests ({swaps.received.length})
        </button>
        <button 
          onClick={() => setActiveTab('sent')}
          className={`pb-4 px-2 font-medium transition-colors text-lg ${activeTab === 'sent' ? 'text-primary border-b-2 border-primary' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Sent Requests ({swaps.sent.length})
        </button>
      </div>

      <div className="space-y-6">
        {loading ? (
          <p className="text-slate-500 py-10 text-center">Loading swaps...</p>
        ) : swaps[activeTab].length === 0 ? (
          <div className="text-center py-24 bg-card rounded-2xl border border-dashed border-border shadow-sm">
            <div className="text-6xl mb-6">📭</div>
            <h3 className="text-2xl font-bold mb-2">No requests found</h3>
            <p className="text-slate-400 text-lg">Head over to the <a href="/discover" className="text-primary hover:underline">Discover</a> page to find potential partners.</p>
          </div>
        ) : (
          swaps[activeTab].map(swap => (
            <div key={swap.id} className="bg-card border border-border hover:border-border/80 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center shadow-sm transition-all">
              <div className="flex-grow w-full">
                <div className="flex items-center justify-between md:justify-start gap-4 mb-3">
                  <h3 className="font-bold text-xl text-white">
                    {activeTab === 'received' ? swap.senderName : swap.recipientName}
                  </h3>
                  <StatusBadge status={swap.status} />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-300 mb-5 bg-background p-4 rounded-xl border border-border/50">
                  <div><FileText size={16} className="inline mr-2 text-slate-500" /> You teach: <span className="text-white font-semibold">{activeTab === 'received' ? swap.skillRequested : swap.skillOffered}</span></div>
                  <div><FileText size={16} className="inline mr-2 text-slate-500" /> They teach: <span className="text-white font-semibold">{activeTab === 'received' ? swap.skillOffered : swap.skillRequested}</span></div>
                  <div className="md:col-span-2"><Clock size={16} className="inline mr-2 text-slate-500" /> Schedule: {swap.proposedSchedule || 'Flexible timing'}</div>
                </div>
                
                <div className="relative pl-6 border-l-2 border-primary/20">
                   <p className="text-slate-400 italic">"{swap.message}"</p>
                </div>
              </div>
              
              {activeTab === 'received' && swap.status === 'pending' && (
                <div className="flex md:flex-col gap-3 w-full md:w-40 mt-4 md:mt-0 flex-shrink-0">
                  <button onClick={() => handleStatusUpdate(swap.id, 'accepted')} className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                    <Check size={18} /> Accept
                  </button>
                  <button onClick={() => handleStatusUpdate(swap.id, 'declined')} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-4 py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2">
                    <X size={18} /> Decline
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
