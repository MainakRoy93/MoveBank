import { GlobeScene } from './globe/GlobeScene';

export default function App() {
  const profileId = new URLSearchParams(window.location.search).get('profile') ?? 'retro-earth';

  return <GlobeScene profileId={profileId} />;
}
