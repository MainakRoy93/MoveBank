import { useEffect, useRef } from 'react';
import { mountMoveBankGlobe } from './js/scripts.js';

export default function App() {
  const globeRef = useRef(null);

  useEffect(() => {
    if (!globeRef.current) return undefined;
    return mountMoveBankGlobe(globeRef.current);
  }, []);

  return <main ref={globeRef} className="globeViewport" aria-label="MoveBank migration globe" />;
}
