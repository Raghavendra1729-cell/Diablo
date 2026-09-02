import { useState, useEffect } from 'react';
import { 
  X, Mail, Check, Calendar, ExternalLink, 
  GraduationCap, Award, Layers, Terminal, MapPin
} from 'lucide-react';

export function ProfileDrawer({ isOpen, onClose, onSchedule }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('lingaraghawendra@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm animate-fade-in transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <aside 
        className="relative w-full max-w-md h-full bg-[#0d0d12] border-l border-zinc-800 flex flex-col shadow-2xl z-10 animate-message-in overflow-y-auto"
        aria-label="Candidate Profile Summary"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#0d0d12]/90 backdrop-blur-md px-5 py-4 border-b border-zinc-800 flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Candidate Profile</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 flex-1">
          {/* Identity */}
          <div>
            <h3 className="text-xl font-bold text-zinc-100 tracking-tight">
              Linga Seetha Rama Raghavendra
            </h3>
            <p className="text-xs font-medium text-orange-400 mt-0.5">
              AI Engineer · Autonomous Systems & RAG
            </p>
            <div className="flex items-center gap-1 text-xs text-zinc-400 mt-2">
              <MapPin className="w-3.5 h-3.5 text-zinc-500" />
              <span>Bengaluru, Karnataka, India</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onSchedule();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-950 bg-orange-500 hover:bg-orange-400 transition-colors shadow-sm cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              Book Interview
            </button>
            <button
              type="button"
              onClick={handleCopyEmail}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-300 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
              title="Copy Email"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Mail className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Email'}</span>
            </button>
          </div>

          {/* Education */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-orange-400" />
              Education
            </h4>
            <div className="space-y-2.5">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-zinc-100">BITS Pilani</span>
                  <span className="text-[11px] font-mono text-emerald-400">9.0 CGPA</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">B.S. in Computer Science (2024 – 2027)</p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold text-zinc-100">Scaler School of Technology</span>
                  <span className="text-[11px] font-mono text-emerald-400">9.11 CGPA</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">Software Engineering UG · Dean's List (2024 – 2028)</p>
              </div>
            </div>
          </div>

          {/* Core Technical Stack */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-orange-400" />
              Core Tech Stack
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Python', 'FastAPI', 'LangChain', 'Qdrant Vector DB', 
                'Gemini Embeddings', 'Vapi (Voice)', 'Playwright', 'React.js', 
                'Docker', 'TypeScript', 'SQL', 'Git / Linux'
              ].map((skill) => (
                <span 
                  key={skill}
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-zinc-900 border border-zinc-800 text-zinc-300"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Highlights & Metrics */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-orange-400" />
              Key Achievements
            </h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-sm font-bold text-zinc-100 font-mono">900+</span>
                <p className="text-[10px] text-zinc-400 mt-0.5">LeetCode Solved (365d streak)</p>
              </div>
              <div className="p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80">
                <span className="text-sm font-bold text-zinc-100 font-mono">3-Star</span>
                <p className="text-[10px] text-zinc-400 mt-0.5">CodeChef Coder (1680)</p>
              </div>
            </div>
          </div>

          {/* Key Featured Projects */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-orange-400" />
              Featured Projects
            </h4>
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-100">Diablo</span>
                  <span className="text-[10px] text-orange-400 font-mono">Voice & Chat Agent</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Autonomous AI persona with live Cal.com scheduling, Vapi interruption handling, and RAG.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-100">SastaNotebookLM</span>
                  <span className="text-[10px] text-orange-400 font-mono">RAG Platform</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Production RAG pipeline with Qdrant, Gemini embeddings, and sub-second query retrieval.
                </p>
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-100">Web Automation Agent</span>
                  <span className="text-[10px] text-orange-400 font-mono">Vision Agent</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Autonomous browser agent with Qwen2.5-VL-72B and Playwright tool dispatch.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0d0d12]/95 backdrop-blur-md p-4 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <span>lingaraghawendra@gmail.com</span>
          <a
            href="https://github.com/Raghavendra1729-cell"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300"
          >
            <span>GitHub Profile</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </aside>
    </div>
  );
}
