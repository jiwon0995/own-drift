'use client';

import Shell        from '@/components/screens/Shell';
import ScreenRouter from '@/components/screens/ScreenRouter';
import { useScreenFlow } from '@/hooks/useScreenFlow';

export default function HomePage() {
  const { screen, advance } = useScreenFlow('title');

  return (
    <Shell>
      <ScreenRouter screen={screen} onAdvance={advance} />
    </Shell>
  );
}
