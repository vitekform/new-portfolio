-- CreateTable
CREATE TABLE "Achievement" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EasterEgg" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EasterEgg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SecretSetting" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "achievement_id" INTEGER,
    "easter_egg_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SecretSetting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAchievement" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "achievement_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserAchievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEasterEgg" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "easter_egg_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEasterEgg_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSecretSetting" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "secret_setting_id" INTEGER NOT NULL,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserSecretSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Achievement_code_key" ON "Achievement"("code");

-- CreateIndex
CREATE UNIQUE INDEX "EasterEgg_code_key" ON "EasterEgg"("code");

-- CreateIndex
CREATE UNIQUE INDEX "SecretSetting_code_key" ON "SecretSetting"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserAchievement_user_id_achievement_id_key" ON "UserAchievement"("user_id", "achievement_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserEasterEgg_user_id_easter_egg_id_key" ON "UserEasterEgg"("user_id", "easter_egg_id");

-- CreateIndex
CREATE UNIQUE INDEX "UserSecretSetting_user_id_secret_setting_id_key" ON "UserSecretSetting"("user_id", "secret_setting_id");

-- AddForeignKey
ALTER TABLE "SecretSetting" ADD CONSTRAINT "SecretSetting_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SecretSetting" ADD CONSTRAINT "SecretSetting_easter_egg_id_fkey" FOREIGN KEY ("easter_egg_id") REFERENCES "EasterEgg"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserAchievement" ADD CONSTRAINT "UserAchievement_achievement_id_fkey" FOREIGN KEY ("achievement_id") REFERENCES "Achievement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEasterEgg" ADD CONSTRAINT "UserEasterEgg_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEasterEgg" ADD CONSTRAINT "UserEasterEgg_easter_egg_id_fkey" FOREIGN KEY ("easter_egg_id") REFERENCES "EasterEgg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSecretSetting" ADD CONSTRAINT "UserSecretSetting_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSecretSetting" ADD CONSTRAINT "UserSecretSetting_secret_setting_id_fkey" FOREIGN KEY ("secret_setting_id") REFERENCES "SecretSetting"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
