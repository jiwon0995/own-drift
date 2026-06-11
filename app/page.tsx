import Shell from '@/components/screens/Shell';

export default function HomePage() {
  return (
    <Shell>
      <div className="flex items-center justify-center h-full bg-game">
        <h1
          className="text-title font-pixel text-ink-primary tracking-[3px] text-center"
          style={{ textShadow: '3px 3px 0 #b3611a, 5px 5px 0 #0a0706' }}
        >
          Own Drift
        </h1>
      </div>
    </Shell>
  );
}
