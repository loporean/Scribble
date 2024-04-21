import { Link } from "react-router-dom";
import { initValueContext } from "../components/InitValue.jsx";
import { useContext, useEffect, useState } from "react";
import axios from "axios";
import socket from "../components/Socket.jsx";
import AddClass from "../components/AddClass.jsx";
import moment from "moment"; // For timestamp
import CreateClass from "../components/CreateClass.jsx";
import LeaveClass from "../components/LeaveClass.jsx";
// import { get } from "firebase/database";

// renders the bar that appears to the left of the screen
// contains menu selections for the chatroom and individual note pages
function Sidebar({
  notePages,
  setNotes,
  selectedNote,
  setSelectedNote,
  classes,
  chats,
  room,
  classNotes,
  setClassNotes,
  username,
  // refresh,
  // setRefresh,
  // parentCallback,
}) {
  // const [dropdownVisible, setDropdownVisible] = useState(false);
  // const [dropdownVisible, setDropdownVisible] = useState(
  //   sessionStorage.getItem("dropdownVisible") === "true"
  // );

  const [classesDropdownVisible, setClassesDropdownVisible] = useState();

  const [notebookDropdownVisible, setNotebookDropdownVisible] = useState(
    sessionStorage.getItem("notebookDropdownVisible") === "true"
  );

  const [classNotesDropdownVisible, setClassNotesDropdownVisible] = useState(
    sessionStorage.getItem("classNotesDropdownVisible") === "true"
  );

  // State to control the create modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  // State to control the join modal
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  // State for control the Leave modal
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Function to open the create modal
  const openCreateModal = () => {
    setCreateModalOpen(true);
  };

  // Function to close the create modal
  const closeCreateModal = () => {
    setCreateModalOpen(false);
  };

  // Function to open the join modal
  const openJoinModal = () => {
    setJoinModalOpen(true);
  };

  // Function to close the join modal
  const closeJoinModal = () => {
    setJoinModalOpen(false);
  };

  // Function to open the leave modal
  const openLeaveModal = () => {
    setLeaveModalOpen(true);
  };

  // Function to close the leave modal
  const closeLeaveModal = () => {
    setLeaveModalOpen(false);
  };

  // Function to generate a unique filename
  function generateUniqueFilename(baseName, existingFilenames) {
    let newName = baseName;
    let count = 1;
    while (existingFilenames.some((page) => page.description === newName)) {
      newName = `${baseName}(${count})`;
      count++;
    }
    return newName;
  }

  // Create a new user note
  const newUserNote = async (req, res) => {
    try {
      // file description (Title)
      var description = "NewNote";
      if (notePages.some((page) => page.description === description)) {
        const uniqueFilename = generateUniqueFilename(description, notePages);
        description = uniqueFilename;
        console.log("Unique Filename:", uniqueFilename);
      } else {
        console.log("NewNote is unique");
      }
      // FileName
      const fileName = description + ".txt";
      console.log(fileName);
      // // File
      // const file = "";
      // Text
      const text = "";
      // local timestamp
      const uploadDate = moment().format("YYYY-MM-DD HH:mm:ss");

      await axios.post("http://localhost:3000/add-user-note", {
        fileName: fileName,
        uploadDate: uploadDate,
        description: description,
        text: text,
      });
      // Update notes list
      getUserNotes();
    } catch (error) {
      console.error("Error adding new note:", error);
    }
  };

  // Get the user notes from the database
  const getUserNotes = async () => {
    try {
      const response = await axios.get("http://localhost:3000/user-notes");
      console.log("User Notes:", response.data.noteData);
      // Format the notes for displaying
      const formattedNotes = response.data.noteData.map((note) => ({
        description: note.description,
        fileName: note.fileName,
        fileID: note.fileID,
        text: note.text,
      }));
      // Insert formatted data into notePages state
      setNotes(formattedNotes);
    } catch (error) {
      console.error("Error getting user notes:", error);
    }
  };

    // Create a new class note
    const newClassNote = async (req, res) => {
      try {
        // file description (Title)
        var description = "NewNote";
        if (classNotes.some((page) => page.description === description)) {
          const uniqueFilename = generateUniqueFilename(description, classNotes);
          description = uniqueFilename;
          console.log("Unique Filename:", uniqueFilename);
        } else {
          console.log("NewNote is unique");
        }
        // FileName
        const fileName = description + ".txt";
        console.log(fileName);
        // // File
        // const file = "";
        // Text
        const text = "";
        // local timestamp
        const uploadDate = moment().format("YYYY-MM-DD HH:mm:ss");
  
        await axios.post("http://localhost:3000/add-class-note", {
          fileName: fileName,
          uploadDate: uploadDate,
          description: description,
          text: text,
          classID: room.ID,
        });
        // Update class notes list
        getClassNotes();
        // emit for users to get new class list
        socket.emit("new-class-list");
      } catch (error) {
        console.error("Error adding new class note:", error);
      }
    };

  // Get the class notes from the database
  const getClassNotes = async () => {
    try {
      const response = await axios.post("http://localhost:3000/class-notes", {
        classID: room.ID,
      });
      // Format the notes for displaying
      const formattedNotes = response.data.noteData.map((note) => ({
        description: note.description,
        fileName: note.fileName,
        fileID: note.fileID,
        text: note.text,
      }));
      // Insert formatted data into notePages state
      console.log("class notes:", formattedNotes);
      setClassNotes(formattedNotes);
    } catch (error) {
      console.error("Error getting class notes:", error);
    }
  };

  // Set the note that the user clicks
  // If user clicks personal note, room should be 
  // set back to previous class room.Name
  const setUserNote = async (note) => {
    try {
      // set the selectedNote for initial viewing
      setSelectedNote(note);

      console.log("page clicked:", note);
      // Set room back to class room 
      socket.emit("join_room", room.Name);

    } catch (error) {
      console.error("Error setting user note:", error);
    }
  };

  // Set the class note that the user clicks
  // Before setting the selected note, join a room using the fileID
  // User should grab latest changes of class note before setting to selectedNote
  const setClassNote = async (note) => {
    try {
      // set the selectedNote for initial viewing
      setSelectedNote(note);
      // join the room for the note selected
      const noteRoom = note.fileID;
      socket.emit("join_room", noteRoom);

      // get latest note changes before setting selectedNote
      const response = await axios.post("http://localhost:3000/latest-note-changes", {
        fileID: note.fileID,
      });
      const newNote = response.data.noteData[0];

      // If the updated data does not equal the initial data
      // then update the selected Note
      if (note.text !== newNote.text || note.description !== newNote.description) {
        console.log("Old Data !== New Data");
        setSelectedNote(response.data.noteData[0]);
      } else {
        console.log("Old Data === New Data");
      }
    } catch (error) {
      console.error("Error setting user note:", error);
    }
  };

  // Save notebook dropdown to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem("notebookDropdownVisible", notebookDropdownVisible);
  }, [notebookDropdownVisible]);

  // Save class notebook dropdown to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem("classNotesDropdownVisible", classNotesDropdownVisible);
  }, [classNotesDropdownVisible]);

  // save selected note to sessionStorage when it changes
  useEffect(() => {
    sessionStorage.setItem('selectedNote', JSON.stringify(selectedNote));
  }, [selectedNote]);

  // class room change
  useEffect(() => {
    getUserNotes();
    getClassNotes();
    console.log("Get notes:", notePages);
  }, [room]);

  // sockets
  useEffect(() => {
    if (!chats) {
      // update class list 
      socket.on("update-class-list", () => {
        getClassNotes();
      });
    }
  }, [socket]);

  return (
    <div>
      {/* Render create modal component conditionally */}
      {createModalOpen && (
        <CreateClass onClose={closeCreateModal} classes={classes} />
      )}
      {/* Render join modal component conditionally */}
      {joinModalOpen && <AddClass onClose={closeJoinModal} classes={classes} />}
      {/* Render leave modal component conditionally */}
      {leaveModalOpen && (
        <LeaveClass onClose={closeLeaveModal} classes={classes} />
      )}

      <div className="the-column">
        <ul className="sidebar-content">
          <nav>
            <li className="side-list">
              <div className="side-selection">
                <label
                  htmlFor="touch"
                  className="the-link"
                  onClick={() =>
                    setClassesDropdownVisible(!classesDropdownVisible)
                  }
                >
                  <h5>Classes</h5>
                </label>
              </div>
              <ul
                className="slide"
                style={{ display: classesDropdownVisible ? "block" : "none" }}
              >
                <Link
                  className="the-link"
                  // to="/chatroom"
                  onClick={openCreateModal}
                  style={{
                    color: "#2d2f31",
                    display: "block",
                    paddingRight: "65px",
                  }}
                >
                  <div className="side-selection">
                    <h6>Create</h6>
                  </div>
                </Link>
                <Link
                  className="the-link"
                  // to="/chatroom"
                  onClick={openJoinModal}
                  style={{
                    color: "#2d2f31",
                    display: "block",
                    paddingRight: "65px",
                  }}
                >
                  <div className="side-selection">
                    <h6>Join</h6>
                  </div>
                </Link>
                <Link
                  className="the-link"
                  // to="/chatroom"
                  onClick={openLeaveModal}
                  style={{
                    color: "#2d2f31",
                    display: "block",
                    paddingRight: "65px",
                  }}
                >
                  <div className="side-selection">
                    <h6>Leave</h6>
                  </div>
                </Link>
              </ul>
            </li>
          </nav>

          <li className="side-list">
            <Link className="the-link" to="/chatroom">
              <div className="side-selection">
                <h5>Chatroom</h5>
              </div>
            </Link>
          </li>
          <nav>
            <li className="side-list">
              <div className="side-selection">
                <label
                  htmlFor="touch"
                  className="the-link"
                  onClick={() =>
                    setNotebookDropdownVisible(!notebookDropdownVisible)
                  }
                >
                  <h5>
                    {username}'s<br></br>Notebook
                  </h5>
                </label>
                {notebookDropdownVisible && notePages && notePages.length < 5 && (
                  <button
                    className="plus-button plus-button--small"
                    onClick={newUserNote}
                    title="add note"
                  ></button>
                )}
              </div>
              <ul
                className="slide"
                style={{ display: notebookDropdownVisible ? "block" : "none" }}
              >
                {/* Use storedNotes state to display list */}
                {notePages &&
                  notePages.length > 0 &&
                  notePages.map((page) => (
                    <li className="side-list" key={page.fileName}>
                      <Link
                        className="the-link"
                        to={{ pathname: "/notebook" }}
                        onClick={() => setUserNote(page)}
                        style={{
                          color: "#2d2f31",
                          display: "block",
                          paddingRight: "65px",
                        }}
                      >
                        <div className="side-selection">
                          <h6>{page.description}</h6>
                        </div>
                      </Link>
                    </li>
                  ))}
                {notePages && notePages.length === 0 && (
                  <p style={{marginLeft: "12px"}}>(Empty)</p>
                )}
              </ul>
            </li>
          </nav>
          {/* Class Notebook */}
          {/* Notebook changes only for class owner */}
          <nav>
            <li className="side-list">
              {/* Only show class notebook if user is joined in at least one class */}
              {/* Causing issues when navigating to notes for classes and user notes */}
              {/* {classes && classes.length > 0 && ( */}
                <div className="side-selection">
                  <label
                    htmlFor="touch"
                    className="the-link"
                    onClick={() =>
                      setClassNotesDropdownVisible(!classNotesDropdownVisible)
                    }
                  >
                    <h5>
                      {room.Name}<br></br>Notebook
                    </h5>
                  </label>
                  {classNotesDropdownVisible && (
                    <button
                      className="plus-button plus-button--small"
                      onClick={newClassNote}
                      title="add note"
                    ></button>
                  )}
                </div>
              {/* )} */}
              <ul
                className="slide"
                style={{ display: classNotesDropdownVisible ? "block" : "none" }}
              >
                {/* Use classNotes state to display list */}
                {classNotes &&
                  classNotes.length > 0 &&
                  classNotes.map((page) => (
                    <li className="side-list" key={page.fileName}>
                      <Link
                        className="the-link"
                        to={{ pathname: "/notebook" }}
                        // Set the classNote
                        // Then fetch latest updates from database before setting selectedNote
                        onClick={() => setClassNote(page)}
                        style={{
                          color: "#2d2f31",
                          display: "block",
                          paddingRight: "65px",
                        }}
                        >
                        <div className="side-selection">
                          <h6>{page.description}</h6>
                        </div>
                      </Link>
                    </li>
                  ))}
                {classNotes && classNotes.length === 0 && (
                  <h6>(Empty)</h6>
                )}
              </ul>
            </li>
          </nav>
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
