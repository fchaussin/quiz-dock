import { Controller, Get, Header } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator';
import { DEMO_SEAT_MINUTES, isDemoMode } from '../demo/demo.config';

/**
 * Sert `/config.js` (white-label runtime) quand le backend héberge aussi le SPA
 * (image unique). Généré à la volée depuis l'env → compatible `read_only` (aucune
 * écriture disque) et reflète `APP_NAME`/`APP_LANG`/`DEMO_MODE` du conteneur sans rebuild.
 *
 * Exclu du préfixe global (`config.js`) ET du `ServeStaticModule` (sinon le
 * `dist/config.js` bundlé masquerait cette route et figerait les valeurs).
 */
@Controller()
export class AppConfigController {
  @Public() // chargé avant toute authentification (branding du SPA)
  @Get('config.js')
  @ApiExcludeEndpoint() // asset JS (chargé via <script>), pas un endpoint d'API → hors OpenAPI
  @Header('Content-Type', 'application/javascript; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  configJs(): string {
    const appName = process.env.APP_NAME ?? 'QuizDock';
    const lang = process.env.APP_LANG ?? 'en';
    const esc = (s: string): string => s.replace(/[\\"]/g, '\\$&');
    // `demo` carries what the SPA must show (seat length); the server enforces it anyway.
    const demo = isDemoMode() ? `{ seatMinutes: ${DEMO_SEAT_MINUTES} }` : 'null';
    return `window.__APP_CONFIG__ = { appName: "${esc(appName)}", lang: "${esc(lang)}", demo: ${demo} };\n`;
  }
}
