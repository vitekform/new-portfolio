import prisma, { initializeD1Client } from './functions/api/lib/prisma.js';

async function testServices() {
  try {
    console.log('This test script is designed for Prisma and will not work with Cloudflare D1.');
    console.log('To test D1, you need to run this script in a Cloudflare Workers environment with a D1 binding.');
    console.log('Exiting test...');
    return;

    // The code below is kept for reference but won't be executed

    // Initialize D1 client (requires env parameter with D1 binding)
    // const env = { DB: /* D1 database binding */ };
    // initializeD1Client(env);

    // Test if Service table exists by counting records
    const servicesCount = await prisma.service.count();
    console.log(`Service table exists. Found ${servicesCount} services.`);

    // If no services exist, create some
    if (servicesCount === 0) {
      console.log('Creating default services...');
      await prisma.service.createMany({
        data: [
          {
            name: 'Web Hosting',
            description: 'Reliable web hosting services with 99.9% uptime guarantee.'
          },
          {
            name: 'File Cloud',
            description: 'Secure cloud storage for your files with easy access from anywhere.'
          }
        ]
      });
      console.log('Default services created successfully.');
    }

    // Fetch all services to verify
    const services = await prisma.service.findMany();
    console.log('Services in database:', services);

  } catch (error) {
    console.error('Error testing services:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testServices()
  .then(() => console.log('Test completed successfully.'))
  .catch(error => console.error('Test failed:', error));
