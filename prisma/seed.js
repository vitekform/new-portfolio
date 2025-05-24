import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create achievements
  const bigMistakeAchievement = await prisma.achievement.upsert({
    where: { code: 'BIG_MISTAKE' },
    update: {},
    create: {
      code: 'BIG_MISTAKE',
      name: 'Big Mistake',
      description: 'And now I have your email, username and password :D (don\'t worry your password is hashed and unrecoverable)',
    },
  });

  const darkModeAchievement = await prisma.achievement.upsert({
    where: { code: 'MASTER_OF_DARK_ARTS' },
    update: {},
    create: {
      code: 'MASTER_OF_DARK_ARTS',
      name: 'Master of the Dark Arts',
      description: 'Good job you finally wont flashbang anyone',
    },
  });

  const verifyEmailAchievement = await prisma.achievement.upsert({
    where: { code: 'VERIFY_EMAIL' },
    update: {},
    create: {
      code: 'VERIFY_EMAIL',
      name: 'Verify Your Email',
      description: 'You\'ve verified your email address!',
    },
  });

  // Create secret settings
  const rainbowMode = await prisma.secretSetting.upsert({
    where: { code: 'RAINBOW_MODE' },
    update: {},
    create: {
      code: 'RAINBOW_MODE',
      name: 'Rainbow Mode',
      description: 'Make everything colorful!',
      achievement_id: darkModeAchievement.id,
    },
  });

  console.log('Database has been seeded with achievements and secret settings');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });