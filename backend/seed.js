// Force clear the require cache for Prisma
delete require.cache[require.resolve('@prisma/client')];

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seed() {
  try {
    console.log('🌱 Seeding database with sample jobs...');

    // Clear existing jobs
    try {
      await prisma.jobApplication.deleteMany({});
    } catch (e) {
      console.log('No JobApplication table yet, skipping delete');
    }
    try {
      await prisma.job.deleteMany({});
    } catch (e) {
      console.log('No Job table yet, skipping delete');
    }

    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const jobs = [
      {
        title: 'Senior Software Engineer',
        description: 'We are looking for an experienced software engineer to join our growing team. You will work on critical systems and mentor junior developers.',
        department: 'Engineering',
        location: 'Remote',
        salary: '$120k - $160k',
        datePosted: now,
        closingDate: twoWeeksFromNow,
        requirements: JSON.stringify(['5+ years of experience', 'React/Node.js knowledge', 'System design skills', 'Strong communication']),
      },
      {
        title: 'Product Manager',
        description: 'Lead product strategy and roadmap for our next generation platform. Own the product vision and drive execution across teams.',
        department: 'Operations',
        location: 'Hybrid',
        salary: '$100k - $140k',
        datePosted: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        closingDate: twoWeeksFromNow,
        requirements: JSON.stringify(['3+ years PM experience', 'Technical background', 'Leadership skills', 'Data-driven mindset']),
      },
      {
        title: 'Marketing Specialist',
        description: 'Join our marketing team to drive brand awareness and customer acquisition. Work on digital campaigns and strategy.',
        department: 'Marketing',
        location: 'Office',
        salary: '$60k - $90k',
        datePosted: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        closingDate: oneWeekFromNow,
        requirements: JSON.stringify(['2+ years marketing experience', 'Digital marketing expertise', 'Analytics skills', 'Creative thinking']),
      },
      {
        title: 'Financial Analyst',
        description: 'Support financial planning and analysis for the organization. Prepare reports and provide insights for decision-making.',
        department: 'Finance',
        location: 'Office',
        salary: '$70k - $100k',
        datePosted: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        closingDate: twoWeeksFromNow,
        requirements: JSON.stringify(['Finance degree', 'Excel proficiency', 'Analytical skills', 'Attention to detail']),
      },
      {
        title: 'Sales Executive',
        description: 'Build and maintain client relationships while driving revenue growth. Develop new business opportunities and manage accounts.',
        department: 'Sales',
        location: 'Remote',
        salary: '$80k - $130k',
        datePosted: now,
        closingDate: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
        requirements: JSON.stringify(['Sales experience', 'CRM knowledge', 'Communication skills', 'Negotiation ability']),
      },
    ];

    await prisma.job.createMany({
      data: jobs,
    });

    console.log('✅ Seeded 5 jobs successfully!');
    console.log('Jobs are now available for job seekers to view and apply.');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
