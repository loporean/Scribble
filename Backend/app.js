// Below are some iterations/different types of ways to query with mysql/mysql2
// First is doing a pool query outside of an async function
//+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

import express from "express";
import session from "express-session"; // create session token
import { pool } from "./database.js"; // imported from our pool made and exportedin database.js
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import bcrypt from "bcrypt";
import cors from "cors";
import { Server } from "socket.io";

//++++++++++++++++++++++++++++++++++++++++++++
import http from "http";
import sharedSession from "express-socket.io-session";
import { time } from "console";
//++++++++++++++++++++++++++++++++++++++++++++

import multer from "multer";

// External modification +++++++++++++++++++++++++++++++++++++++++++++++++++++++
import chat_items from "./scrib_chats.json" assert { type: "json" };
import user_classes from "./user_classes.json" assert { type: "json" };
import active_users from "./active_chat_users.json" assert { type: "json" };
import inactive_users from "./inactive_chat_users.json" assert { type: "json" };
import user_notes from "./user_notes.json" assert { type: "json" };
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express(); // Create application

// Set up session middleware
const upload = multer({ storage: multer.memoryStorage() });
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.set("trust proxy", 1); // Trust first proxy
// Set up session middleware
const sessionMiddleware = session({
  secret: "your-secret-key", // Replace with a secret key for session encryption
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    // maxAge: 60000 // 1 min
  },
});
app.use(sessionMiddleware);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

const server = app.listen(3000, () => {
  console.log("App listening on port 3000");
});

const io = new Server(server, {
  // path: "/socket.io",
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Session context shared w/ socket.io
io.engine.use(sessionMiddleware);

//retreive static notes
app.get("/notes_data", (req, res) => {
  res.json(user_notes);
});

// Call function inside socket
// Async function to query database and populate inactive users map
async function populateInactiveUsers() {
  try {
    const [results] = await pool.query(
      "SELECT userID, username, avatar FROM user"
    );
    results.forEach((row) => {
      const username = row.username;
      inactiveUsers.set(username, { username });
      let avatar = "";
      if (row.avatar === null) avatar = "";
      else avatar = row.avatar.toString();
      inactiveUsers.set(username, { username, avatar });
    });
  } catch (error) {
    console.error("Error fetching usernames:", error);
  }
}

// List of active users
const activeUsers = new Map();
// List of inactive users
const inactiveUsers = new Map();
// Call the async function to populate inactive users map
populateInactiveUsers();

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Receive username from client
  socket.on("login", (username, avatar, room) => {
    // Remove from inactive users if exists
    let convertedAvatar = "";

    if (avatar && avatar !== null) convertedAvatar = avatar;

    if (inactiveUsers.has(username)) {
      inactiveUsers.delete(username);
      console.log("match");
    }
    if (!activeUsers.has(username, convertedAvatar)) {
      // Store username and socket ID
      console.log("setting");
      activeUsers.set(socket.id, { username, avatar: convertedAvatar });
      // Broadcast updated list of active users
      io.emit("activeUsers", Array.from(activeUsers.values()));
      // Broadcast updated list of inactive active users
      io.emit("inactiveUsers", Array.from(inactiveUsers.values()));
      // Add user to default class room
    }
  });

  // Receive username from logout
  socket.on("logout", (username) => {
    // Remove user from active users list
    const user = activeUsers.get(socket.id);
    if (user) {
      activeUsers.delete(socket.id);
      // Add to inactive users
      inactiveUsers.set(username, user);
    }
    // Broadcast updated list of active users
    io.emit("activeUsers", Array.from(activeUsers.values()));
    // Broadcast updated list of inactive active users
    io.emit("inactiveUsers", Array.from(inactiveUsers.values()));
  });

  // Remove user from activeUsers on disconnect
  socket.on("disconnect", () => {
    // Remove user from active users list
    const user = activeUsers.get(socket.id);
    if (user) {
      // Retreive username from active users
      const username = activeUsers.get(socket.id)?.username;
      activeUsers.delete(socket.id);
      // Add to inactive users
      inactiveUsers.set(username, user);
    }
    // Broadcast the updated list of active users to all clients
    io.emit("activeUsers", Array.from(activeUsers.values()));
    // Broadcast updated list of inactive active users
    io.emit("inactiveUsers", Array.from(inactiveUsers.values()));
  });

  // Join a room
  socket.on("join_room", (data) => {
    // Leave all rooms
    socket.rooms.forEach((room) => {
      if (room !== socket.id) {
        socket.leave(room);
        socket.to(room).emit("user left", socket.id);
      }
    });
    // Join new room
    socket.room = data;
    socket.join(socket.room);
    socket.to(socket.room).emit("user joined", socket.id);
  });

  // Which room we are sending the message to
  socket.on("send_message", (data) => {
    // Include username along with message data
    const messageData = {
      username: data.username,
      userID: data.userID,
      message: data.message,
      avatar: data.avatar,
      gif: data.gif,
    };
    socket.to(socket.room).emit("receive_message", messageData);
  });

  // Users typing in chatroom
  socket.on("typing", (data) => {
    const username = data;
    socket.to(socket.room).emit("is_typing", username);

    // Clear typing state after a delay
    clearTimeout(socket.typingTimer);
    socket.typingTimer = setTimeout(() => {
      socket.to(socket.room).emit("clear_typing", username);
    }, 3000); // Adjust the delay as needed
  });

  // Users typing in class note book
  socket.on("typing-notes", (data) => {
    // immediately update notes
    if (activeUsers.has(socket.id) && activeUsers.get(socket.id).username !== undefined) {
      console.log("User:", activeUsers.get(socket.id).username);
    }
    console.log("Updated Notes:", data);
    socket.to(socket.room).emit("is_typing_notes", data);
  });

  // Handle title change in notebook
  socket.on("notes-update-title", (data) => {
    // immediately update notes
    if (activeUsers.has(socket.id) && activeUsers.get(socket.id).username !== undefined) {
      console.log("User:", activeUsers.get(socket.id).username);
    }
    console.log("Updated Title:", data);
    socket.to(socket.room).emit("updated_notes_title", data);
    // have all users update class list
    socket.broadcast.emit("update-class-list");
    // io.emit("update-class-list");
  });

  // Handle updating class list when notes have been added or deleted
  socket.on("new-class-list", () => {
    // emit to all users to update class list
    socket.broadcast.emit("update-class-list");
    //  io.emit("update-class-list");
  });

  // // Join collaborative note 
  // socket.on("join-collab", (data, room) => {
  //   // emit user data to the rest of the users in the note room
  //   socket.to(room).emit("join-collab-data", data);
  // });

  // // Leave collaborative note 
  // socket.on("leave-collab", (data, room) => {
  //   // emit user data to the rest of the users in the note room
  //   socket.to(room).emit("leave-collab-data", data);
  // });

});

// retrieve username of current user in session
app.get("/username", async (req, res) => {
  try {
    if (req.session && req.session.userid) {
      const userid = req.session.userid;

      // Query the database to retrieve user information based on user ID
      const [userData] = await pool.query(
        "SELECT username FROM user WHERE userID = ?",
        [userid]
      );

      if (userData.length === 1) {
        const username = userData[0].username;

        res.json({ username: username });
      } else {
        res.status(404).send("User not found");
      }
    } else {
      res.status(401).send("Unauthorized. Please log in first.");
      console.log("Unauthorized");
    }
  } catch (error) {
    console.error("Error fetching user information:", error);
    res.status(500).send("Internal server error");
  }
});

// Load user avatars, usernames, and userIDs
app.get("/user-avatars", async (req, res) => {
  try {
    // fetch all user avatars, usernames, and userIDs
    const [avatarData] = await pool.query("SELECT user.userID, user.username, user.avatar FROM user WHERE avatar IS NOT NULL");
    // console.log("data:", avatarData);
    avatarData.forEach((data) => {
      if (data.avatar !== null) {
        data.avatar = data.avatar.toString();
      }
    });

    res.json({
      avatarData: avatarData,
    });

  } catch(error) {
    console.error("Error fetching user avatar information:", error);
    res.status(500).send("Internal server error");
  }
});

// retrieve classes data based userID
app.get("/classes", async (req, res) => {
  try {
    const userID = req.session.userid;
    // Query the database to retrieve class data
    const [classData] = await pool.query(
      "SELECT DISTINCT classes.classID, classes.ownerID, classes.className FROM classes INNER JOIN classList ON classes.classID = classList.classID INNER JOIN user ON user.userID = classList.userID WHERE user.userID = ?",
      [userID]
    );
    // ("SELECT DISTINCT classes.classID, classes.className FROM classes INNER JOIN chatrooms ON classes.classID = chatrooms.classID INNER JOIN user ON user.userID = chatrooms.userID WHERE user.userID = ?", [userID]);

    // data stored in an array of objects
    // Ex: classData[0].classID grabs the classID from the first object

    // Send class data to Frontend as array of objects
    res.json({
      classData: classData,
    });
  } catch (error) {
    console.error("Error fetching class information:", error);
    res.status(500).send("Internal server error");
  }
});

// Remove user from a class
app.post("/leave-class", async (req, res) => {
  const { classID } = req.body;
  const userID = req.session.userid;
  try {
    await pool.query("DELETE FROM classList WHERE userID = ? AND classID = ?", [
      userID,
      classID,
    ]);
    res.status(200).send("Class removed successfully");
  } catch (error) {
    console.error("Error removing user", error);
    res.status(500).send("Internal server error");
  }
});

// Available classes for user to join
app.get("/available-classes", async (req, res) => {
  const userID = req.session.userid;
  try {
    // Retrieve the classes that the user is not in
    const [classData] = await pool.query(
      "SELECT DISTINCT classes.classID, classes.className FROM classes WHERE classes.classID NOT IN (SELECT classList.classID FROM classList WHERE classList.userID = ?)",
      [userID]
    );
    // Send class data to frontend as array of objects
    res.json({
      classData: classData,
    });
  } catch (error) {
    console.error("Error fetching class information", error);
    res.status(500).send("Internal server error");
  }
});

// Add user to a class
app.post("/add-class", async (req, res) => {
  const { classID } = req.body;
  const userID = req.session.userid;
  try {
    await pool.query("INSERT INTO classList (userID, classID) VALUES (?, ?)", [
      userID,
      classID,
    ]);
    res.status(200).send("Class added successfully");
  } catch (error) {
    console.error("Error inserting user", error);
    res.status(500).send("Internal server error");
  }
});

// Create a class
app.post("/create-class", async (req, res) => {
  const { className, description } = req.body;
  const userID = req.session.userid;
  try {
    // Create the class
    await pool.query(
      "INSERT INTO classes (ownerID, className, description) VALUES (?, ?, ?)",
      [userID, className, description]
    );
    // Get the classID of the created class
    const [result] = await pool.query(
      "SELECT classID FROM classes WHERE className = ? AND ownerID = ?",
      [className, userID]
    );
    // Return the classID
    res.json({
      classID: result[0].classID,
    });
  } catch (error) {
    console.error("Error creating class", error);
    res.status(500).send("Internal server error");
  }
});

// retrieve the messages from chatroom table
app.post("/messages", async (req, res) => {
  try {
    //grab classID from frontend
    const { classID } = req.body;
    // fetch chatroom messages
    const [userData] = await pool.query(
      "SELECT chatrooms.message, chatrooms.timestamp, chatrooms.gif, user.username, user.userID FROM chatrooms INNER JOIN user ON user.userID = chatrooms.userID INNER JOIN classes ON classes.classID = chatrooms.classID WHERE classes.classID = ? ORDER BY chatrooms.timestamp ASC ",
      [classID]
    );
    // // fetch chatroom messages
    // const [userData] = await pool.query(
    //   "SELECT chatrooms.message, chatrooms.timestamp, user.username, user.userID, user.avatar FROM chatrooms INNER JOIN user ON user.userID = chatrooms.userID INNER JOIN classes ON classes.classID = chatrooms.classID WHERE classes.classID = ? ORDER BY chatrooms.timestamp ASC ",
    //   [classID]
    // );

    // userData.forEach((data) => {
    //   if (data.avatar !== null) {
    //     data.avatar = data.avatar.toString();
    //   }
    // });
    // // Loads the last 10 messages for the chatroom ordered by timestamp
    // const [userData] = await pool.query(
    //   "SELECT * FROM (SELECT chatrooms.message, chatrooms.timestamp, user.username FROM chatrooms INNER JOIN user ON user.userID = chatrooms.userID INNER JOIN classes ON classes.classID = chatrooms.classID WHERE classes.classID = ? ORDER BY chatrooms.timestamp DESC LIMIT 10) AS last_messages ORDER BY last_messages.timestamp ASC",
    //   [classID]
    // );

    // data stored in an array of objects
    // Ex: userData[0].message grabs the message from the first object

    // return data to frontend
    // console.log("the username is " + userData[0].username);
    console.log(userData.length);
    res.json({
      userData: userData,
    });
  } catch (error) {
    console.error("Error fetching chatroom messages:", error);
    res.status(500).send("Internal server error");
  }
});

// Insert message into chatroom
app.post("/insert-message", async (req, res) => {
  try {
    // grab chatroom data from frontend (send in same order from frontend)
    const { message, timestamp, gif, classID } = req.body;
    // userID (session)
    const userID = req.session.userid;
    // insert chatroom data
    await pool.query(
      "INSERT INTO chatrooms (classID, timestamp, message, gif, userID) VALUES (?, ?, ?, ?, ?)",
      [classID, timestamp, message, gif, userID]
    );
  } catch (error) {
    console.error("Error inserting message:", error);
    res.status(500).send("Internal server error");
  }
});

// Fetch notes for user
app.get("/user-notes", async (req, res) => {
  try {
    const userID = req.session.userid;
    const [noteData] = await pool.query(
      "SELECT fileName, fileID, description, text FROM files WHERE userID = ? AND classID IS NULL",
      [userID]
    );
    // const [noteData] = await pool.query(
    //   "SELECT fileName, fileID, description, file FROM files WHERE userID = ?",
    //  [userID]
    // );
    // return array of objects
    res.json({
      noteData: noteData,
    });
  } catch (error) {
    console.error("Error fetching user notes:", error);
    res.status(500), send("Internal server error");
  }
});

// Insert a new file into files table
app.post("/add-user-note", async (req, res) => {
  try {
    const { fileName, uploadDate, description, text } = req.body;
    // grab the userID
    const userID = req.session.userid;

    // Insert note into files table
    await pool.query(
      "INSERT INTO files (fileName, uploadDate, userID, description, text) VALUES (?, ?, ?, ?, ?)",
      [fileName, uploadDate, userID, description, text]
    );
    // // Insert note into files table
    // await pool.query("INSERT INTO files (fileName, uploadDate, userID, description, file) VALUES (?, ?, ?, ?, ?)",
    // [fileName, uploadDate, userID, description, file]);

    // Send a success response to the client
    res.status(200).send("Note added successfully");
  } catch (error) {
    console.error("Error inserting file:", error);
    res.status(500).send("Internal server error");
  }
});

// Update note
app.post("/update-user-note", async (req, res) => {
  try {
    const { fileID, newFileName, newUploadDate, newDescription, newText } =
      req.body;
    const userID = req.session.userid;

    // Update note in files table
    await pool.query(
      "UPDATE files SET fileName = ?, uploadDate = ?, description = ?, text = ? WHERE fileID = ?",
      [newFileName, newUploadDate, newDescription, newText, fileID]
    );

    // Send a success response to the client
    res.status(200).send("Note updated successfully");
  } catch (error) {
    console.error("Error updating file:", error);
    res.status(500).send("Internal server error");
  }
});

// Delete note
app.post("/delete-user-note", async (req, res) => {
  try {
    const { fileID } = req.body;
    const userID = req.session.userid;

    // Delete note
    await pool.query("DELETE FROM files WHERE fileID = ?", [
      fileID,
    ]);
    // // Delete note
    // await pool.query("DELETE FROM files WHERE fileID = ? AND userID = ?", [
    //   fileID,
    //   userID,
    // ]);

    // Send success response
    res.status(200).send("Note deleted successfully");
  } catch (error) {
    console.error("Error deleting note:", error);
    res.status(500).send("Internal server error");
  }
});

// Fetch notes for class
app.post("/class-notes", async (req, res) => {
  try {
    // Grab the classID
    const { classID } = req.body;
    // Select all notes for that class
    const [noteData] = await pool.query(
      "SELECT fileName, fileID, description, text FROM files WHERE classID = ?",
      [classID]
    );
    // return array of objects
    res.json({
      noteData: noteData,
    });
  } catch (error) {
    console.error("Error fetching user notes:", error);
    res.status(500), send("Internal server error");
  }
});

// Insert a new class note
app.post("/add-class-note", async (req, res) => {
  try {
    const { fileName, uploadDate, description, text, classID } = req.body;
    // grab the userID
    const userID = req.session.userid;

    // Insert note into files table
    await pool.query(
      "INSERT INTO files (fileName, uploadDate, userID, classID, description, text) VALUES (?, ?, ?, ?, ?, ?)",
      [fileName, uploadDate, userID, classID, description, text]
    );

    // Send a success response to the client
    res.status(200).send("Class note added successfully");
  } catch (error) {
    console.error("Error inserting class note:", error);
    res.status(500).send("Internal server error");
  }
});

// Fetch latest note changes from specific note
app.post("/latest-note-changes", async (req, res) => {
  try {
    // Grab the fileID
    const { fileID } = req.body;
    // Select the note
    const [noteData] = await pool.query(
      "SELECT fileName, fileID, description, text FROM files WHERE fileID = ?",
      [fileID]
    );
    // return array of objects
    res.json({
      noteData: noteData,
    });
  } catch (error) {
    console.error("Error fetching updated note:", error);
    res.status(500), send("Internal server error");
  }
});

// // generate secret key
// const crypto = require('crypto');

// const generateSecretKey = () => {
//   return crypto.randomBytes(64).toString('hex');
// };

// const folderPath = path.join(__dirname, "..\\Frontend");

// // Login
// app.get("/login", (req, res) => {
//   const htmlPath = path.join(__dirname, "http://localhost:5173/src/pages/LoginPage.jsx");
//   //res.sendFile(htmlPath);
//   res.sendFile(htmlPath);
// });

// // Account creation
// app.get("/create-account", (req, res) => {
//   const htmlPath = path.join(__dirname, "public/create-account.html");
//   res.sendFile(htmlPath);
// });

// app.get('/logout', function(req, res){
//   req.session.destroy(function(){
//      res.send({})
//   });
//   res.redirect('src/LoginPage.jsx');
// });

//------------------------------------------------------------------------------------------------------
// Route to retrieve user information based on session data
app.get("/user-info", async (req, res) => {
  try {
    // Check if user is authenticated by checking if user ID is stored in session
    // req.session.userid
    if (req.session) {
      //console.log(req.session.userid);
      // User is authenticated, retrieve user ID from session
      const userid = req.session.userid;

      // Query the database to retrieve user information based on user ID
      const [userData] = await pool.query(
        `select user.username, 
                user.email, 
                user.avatar, 
                JSON_ARRAYAGG(classes.className) as classes
                 from user 
                 LEFT JOIN classList ON user.userID = classList.userID
                LEFT JOIN classes ON classList.classID = classes.classID 
                where user.userID = ?;`,
        [userid]
      );
      if (userData.length === 1) {
        // User data found, send user information to the frontend
        res.json(userData);
      } else {
        // User not found in the database
        res.status(404).send("User not found");
      }
      //
      console.log("Current Session ID:", req.sessionID);
      //
    } else {
      // User is not authenticated, return unauthorized status
      res.status(401).send("Unauthorized. Please log in first.");
      console.log("Unauthorized");
    }
  } catch (error) {
    // Error occurred while fetching user information
    console.error("Error fetching user information:", error);
    res.status(500).send("Internal server error");
  }
});

// End of external modification ++++++++++++++++++++++++++++++++++++++++++++++++

// Check login credentials
// Updates user accounts from the user update page
app.post("/update-user-info", async (req, res) => {
  const { name, username, email, croppedImg } = req.body;
  try {
    if (req.session) {
      const userId = req.session.userid;

      // Query the database to retrieve essential user information based on user ID
      const [userData] = await pool.query(
        "SELECT name, username, email, avatar FROM user WHERE userID = ?",
        [userId]
      );

      if (userData.length === 1) {
        // Check if any new information is provided and not blank
        const updates = {};
        if (name) updates.name = name;
        if (username) updates.username = username;
        if (email) updates.email = email;
        if (croppedImg) updates.avatar = croppedImg;

        // Check if provided email is valid
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (updates.email && !emailRegex.test(updates.email)) {
          return res.status(400).send("Invalid email format");
        }

        // Check if username or email already exists in the database
        const [existingUser] = await pool.query(
          "SELECT userID FROM user WHERE (username = ? OR email = ?) AND userID != ?",
          [updates.username, updates.email, userId]
        );
        // Check if the provided email or username matches
        //the existing email or username of the user
        const [currentUser] = await pool.query(
          "SELECT userID FROM user WHERE userID = ? AND (username = ? OR email = ?)",
          [userId, username, email]
        );
        if (existingUser.length > 0) {
          return res
            .status(400)
            .send(
              "Username or email already exists. Please choose a different one."
            );
        }
        // Check if currentUser has any data,
        //indicating that the provided email or username
        //matches the existing email or username of the user
        if (currentUser.length > 0) {
          // Send a specific error message indicating that the user is attempting to update to an existing email or username
          return res
            .status(400)
            .send("You cannot update to your own existing email or username.");
        }

        // Update the user information in the database
        await pool.query("UPDATE user SET ? WHERE userID = ?", [
          updates,
          userId,
        ]);

        res.json({ success: true });
      } else {
        // User not found in the database
        res.status(404).send("User not found");
      }
    } else {
      // User is not authenticated, return unauthorized status
      res.status(401).send("Unauthorized. Please log in first.");
      console.log("Unauthorized");
    }
  } catch (error) {
    // Error occurred while updating user information
    console.error("Error updating user information:", error);
    res.status(500).send("No Updates Made");
  }
});

// Updates user password
app.post("/reset-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    // Check if user is authenticated by checking if user ID is stored in session
    if (req.session) {
      // User is authenticated, retrieve user ID from session
      const userId = req.session.userid;

      // Query the database to retrieve the user's password based on user ID
      const [userData] = await pool.query(
        "SELECT password FROM user WHERE userID = ?",
        [userId]
      );

      if (userData.length === 1) {
        // User data found, proceed with password update logic

        // Check if the old password matches the stored password hash
        const passwordMatch = await bcrypt.compare(
          oldPassword,
          userData[0].password
        );
        if (!passwordMatch) {
          return res.status(401).send("Old password is incorrect");
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10); // 10 is the number of salt rounds

        // Update the user's password hash in the database
        await pool.query("UPDATE user SET password = ? WHERE userID = ?", [
          hashedPassword,
          userId,
        ]);

        res.json({ success: true });
      } else {
        // User not found in the database
        return res.status(404).send("User not found");
      }
    } else {
      // User is not authenticated, return unauthorized status
      res.status(401).send("Unauthorized. Please log in first.");
      console.log("Unauthorized");
    }
  } catch (error) {
    // Error occurred while updating user information
    console.error("Error updating user information:", error);
    res.status(500).send("Internal server error");
  }
});

//------------------------------------------------------------------------------------------------------

// Check login credentials (create user session)
app.post("/login", async (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  console.log("Username:", req.body.username);

  try {
    // Fetch user data (including hashed password) from the database based on username
    const [userData] = await pool.query(
      "SELECT * FROM user WHERE username = ?",
      [username]
    );

    if (userData.length === 0) {
      res.send("Invalid username or password");
    } else {
      // Grabbing user info from User table
      const hashedPassword = userData[0].password; // grab hashed password
      const userid = userData[0].userID; // grab userid
      const username = userData[0].username; // grab username
      const email = userData[0].email; // grab email
      const img = userData[0].avatar;

      // Compare the entered password with the hashed password from the database
      const passwordMatch = await bcrypt.compare(password, hashedPassword);

      if (passwordMatch) {
        //store userid in the session
        req.session.userid = userid; // this stores the userid in session
        req.session.username = username;
        // req.session.save();

        console.log("Session ID:", req.sessionID);

        // sends user info to the Frontend on submit
        //MOISES added new field to send on login
        res.send({
          user: userData[0].userID,
          success: true,
          username,
          email,
          userID: req.session.userid,
          hashedPassword,
          avatar:
            userData[0].avatar !== null
              ? userData[0].avatar.toString()
              : userData[0].avatar,
        });

        // Print userid to stdout (Backend)
        console.log("Userid:", userid);
      } else {
        res.send("Invalid username or password");
      }
    }
  } catch (error) {
    res.status(500).send("Error checking username");
    console.error(error);
  }
});

// Logout (destroy session)
app.post("/logout", (req, res) => {
  // destroy session w/ error handling
  console.log("Destroy Session: ", req.sessionID);
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Error destroying session");
    } else {
      res.status(200).send("Session destroyed successfully");
    }
  });
});

// Account creation post
app.post("/create-account", upload.single("Image"), async (req, res) => {
  const { username, email, password, croppedimg } = req.body;

  try {
    const [existingUser] = await pool.query(
      "SELECT * FROM user WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUser.length > 0) {
      res.send(
        "Username or email already exists. Please choose a different one."
      );
    } else {
      // Check if the password meets the minimum length requirement
      if (password.length < 8) {
        res.send("Password must be at least 8 characters long.");
      } else {
        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the number of salt rounds

        // Insert new user data (including the hashed password) into the database
        await pool.query(
          "INSERT INTO user (username, email, password, avatar) VALUES (?, ?, ?, ?)",
          [username, email, hashedPassword, croppedimg]
        );

        // Check if the account was successfully created by querying the database again
        const [newUser] = await pool.query(
          "SELECT * FROM user WHERE username = ?",
          [username]
        );

        if (newUser.length > 0) {
          // res.send("Account created successfully!");
          res.send({ success: true });
        } else {
          res.send("Failed to create an account. Please try again.");
        }
      }
    }
  } catch (error) {
    res.status(500).send("Error creating the account");
    console.error(error);
  }
});

// // retrieve the messages from chatroom table
// app.post("/messages", async (req, res) => {
//   try {
//     //grab classID from frontend
//     const { classID } = req.body;
//     console.log("messages: id is " + req.body.classID);
//     //fetch chatroom messages
//     const [userData] = await pool.query(
//       "SELECT chatrooms.message, chatrooms.timestamp, user.username FROM chatrooms INNER JOIN user ON user.userID = chatrooms.userID INNER JOIN classes ON classes.classID = chatrooms.classID WHERE classes.classID = ?",
//       [classID]
//     );

//     // data stored in an array of objects
//     // Ex: userData[0].message grabs the message from the first object

//     //return data to frontend
//     //returns message, timestamp, and username
//     res.json({
//       userData: userData,
//     });
//   } catch (error) {
//     console.error("Error fetching chatroom messages:", error);
//     res.status(500).send("Internal server error");
//   }
// });

// // Insert message into chatroom
// app.post("/insert-message", async (req, res) => {
//   try {
//     // grab chatroom data from frontend (send in same order from frontend)
//     const { classID, timestamp, message } = req.body;
//     //userID (session)
//     const userID = req.session.userID;
//     //insert chatroom data
//     await pool.query(
//       "INSERT INTO chatrooms (classID, timestamp, message, userID) VALUES (?, ?, ?, ?)",
//       [classID, timestamp, message, userID]
//     );
//   } catch (error) {
//     console.error("Error inserting message:", error);
//     res.status(500).send("Internal server error");
//   }
// });

// // update chatroom messages
// app.post("/update-messages", async (req, res) => {
//   try {
//     const userID = req.session.userID;
//     const chatID = req.session.chatID;
//     const { newMessage } = req.body; // Extract the new message content from the request body

//     // Update the message in the chatrooms table for the specified chatroom ID
//     await pool.query(
//       "UPDATE chatrooms SET message = ? WHERE userID = ? AND chatID = ?",
//       [newMessage, userID, chatID]
//     );

//     res.json({ message: "Message updated successfully" });
//   } catch (error) {
//     console.error("Error updating message:", error);
//     res.status(500).send("Internal server error");
//   }
// });

// // retrieve classes data based on class name
// app.post("/classes", async (req, res) => {
//   try {
//     const { className } = req.body;
//     // Query the database to retrieve class data
//     const [classData] = await pool.query(
//       "Select * FROM classes WHERE classes.className = ?",
//       [className]
//     );

//     // data stored in an array of objects
//     // Ex: classData[0].classID grabs the classID from the first object

//     //send class data to Frontend as array of objects
//     res.json({
//       classData: classData,
//     });
//   } catch (error) {
//     console.error("Error fetching class information:", error);
//     res.status(500).send("Internal server error");
//   }
// });

// Grab html from public folder
// Path needs to lead to public directory
// to fetch html
// main html file had to be named index or else would get "cannot GET"
app.use(express.static("public"));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(200).send("hi");
  res.status(500).send("No worky ):");
});

// Use async/await with the promise-based query
async function queryDatabase() {
  try {
    // TESTING DATA
    // const userID = 11;
    // const [userData] = await pool.query(
    //   "SELECT DISTINCT classes.classID, classes.className FROM classes INNER JOIN classList ON classes.classID = classList.classID INNER JOIN user ON user.userID = classList.userID WHERE user.userID = ?",
    //   [userID]
    // );
    // // Select classes user is not in
    // const [userData2] = await pool.query(
    //   "SELECT DISTINCT classes.classID, classes.className FROM classes WHERE classes.classID NOT IN (SELECT classList.classID FROM classList WHERE classList.userID = ?)",
    //   [userID]
    // );
    // const [classData] = await pool.query(
    //   "SELECT DISTINCT classes.classID, classes.className FROM classes INNER JOIN classList ON classes.classID = classList.classID INNER JOIN user ON user.userID = classList.userID"
    // );
    // console.log(`\nClasslist:`, classData);
    // console.log(`\nUser ${userID} classlist:\n`, userData);
    // console.log(`\nUser ${userID} available classlist:\n`, userData2);
    // console.log(data);

  } catch (error) {
    console.error(error);
  }
}

queryDatabase(); // Call the function to query the database

// app.listen(3000, () => {
//   console.log("App listening on port 3000");
//   //console.log("Server is running on 3000");
// });
