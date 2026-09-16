import { createZodDto } from 'nestjs-zod';
import { slideContentSchema } from './slide-content.schema';

/** Full replacement of a slide's content (#7). */
export class UpdateSlideDto extends createZodDto(slideContentSchema) {}
