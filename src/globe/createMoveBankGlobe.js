import { GlobeController } from './GlobeController.js';
import { createMoveBankGlobeConfig } from './config/moveBankGlobeConfig.js';

export function mountMoveBankGlobe(container, overrides = {}) {
  const config = {
    ...createMoveBankGlobeConfig(),
    ...overrides,
  };
  const controller = new GlobeController(container, config);

  return controller.mount();
}
