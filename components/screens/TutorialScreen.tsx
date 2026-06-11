/** [STUB] TutorialScreen — 1D에서 내용 채움 */
export default function TutorialScreen({ onAdvance }: { onAdvance: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 bg-game">
      <p className="font-pixel text-label text-ink-faint">[Tutorial Screen]</p>
      <button
        onClick={onAdvance}
        className="font-pixel text-label text-accent-stable border border-accent-stable px-4 py-2"
        style={{ background: '#241a17' }}
      >
        다음 →
      </button>
    </div>
  );
}
