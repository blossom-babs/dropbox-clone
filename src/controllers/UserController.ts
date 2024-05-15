import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import pool from '../db/connection';


const users: User[] = [];
const secretKey = process.env.JWT_SECRET || 'default_secret_key';

export const signup = async (req: Request, res: Response) => {
    try {
        const { firstName, lastName, email, country, username, password, confirmPassword } = req.body;

        // Check if any required fields are missing
        if (!firstName || !lastName || !email || !country || !username || !password || !confirmPassword) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if the password and confirmPassword match
        if (password !== confirmPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        // Check if the username or email already exists
        const existingUser = users.find((user) => user.username === username || user.email === email);
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        

        const query = 'INSERT INTO users (username, email, password, first_name, last_name, country) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const values = [username, email, hashedPassword, firstName, lastName, country];
        const result = await pool.query(query, values);

        // console.log(result);

        const token = jwt.sign({ userId: result.rows[0].id }, secretKey, { expiresIn: '1h' });


        res.status(201).json({ message: 'User created successfully', token });
    } catch (error) {
        console.error('Error during signup:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { identifier, password } = req.body
        if (!identifier || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        const query = 'SELECT * FROM users WHERE email = $1 OR username = $1';
        const values = [identifier];
        const result = await pool.query(query, values);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'User does not exist' });
        }
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ error: 'User/password does not match' });
        }
        const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });

        res.status(200).json({ message: 'Login successful', token });

    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
