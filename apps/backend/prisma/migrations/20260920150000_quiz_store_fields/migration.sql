-- Quiz Store fields carried by the bundle (docs/quiz-bundle.md): identity (slug,
-- namespace), content revision, and the catalogue metadata (domain, tags, license).
ALTER TABLE "quiz" ADD COLUMN     "domain" TEXT,
ADD COLUMN     "license" TEXT,
ADD COLUMN     "namespace" TEXT,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
