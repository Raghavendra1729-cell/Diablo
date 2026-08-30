import { ArrowDownRight, CalendarCheck2, GitFork, Radio, Trophy } from 'lucide-react';
import { SuggestionChip } from './SuggestionChip';
import heroGraphic from '@/assets/hero.png';

export function EmptyState({ suggestions, onSelect }) {
  return (
    <div className="empty-state intelligence-stage flex-1 relative z-10">
      <section className="briefing-hero" aria-labelledby="diablo-heading">
        <div className="hero-topline">
          <span className="live-signal"><Radio className="w-3.5 h-3.5" /> Live candidate intelligence</span>
          <span className="briefing-index">BRIEF / 01</span>
        </div>

        <div className="hero-visual" aria-hidden="true">
          <div className="hero-mark relative">
            <div className="hero-orbit" />
            <img src={heroGraphic} alt="" className="hero-image object-contain relative z-10" />
          </div>
          <div className="scan-line" />
        </div>

        <p className="hero-eyebrow">Meet Diablo</p>
        <h2 id="diablo-heading" className="hero-title">
          Evidence over <span>claims.</span>
        </h2>
        <p className="hero-copy">
          Ask one focused assistant about Linga's engineering work, inspect project
          decisions, or move directly from evaluation to an interview.
        </p>

        <div className="proof-row" aria-label="Candidate highlights">
          <div><GitFork aria-hidden="true" /><strong>24+</strong><span>repositories</span></div>
          <div><Trophy aria-hidden="true" /><strong>900+</strong><span>problems solved</span></div>
          <div><CalendarCheck2 aria-hidden="true" /><strong>Live</strong><span>scheduling</span></div>
        </div>
      </section>

      <aside className="briefing-menu" aria-label="Start a candidate briefing">
        <div className="menu-heading">
          <div>
            <span className="menu-kicker">Choose a line of inquiry</span>
            <h3>Start a briefing</h3>
          </div>
          <ArrowDownRight aria-hidden="true" />
        </div>
        <div className="inquiry-list">
          {suggestions.map((suggestion, index) => (
            <SuggestionChip
              key={suggestion.title}
              index={index + 1}
              suggestion={suggestion}
              onClick={() => onSelect(suggestion.title)}
            />
          ))}
        </div>
        <p className="menu-footnote">Answers are generated from portfolio evidence. Scheduling uses live availability.</p>
      </aside>
    </div>
  );
}
