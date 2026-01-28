const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('Collections:', collections.map(c => c.name));

        const colleges = await mongoose.connection.db.collection('colleges').find({}).limit(10).toArray();
        console.log('Sample Colleges:', JSON.stringify(colleges, null, 2));

        const govColleges = await mongoose.connection.db.collection('colleges').find({ $or: [{ Category: 'Government' }, { type: 'Government' }] }).limit(5).toArray();
        console.log('Government Colleges:', JSON.stringify(govColleges, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

connectDB();
