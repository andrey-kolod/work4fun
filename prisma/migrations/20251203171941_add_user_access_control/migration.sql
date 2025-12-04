-- CreateEnum
CREATE TYPE "UserScope" AS ENUM ('ALL', 'SPECIFIC_GROUPS');

-- AlterTable
ALTER TABLE "user_projects" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "scope" "UserScope" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "visibleGroups" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "maxProjects" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "projectCount" INTEGER NOT NULL DEFAULT 0;
