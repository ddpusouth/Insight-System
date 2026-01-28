const { MongoClient } = require('mongodb');

async function main() {
  const uri = 'mongodb+srv://BSPUCPA:BSPUCPA%402025@insightcluster.s8tkuxr.mongodb.net/insight';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db('insightdb');

    // Users collection (admin, ddpo)
    const users = db.collection('users');
    await users.insertOne({
      name: 'Michael Admin',
      email: 'admin@college.edu',
      password: 'admin123', // In production, use hashed passwords!
      role: 'admin',
      department: 'Administration',
      employeeId: 'ADM001'
    });
    await users.insertOne({
      name: 'Director DDPO',
      email: 'ddpo@college.edu',
      password: 'ddpo123',
      role: 'ddpo',
      department: 'DDPO Office',
      employeeId: 'DDPO001'
    });

    // Colleges collection
    const colleges = db.collection('colleges');
    await colleges.insertOne({
      name: 'Government Pre-University College, Bangalore',
      code: 'GPUC001',
      type: 'Government',
      address: 'MG Road, Bangalore - 560001',
      principal: 'Dr. Rajesh Kumar',
      phone: '+91-80-12345678',
      email: 'principal@gpucblr.kar.nic.in',
      students: 850,
      status: 'Active',
      established: 1985
    });

    // Queries collection
    const queries = db.collection('queries');
    await queries.insertOne({
      title: 'Examination Schedule Query',
      college: 'GPUC Mangalore',
      studentName: "Aisha D'Souza",
      category: 'Examination',
      priority: 'High',
      status: 'Open',
      description: 'Student needs information about revised examination schedule and hall ticket download.',
      createdAt: new Date('2024-01-12'),
      responses: 0
    });

    console.log('Collections created and sample documents inserted!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.close();
  }
}

main(); 