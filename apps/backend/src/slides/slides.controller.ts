import { Body, Controller, Delete, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { CreateSlideDto } from './dto/create-slide.dto';
import { ReorderItemsDto } from './dto/reorder-items.dto';
import { SlideDto } from './dto/slide.dto';
import { UpdateSlideDto } from './dto/update-slide.dto';
import { SlidesService } from './slides.service';

@ApiTags('slides')
@ApiBearerAuth()
@Controller()
export class SlidesController {
  constructor(private readonly slides: SlidesService) {}

  @Post('quizzes/:id/slides')
  @ApiCreatedResponse({ type: SlideDto })
  add(@CurrentUser() user: User, @Param('id') quizId: string, @Body() dto: CreateSlideDto) {
    return this.slides.add(user.id, quizId, dto);
  }

  /** Reorders the whole quiz sequence (questions and slides together). */
  @Patch('quizzes/:id/items/reorder')
  @ApiOkResponse({ type: SlideDto, isArray: true })
  reorderItems(
    @CurrentUser() user: User,
    @Param('id') quizId: string,
    @Body() dto: ReorderItemsDto,
  ) {
    return this.slides.reorderItems(user.id, quizId, dto);
  }

  @Put('slides/:sid')
  @ApiOkResponse({ type: SlideDto })
  update(@CurrentUser() user: User, @Param('sid') sid: string, @Body() dto: UpdateSlideDto) {
    return this.slides.update(user.id, sid, dto);
  }

  @Delete('slides/:sid')
  @HttpCode(204)
  @ApiNoContentResponse()
  remove(@CurrentUser() user: User, @Param('sid') sid: string) {
    return this.slides.remove(user.id, sid);
  }
}
