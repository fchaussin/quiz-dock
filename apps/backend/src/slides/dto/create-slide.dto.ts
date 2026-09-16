import { createZodDto } from 'nestjs-zod';
import { slideContentSchema } from './slide-content.schema';

/** Adds a slide at the end of a quiz (#7). */
export class CreateSlideDto extends createZodDto(slideContentSchema) {}
