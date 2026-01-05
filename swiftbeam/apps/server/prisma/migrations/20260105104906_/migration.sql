-- AlterTable
ALTER TABLE "invites" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "label" TEXT,
ADD COLUMN     "max_uses" INTEGER,
ADD COLUMN     "revoked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "revoked_at" TIMESTAMP(3),
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'MEMBER',
ADD COLUMN     "use_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "invite_accepts" (
    "id" TEXT NOT NULL,
    "invite_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "invite_accepts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "invite_accepts_invite_id_user_id_key" ON "invite_accepts"("invite_id", "user_id");

-- AddForeignKey
ALTER TABLE "invite_accepts" ADD CONSTRAINT "invite_accepts_invite_id_fkey" FOREIGN KEY ("invite_id") REFERENCES "invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invite_accepts" ADD CONSTRAINT "invite_accepts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
