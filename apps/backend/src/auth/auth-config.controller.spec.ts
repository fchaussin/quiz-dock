import { AuthConfigController } from './auth-config.controller';

describe('AuthConfigController', () => {
  const controller = new AuthConfigController();
  const env = process.env;

  afterEach(() => {
    process.env = env;
  });

  it('renvoie le mode none par défaut (sans OIDC)', () => {
    process.env = { ...env, AUTH_MODE: 'none' };
    expect(controller.config()).toEqual({ mode: 'none', demo: null, oidc: null });
  });

  it('renvoie le mode oidc avec authority + clientId', () => {
    process.env = {
      ...env,
      AUTH_MODE: 'oidc',
      OIDC_ISSUER: 'http://localhost:18080/realms/quiz-dock',
      OIDC_CLIENT_ID: 'quiz-dock-frontend',
    };
    expect(controller.config()).toEqual({
      mode: 'oidc',
      demo: null,
      oidc: {
        authority: 'http://localhost:18080/realms/quiz-dock',
        clientId: 'quiz-dock-frontend',
      },
    });
  });

  it('announces the demo guards (seat length) when DEMO_MODE=true', () => {
    process.env = { ...env, AUTH_MODE: 'none', DEMO_MODE: 'true' };
    expect(controller.config()).toEqual({ mode: 'none', demo: { seatMinutes: 5 }, oidc: null });
  });
});
