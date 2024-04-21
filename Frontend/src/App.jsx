import "./App.css";
import Home from "./pages/Home.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import CreateAccount from "./pages/CreateAccount.jsx";
import Chatroom from "./pages/Chatroom.jsx";
import Notebook from "./pages/Notebook.jsx";
import { createRef, useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import "./App.css";
import UserUpdate from "./pages/UserUpdate.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";

function App() {
  // console.log("Initiating app...");
  // Classes State
  const [classes, setClasses] = useState([]);
  // Chats State
  const [chats, setChats] = useState([]);
  // Username State
  const [username, setUsername] = useState(null);
  // Room State
  const [room, setRoom] = useState(() => {
    const savedRoom = sessionStorage.getItem("room");
    return savedRoom ? JSON.parse(savedRoom) : [];
  });

  // Note Pages State
  const [notePages, setNotes] = useState([]);
  // Class Note Pages State
  const [classNotes, setClassNotes] = useState([]);
  // State to store selected note
  // const [selectedNote, setSelectedNote] = useState(null);

  const [selectedNote, setSelectedNote] = useState(() => {
    const savedNote = sessionStorage.getItem('selectedNote');
    return savedNote ? JSON.parse(savedNote) : null;
  });

  // Load active users from session storage on component mount
  // const [activeUsers, setActiveUsers] = useState(() => {
  //   const savedUsers = sessionStorage.getItem("activeUsers");
  //   return savedUsers ? JSON.parse(savedUsers) : [];
  // });

  const [activeUsers, setActiveUsers] = useState([]);
  
  // Load inactive users session storage on component mount
  // const [inactiveUsers, setInactiveUsers] = useState(() => {
  //   const savedUsers = sessionStorage.getItem("inactiveUsers");
  //   return savedUsers ? JSON.parse(savedUsers) : [];
  // });
  const [inactiveUsers, setInactiveUsers] = useState([]);
  
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          <Route index element={<Home />} />
          <Route path="login-page" element={<LoginPage />} />
          <Route path="create-account" element={<CreateAccount />} />
          <Route
            path="notebook"
            element={
              <Notebook
                classes={classes}
                setClasses={setClasses}
                username={username}
                setUsername={setUsername}
                notePages={notePages}
                setNotes={setNotes}
                selectedNote={selectedNote}
                setSelectedNote={setSelectedNote}
                room={room}
                setRoom={setRoom}
                classNotes={classNotes}
                setClassNotes={setClassNotes}
              />
            }
          />
          <Route
            path="chatroom"
            element={
              <Chatroom
                room={room}
                setRoom={setRoom}
                classes={classes}
                setClasses={setClasses}
                chats={chats}
                setChats={setChats}
                username={username}
                setUsername={setUsername}
                activeUsers={activeUsers}
                setActiveUsers={setActiveUsers}
                inactiveUsers={inactiveUsers}
                setInactiveUsers={setInactiveUsers}
                notePages={notePages}
                setNotes={setNotes}
                selectedNote={selectedNote}
                setSelectedNote={setSelectedNote}
                classNotes={classNotes}
                setClassNotes={setClassNotes}
              />
            }
          />
          <Route path="user-update" element={<UserUpdate />} />
          <Route path="reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
