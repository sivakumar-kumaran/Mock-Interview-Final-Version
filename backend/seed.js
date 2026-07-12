const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Topic = require('./src/models/Topic');
const Question = require('./src/models/Question');
const User = require('./src/models/User');
const { topicsData, questionsData } = require('./questionsData');

dotenv.config();

const seedDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mock-interview-platform';
    console.log('Connecting to MongoDB at:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
    await mongoose.connect(mongoURI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing questions and topics
    await Question.deleteMany({});
    await Topic.deleteMany({});
    console.log('Cleared existing topics and questions.');

    // Seed Topics
    const seededTopics = [];
    for (const t of topicsData) {
      const topic = await Topic.create(t);
      seededTopics.push(topic);
    }
    console.log(`Seeded ${seededTopics.length} topics successfully.`);

    // Seed Questions
    let questionCount = 0;
    for (const topic of seededTopics) {
      const questionsList = questionsData[topic.title];
      if (questionsList) {
        for (const q of questionsList) {
          await Question.create({
            topicId: topic._id,
            question: q.question,
            difficulty: q.difficulty
          });
          questionCount++;
        }
      } else {
        console.warn(`No questions found for topic: ${topic.title}`);
      }
    }
    console.log(`Seeded ${questionCount} questions successfully (expected 420).`);

    // Ensure we create at least one admin account for testing/management if none exists
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const adminPass = 'admin123';
      await User.create({
        name: 'Sivakumar P',
        email: 'admin@mockinterview.com',
        password: adminPass,
        role: 'admin'
      });
      console.log('Created default admin user: email: admin@mockinterview.com, password: admin123');
    }

    // Ensure we create a test user account for testing if none exists
    const userExists = await User.findOne({ email: 'user@mockinterview.com' });
    if (!userExists) {
      const userPass = 'user123';
      await User.create({
        name: 'John Doe',
        email: 'user@mockinterview.com',
        password: userPass,
        role: 'user'
      });
      console.log('Created default test user: email: user@mockinterview.com, password: user123');
    }

    console.log('Database seeding process completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
