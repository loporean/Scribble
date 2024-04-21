// Below are some iterations/different types of ways to query with mysql/mysql2
// First is doing a pool query outside of an async function
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

//--------------------------------
// TEST APP - by Spencer
//--------------------------------

import express from "express";
import { pool } from "./database.js"; // imported from our pool made and exportedin database.js
import bodyParser from "body-parser";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcrypt';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


const app = express(); // create application

app.use(bodyParser.urlencoded({ extended: true}));

// Login
app.get('/login', (req, res) => {
  const htmlPath = path.join(__dirname, 'public/index.html');
  res.sendFile(htmlPath);
});

// Account creation 
app.get('/create-account', (req, res) => {
  const htmlPath = path.join(__dirname, 'public/create-account.html');
  res.sendFile(htmlPath);
});

// Check login credentials
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Fetch user data (including hashed password) from the database based on username
    const [userData] = await pool.query(
      'SELECT * FROM user WHERE username = ?',
      [username]
    );

    if (userData.length === 0) {
      // Username not found
      res.send('Invalid username or password');
    } else {
      const hashedPassword = userData[0].password;

      // Compare the entered password with the hashed password from the database
      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (passwordMatch) {
        res.send('Login successful');
      } else {
        res.send('Invalid username or password');
      }
    }
  } catch (error) {
    res.status(500).send('Error checking username');
    console.error(error);
  }
});


// Account creation post
app.post('/create-account', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if the username or email already exists in the database
    const [existingUser] = await pool.query(
      'SELECT * FROM user WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      // Username or email already exists, respond accordingly
      res.send('Username or email already exists. Please choose a different one.');
    } else {
      // Hash the password before storing it
      const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

      // Insert new user data (including the hashed password) into the database
      await pool.query(
        'INSERT INTO user (username, email, password) VALUES (?, ?, ?)',
        [username, email, hashedPassword]
      );

      // Check if the account was successfully created by querying the database again
      const [newUser] = await pool.query(
        'SELECT * FROM user WHERE username = ?',
        [username]
      );

      if (newUser.length > 0) {
        res.send('Account created successfully!');
      } else {
        res.send('Failed to create an account. Please try again.');
      }
    }
  } catch (error) {
    res.status(500).send('Error creating the account');
    console.error(error);
  }
});





// Grab html from public folder
// Path needs to lead to public directory
// to fetch html
// main html file had to be named index or else would get "cannot GET"
app.use(express.static('public'));


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(200).send("hi");
  res.status(500).send("No worky ):");
});

app.use(express.json());

// Use async/await with the promise-based query
async function queryDatabase() {
  try {
    const [rows, fields] = await pool.query("SELECT * FROM user");
    console.log(rows); // rows contains rows returned by the server
    //console.log(fields); // fields contains extra meta data about results, if available
    // good for wanting to see what the table will ask for (id, name, password, etc.) and their
    // type.

  } catch (error) {
    console.error(error);
  }
}

queryDatabase(); // Call the function to query the database

app.listen(3000, () => {
  console.log("App listening on port 3000");
  //console.log("Server is running on 3000");
});


