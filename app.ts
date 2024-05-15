import express from 'express';
import userRoutes from './src/routes/UserRoutes';
import cors from 'cors';
import pool, { createUsersTable } from './src/db/connection';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/api/user', userRoutes);
app.use('/', (req, res) => {
    res.send('hello world')
});

const PORT = process.env.PORT || 9000;

app.listen(PORT, async () => {
    
    try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"'); 
        await createUsersTable();
        console.log('Database initialization complete.');
        console.log(`Server running on port ${PORT}`);
    } catch (error) {
        console.error('Error initializing database:', error);
    }
  });