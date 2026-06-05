export function SuggestionChip({ text, onClick }) {
  return (
    <button 
      type="button" 
      onClick={onClick} 
      className="suggestion-chip truncate focus:outline-none focus:ring-2 focus:ring-accent/50" 
      title={text}
    >
      {text}
    </button>
  );
}
