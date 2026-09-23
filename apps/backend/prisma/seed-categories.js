/**
 * Step 1 seed: frontend categories → PostgreSQL Category table
 * Run: npm run db:seed:categories -w backend
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const categories = [
  {
    order: 1,
    name: 'Business',
    slug: 'business',
    icon: 'lucide-briefcase',
    description: 'Grow your business',
    status: 'Active',
  },
  {
    order: 2,
    name: 'Realestate',
    slug: 'realestate',
    icon: 'lucide-home',
    description: 'List homes for sale',
    status: 'Active',
  },
  {
    order: 3,
    name: 'School',
    slug: 'school',
    icon: 'lucide-graduation-cap',
    description: 'Manage admissions',
    status: 'Active',
  },
];

async function main() {
  for (const cat of categories) {
    const row = await prisma.category.upsert({
      where: { slug: cat.slug },
      create: cat,
      update: {
        order: cat.order,
        name: cat.name,
        icon: cat.icon,
        description: cat.description,
        status: cat.status,
      },
    });
    console.log(`✓ ${row.name} (${row.slug})`);
  }
  console.log('\nStep 1 done: Categories seeded in PostgreSQL');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
