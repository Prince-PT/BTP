import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

async function initDatabase() {
  // First, connect to the default 'postgres' database to create our database
  const defaultConnection = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'rajatsharma',
    password: process.env.DB_PASSWORD || '',
    database: 'postgres', // Connect to default database
  });

  try {
    await defaultConnection.initialize();
    console.log('✅ Connected to PostgreSQL');

    // Check if database exists
    const result = await defaultConnection.query(
      `SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_DATABASE || 'campus_rideshare'}'`
    );

    if (result.length === 0) {
      // Create database
      await defaultConnection.query(
        `CREATE DATABASE ${process.env.DB_DATABASE || 'campus_rideshare'}`
      );
      console.log(`✅ Database '${process.env.DB_DATABASE || 'campus_rideshare'}' created successfully`);
    } else {
      console.log(`ℹ️  Database '${process.env.DB_DATABASE || 'campus_rideshare'}' already exists`);
    }

    await defaultConnection.destroy();
    console.log('✅ Database initialization complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initDatabase();
