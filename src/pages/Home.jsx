import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Book, Code, Palette, Globe, Music, PenTool } from 'lucide-react';

const categories = [
  { name: 'Coding', icon: Code, color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Design', icon: Palette, color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { name: 'Languages', icon: Globe, color: 'text-green-400', bg: 'bg-green-400/10' },
  { name: 'Music', icon: Music, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { name: 'Writing', icon: PenTool, color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { name: 'Other', icon: Book, color: 'text-slate-400', bg: 'bg-slate-400/10' },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center">
      {/* Hero */}
      <section className="w-full min-h-[80vh] flex flex-col items-center justify-center text-center px-4 relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="inline-block p-2 px-4 rounded-full bg-slate-800/50 border border-slate-700 text-sm mb-4 backdrop-blur-sm">
            ✨ A community of lifelong learners
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            Swap Skills, <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-accent">
              Not Money
            </span>
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Access high-quality mentorship through reciprocal teaching. Trade your expertise directly with others and eliminate tuition costs. Knowledge is your only currency.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {!user && (
              <Link to="/auth?mode=signup" className="px-8 py-4 bg-primary hover:bg-blue-600 text-white rounded-full font-bold text-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] hover:-translate-y-1">
                Get Started
              </Link>
            )}
            <Link to="/discover" className="px-8 py-4 bg-card border border-border hover:border-primary/50 text-white rounded-full font-bold text-lg transition-all hover:-translate-y-1">
              Explore Skills
            </Link>
          </div>
        </div>
      </section>

      {/* Social Proof Strip */}
      <div className="w-full border-y border-border bg-card/30 backdrop-blur-md py-8">
        <div className="max-w-5xl mx-auto flex flex-wrap justify-around text-center gap-8 px-4">
          <div>
            <div className="text-4xl font-bold text-primary">10k+</div>
            <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider">Registered Users</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-accent">50k+</div>
            <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider">Active Swaps</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-emerald-400">100+</div>
            <div className="text-slate-400 text-sm mt-1 uppercase tracking-wider">Skill Categories</div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="w-full py-24 max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold mb-16">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Create a Profile', desc: 'Sign up and tag the skills you offer and the ones you want to learn.' },
            { step: '02', title: 'Find a Match', desc: 'Browse the Discover page to find people whose needs complement yours.' },
            { step: '03', title: 'Propose a Swap', desc: 'Send a formal swap request, agree on a schedule, and start exchanging knowledge!' }
          ].map((item, i) => (
            <div key={i} className="bg-card p-8 rounded-2xl border border-border relative group hover:border-primary/50 transition-colors text-left flex flex-col justify-between overflow-hidden">
              <div className="text-6xl font-black text-slate-800/40 absolute -top-4 -right-2 group-hover:text-primary/10 transition-colors">
                {item.step}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4 relative z-10 mt-2">{item.title}</h3>
                <p className="text-slate-400 relative z-10">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="w-full py-24 bg-card/20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-16">Popular Categories</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((cat, i) => (
              <div key={i} className="p-6 rounded-2xl flex flex-col items-center justify-center gap-4 cursor-pointer border border-transparent hover:border-border transition-all hover:bg-card">
                <div className={`p-4 rounded-full ${cat.bg} ${cat.color}`}>
                  <cat.icon size={32} />
                </div>
                <span className="font-bold">{cat.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="w-full py-8 border-t border-border text-center text-slate-500 mt-auto bg-card/30">
        <p>© 2026 SkillSwap. Academic Project.</p>
        <div className="mt-4">
          <Link to="/contact" className="hover:text-primary transition-colors">Contact Dev Team</Link>
        </div>
      </footer>
    </div>
  );
}
