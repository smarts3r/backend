import { prisma } from './src/lib/prisma';

async function test() {
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected!');

        console.log('Fetching categories...');
        const categories = await prisma.category.findMany({
            include: {
                products: {
                    take: 1,
                    select: { id: true, name: true }
                }
            }
        });
        console.log('Success! Found', categories.length, 'categories');
        console.log(JSON.stringify(categories, null, 2));

    } catch (error: any) {
        console.error('Test failed with error:');
        console.error(JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        if (error.cause) {
            console.error('Cause:', JSON.stringify(error.cause, Object.getOwnPropertyNames(error.cause), 2));
        }
    } finally {
        await prisma.$disconnect();
    }
}

test();
