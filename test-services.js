import prisma from './api/lib/prisma.js';

async function testServices() {
  try {
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