import { useState } from 'react';
import { submitContactInquiry } from '../api/contact';
import { Send, CheckCircle2 } from 'lucide-react';

const Github = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/>
    <path d="M9 18c-4.51 2-5-2-7-2"/>
  </svg>
);

const Linkedin = ({ size = 24, className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect width="4" height="12" x="2" y="9"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

const TEAM = [
  {
    name: 'Alice Coder',
    role: 'Frontend Engineer',
    bio: 'React and UI/UX enthusiast',
    github: '#',
    linkedin: '#',
    avatar: 'https://i.pravatar.cc/150?u=a'
  },
  {
    name: 'Bob Server',
    role: 'Backend Architect',
    bio: 'Node.js and Database optimizer',
    github: '#',
    linkedin: '#',
    avatar: 'https://i.pravatar.cc/150?u=b'
  }
];

const FAQS = [
  { q: "Do I have to pay to use SkillSwap?", a: "No! SkillSwap is completely free. The currency is your own expertise." },
  { q: "How are sessions scheduled?", a: "You can propose a schedule when initiating a swap, and refine it via personal messaging. All lessons happen externally via platforms like Zoom or Google Meet." },
  { q: "What if I'm a beginner at what I want to teach?", a: "That's totally fine! Make sure to set your offered skill level honestly. Many people are looking for a peer to just study and struggle through things together." }
];

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'General Inquiry', message: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await submitContactInquiry(formData);
      setStatus('success');
      setFormData({ name: '', email: '', subject: 'General Inquiry', message: '' });
    } catch(err) {
      console.error(err);
      setStatus('idle');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-extrabold mb-4">Get in Touch</h1>
        <p className="text-xl text-slate-400">Have questions about SkillSwap? We'd love to hear from you.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 mb-20">
        <div className="bg-card border border-border p-8 rounded-3xl shadow-lg relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none"></div>
           
           <h2 className="text-2xl font-bold mb-6 relative z-10">Send us a message</h2>
           
           {status === 'success' ? (
             <div className="flex flex-col items-center justify-center p-10 text-center h-full relative z-10">
               <CheckCircle2 size={64} className="text-green-400 mb-4" />
               <h3 className="text-2xl font-bold mb-2">Message Sent!</h3>
               <p className="text-slate-400">Thank you for reaching out. Our team will get back to you shortly.</p>
               <button onClick={() => setStatus('idle')} className="mt-8 text-primary hover:underline">Send another message</button>
             </div>
           ) : (
             <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
               <div className="grid md:grid-cols-2 gap-5">
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">Your Name</label>
                   <input required type="text" value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary" />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                   <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary" />
                 </div>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-slate-400 mb-2">Subject</label>
                 <select required value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary appearance-none">
                   <option>General Inquiry</option>
                   <option>Bug Report</option>
                   <option>Feature Request</option>
                 </select>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-slate-400 mb-2">Message</label>
                 <textarea required value={formData.message} onChange={e=>setFormData({...formData, message: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:outline-none focus:border-primary min-h-[150px] resize-y" />
               </div>
               
               <button disabled={status==='loading'} type="submit" className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2">
                 {status === 'loading' ? 'Sending...' : <><Send size={18} /> Send Message</>}
               </button>
             </form>
           )}
        </div>

        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {FAQS.map((faq, i) => (
                <div key={i} className="bg-card border border-border rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-lg mb-2 text-white">{faq.q}</h4>
                  <p className="text-slate-400">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="text-center mb-12 border-t border-border pt-16">
        <h2 className="text-3xl font-bold mb-4">Meet the Dev Team</h2>
        <p className="text-slate-400 mb-10 max-w-2xl mx-auto">SkillSwap was built as an academic project to solve the problem of inaccessible education.</p>
        
        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {TEAM.map((member, i) => (
             <div key={i} className="bg-card border border-border hover:border-primary/50 transition-all rounded-3xl p-8 flex flex-col items-center shadow-sm hover:shadow-lg">
               <img src={member.avatar} alt={member.name} className="w-24 h-24 rounded-full border-4 border-background shadow-lg mb-4" />
               <h3 className="text-xl font-bold">{member.name}</h3>
               <p className="text-primary font-medium mb-3">{member.role}</p>
               <p className="text-slate-400 text-center mb-6">{member.bio}</p>
               <div className="flex gap-4">
                 <a href={member.github} className="p-3 bg-background rounded-full hover:text-primary transition-colors border border-border"><Github size={20} /></a>
                 <a href={member.linkedin} className="p-3 bg-background rounded-full hover:text-primary transition-colors border border-border"><Linkedin size={20} /></a>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
}
