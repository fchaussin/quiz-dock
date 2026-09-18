import { UserRole } from '@prisma/client';

/** Roles allowed to create, edit and present quizzes. */
export function isHostRole(role: UserRole): boolean {
  return role === UserRole.host || role === UserRole.admin;
}
