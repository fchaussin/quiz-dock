import { SetMetadata } from '@nestjs/common';

export const ALLOW_ANY_ROLE_KEY = 'allowAnyRole';

/**
 * Lets any authenticated user through, whatever their role. By default the global
 * guard requires the `host` (or `admin`) role on every non-public route.
 */
export const AllowAnyRole = (): MethodDecorator & ClassDecorator =>
  SetMetadata(ALLOW_ANY_ROLE_KEY, true);
