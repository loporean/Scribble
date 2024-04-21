import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import socket from "../components/Socket.jsx";
import { useRef, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import _ from 'lodash';
import { pdfExporter } from 'quill-to-pdf';
import { saveAs } from 'file-saver';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faUpload } from '@fortawesome/free-solid-svg-icons';
import mammoth from 'mammoth'; // For DOCX conversion
import avatarPic from "../images/default_pic.png";

// page that contains the pages of the user's virtual notebook
// function Notebook(props, targetPage, username) {
function Notebook(props) {
  const {
    notePages,
    setNotes,
    classes,
    setClasses,
    username,
    setUsername,
    selectedNote,
    setSelectedNote,
    room,
    setRoom,
    classNotes,
    setClassNotes,
  } = props;

  // Quill ref
  const editorRef = useRef(null);
  // File import
  const fileImportRef = useRef(null);

  // Grab username object from session storage
  const storedData = JSON.parse(sessionStorage.getItem("userData"));

  // State for collaborators
  const [collaborator, setCollaborator] = useState([]);

  const toolbarOptions = [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    ["blockquote", "code-block"],

    [{ header: 1 }, { header: 2 }], // custom button values
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    [{ direction: "rtl" }], // text direction

    [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ font: [] }],
    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ align: [] }],

    ["clean"], // remove formatting button

    ["link", "image"], // link and image
  ];

  // console.log("classes:", classes);

  // function set_init_value() {
  //   setValue(targetPage.text);
  // }

  const module = {
    toolbar: toolbarOptions,
  };

  // function get_that_data_wrapper(childData) {
  //   return get_that_data(childData);
  // }

  // function dummy() {
  //   return 0;
  // }

  // Function to handle callback from Sidebar component
  const handleNoteSelection = (noteData) => {
    // setSelectedNote(noteData); // Update selected note in state
    // console.log("Here");
    // // setSelectedNote(noteData); // Update selected note in state
    // console.log("callback:", noteData);
    // if (noteData) {
    //   // setSelectedNote(noteData); //ADDED
    //   // setValue(noteData.text); // Update value of ReactQuill
    //   setValuePromise(
    //     new Promise((resolve, reject) => {
    //       setValue(noteData.text);
    //       resolve();
    //     })
    //   );
    //   setSelectedNotePromise(
    //     new Promise((resolve, reject) => {
    //       setSelectedNote(noteData);
    //       resolve();
    //     })
    //   );
    // }
  };

  // Get the notes from the database
  // *** Pass as prop for callback so not having to duplicate code in sidebar ***
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
      // Insert formatted data into storedNotes state
      // setStoredNotes(formattedNotes);
      setNotes(formattedNotes);
    } catch (error) {
      console.error("Error getting notes:", error);
    }
  };

  // Get the notes from the database
  // *** Pass as prop for callback so not having to duplicate code in sidebar ***
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
      // Insert formatted data into storedNotes state
      console.log("Get New Class Notes");
      setClassNotes(formattedNotes);
    } catch (error) {
      console.error("Error getting notes:", error);
    }
  };

  // update notes in database after 2 seconds of no typing
  const debouncedUpdate = _.debounce((newText) => {
    updateNotes();
  }, 2000); // Adjust the debounce delay as needed

  let updateTimer = 0;
  // update notes after 2 seconds of no typing
  function delayedUpdate() {
    clearTimeout(updateTimer); // clear the existing timer
    updateTimer = setTimeout(() => {
      // update notes once timer runs out
      updateNotes();
    }, 1000);
  }

  // Update notes after change is made to selectedNote
  const updateNotes = async (req, res) => {
    try {
      // If not the user that modified the note, then don't save to database
      if (!selectedNote || !selectedNote.modified) return;
      // Update notes in database
      await axios.post("http://localhost:3000/update-user-note", {
        fileID: selectedNote.fileID,
        newFileName: selectedNote.fileName,
        newUploadDate: moment().format("YYYY-MM-DD HH:mm:ss"),
        newDescription: selectedNote.description,
        newText: selectedNote.text,
      });
      console.log("selectedNote updated:", selectedNote);
      console.log("Note updated in database");
      // Update note list
      getUserNotes();
      getClassNotes();
      // socket.emit("notes-update-title", selectedNote.description);
      socket.emit("typing-notes", selectedNote.text);
    } catch (error) {
      console.error("Error updating notes:", error);
    }
  };

  // Delete user note
  const deleteNote = async (noteID) => {
    try {
      // Display confirmation dialog
      const isConfirmed = window.confirm(
        "Are you sure you want to delete this note?"
      );

      if (isConfirmed) {
        // Delete note after user clicks button
        await axios.post("http://localhost:3000/delete-user-note", {
          fileID: noteID,
        });
        // Update note list
        getUserNotes();
        getClassNotes();
        // emit for users to get new class list
        socket.emit("new-class-list");
        // Reset selectedNote to null
        setSelectedNote(null);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Download pdf
  const downloadPDF = async () => {
    if (!selectedNote) return;
    // Get note content
    const noteContent = editorRef.current?.editor?.getContents();
    // Generate PDF
    const pdfAsBlob = await pdfExporter.generatePdf(noteContent);
    // Save PDF
    saveAs(pdfAsBlob, `${selectedNote.description}` + ".pdf");
  }

  // Import document
  const importDocument = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    
    // Check file extension
    const fileExtension = file.name.split('.').pop().toLowerCase();

    reader.onload = async function (evt) {
      let content = evt.target.result;

      try {
        if (fileExtension === 'txt') {
          // Text file, no conversion needed
          content = evt.target.result;
          console.log(content);
        } else if (fileExtension === 'docx') {
          // DOCX file, convert to text
          // content = await convertDocxToText(evt.target.result);
          content = await convertDocxToHtml(evt.target.result);
        } else if (fileExtension === "pdf") {
          // PDF file, convert to text
          // content = await convertPdfToText(evt.target.result);
          return;
        } else {
          console.error('Unsupported file format:', fileExtension);
          return;
        }
        
        // Set the content of the editor
        console.log("Editor reference:", editorRef.current); // Log the editor reference
        setSelectedNote({
          ...selectedNote,
          text: selectedNote.text + content,
          modified: true,
        });
      } catch (error) {
        console.error('Error importing document:', error);
      }
    };
    
    if (fileExtension === "txt") {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  // Function to convert DOCX to HTML
  const convertDocxToHtml = async (arrayBuffer) => {
    return new Promise((resolve, reject) => {
        mammoth.convertToHtml({ arrayBuffer })
            .then((result) => {
                resolve(result.value);
            })
            .catch((error) => {
                if (error instanceof mammothError.DocumentNotFoundError) {
                    reject('Error: Document not found.');
                } else {
                    reject('Error converting DOCX to HTML.');
                }
            });
    });
  };


  // When the selecteNote.text changes
  // update the database
  useEffect(() => {
    if (selectedNote !== null && selectedNote !== undefined) {
      // emit note chnages to others in room
      // (Causing recurssion when more than one user in the shared notes)
      // Update notes function is the cause of the resending socket problem
      // debouncedUpdate();
      // instead of debounce, use timer to know when to update all at once
      // delayedUpdate();
      updateNotes();
      getClassNotes();
    } else {
      console.log("selectedNote not updated");
    }
  }, [selectedNote]);

  useEffect(() => {
    // Receive real time note changes
    socket.on("is_typing_notes", (data) => {
      if (selectedNote && selectedNote.text !== data) {
        console.log("text update received:", data);
        // Update typing users array based on previous state
        setSelectedNote((prevSelectedNote) => ({
          ...prevSelectedNote,
          text: data,
          modified: false,
        }));
      }
    });

    // Receive real time note title change
    socket.on("updated_notes_title", (data) => {
      if (selectedNote && selectedNote.description !== data) {
        console.log("title update received");
        // Update typing users array based on previous state
        setSelectedNote((prevSelectedNote) => ({
          ...prevSelectedNote,
          description: data,
          modified: false,
        }));
      }
    });

    // // Receive collaborator data to join
    // socket.on("join-collab-data", (data) => {
    //   // add collaborators
    //   setCollaborator(prevCollaborator => [...prevCollaborator, data]);
    // });

    // // Receive collaborator data to leave
    // socket.on("leave-collab-data", (data) => {
    //   // remove collaborators
    //   setCollaborator(prevCollaborator => prevCollaborator.filter(user => user.userID !== data.userID));
    // });

    return () => {
      socket.off("is_typing_notes");
      socket.off("updated_notes_title");
      // socket.off("join-collab-data");
      // socket.off("leave-collab-data");
    };
  // }, [selectedNote]);
  }, [socket]);

  // Set the room for the selectedNote when in Notebook
  useEffect(() => {
    // if (selectedNote !== null) {
    //   socket.emit("join_room", selectedNote.fileID);
    // }
    socket.emit("join_room", selectedNote.fileID);

    // Set collaborator 
    // setCollaborator([storedData]);
    // // Emit avatar and username to socket
    // socket.emit("join-collab", [storedData], selectedNote.fileID);
  }, []);



  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  // - Show cursor for each collaborator
  //
  // - Owner of class should be the only one allowed to add and delete a note
  //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  // Handle onChange event of ReactQuill
  const handleQuillChange = (newText) => {
    // Check if the new text consists of only spaces
    if (newText !== selectedNote.text) {
      // If it's only spaces, update state and emit socket event immediately
      // setSelectedNote((prevSelectedNote) => ({
      //   ...prevSelectedNote,
      //   text: newText,
      //   modified: true,
      // }));
      setSelectedNote({
        ...selectedNote,
        text: newText,
        modified: true,
      });
      console.log("handleQuillChange");
      // socket.emit("typing-notes", newText);
    }
  };

  // Grab users avatar and username (DONE)
  // Display users avatar and username (DONE)
  // Emit users avatar and username to socket using selectedNote.fileID
  // Grab socket data from all users in room
  // add all other users avatar and username to collaborator state
  // If selecteNote.fileID changes, emit to socket to have users remove username and avatar from collaborator
  // Clear collaborator state


  return (
    <>
      {
        // set_init_value()
      }
      <Navbar
        classes={classes}
        setClasses={setClasses}
        username={username}
        setUsername={setUsername}
        room={room}
        setRoom={setRoom}
      />
      <div className="container-fluid">
        <div className="row no-gutters">
          <div className="col-2 column1">
            {/* <Sidebar parentCallback={get_that_data} notePages={notePages} /> */}
            <Sidebar
              notePages={notePages}
              setNotes={setNotes}
              selectedNote={selectedNote}
              setSelectedNote={setSelectedNote}
              room={room}
              setRoom={setRoom}
              classNotes={classNotes}
              setClassNotes={setClassNotes}
              username={username}
            />
          </div>
          <div className="col-10 column2 the-note-section" style={{ whiteSpace: 'pre-wrap' }}>
            {selectedNote && (
              <>
                <h3
                  style={{
                    marginLeft: "10px",
                    marginTop: "5px",
                    fontFamily: "Comic Sans MS, cursive",
                    fontWeight: "bold",
                    userSelect: "none",
                  }}
                  onDoubleClick={() => {
                    const newTitle = prompt(
                      "Enter new title:",
                      selectedNote.description
                    );
                    if (
                      newTitle !== null &&
                      newTitle !== "" &&
                      newTitle !== selectedNote.description
                    ) {
                      setSelectedNote({
                        ...selectedNote,
                        description: newTitle,
                        fileName: newTitle + ".txt",
                        modified: true,
                      });
                      // setSelectedNote((prevSelectedNote) => ({
                      //   ...prevSelectedNote,
                      //   description: newTitle,
                      //   fileName: newTitle + ".txt",
                      //   modified: true,
                      // }));

                      // emit new title to socket
                      socket.emit("notes-update-title", newTitle);
                    }
                  }}
                >
                  {selectedNote.description}
                </h3> {""}
                <div style={{ display: 'flex' }}>
                  {/* Download button */}
                  <div title="pdf" onClick={downloadPDF} style={{ cursor: 'pointer', marginLeft: "10px" }}>
                    <FontAwesomeIcon icon={faDownload}/> PDF
                  </div>
                  {/* Upload button */}
                  <div title="docx, txt" onClick={() => fileImportRef.current.click()} style={{ cursor: 'pointer', marginLeft: "15px" }}>
                    <FontAwesomeIcon icon={faUpload}/> docx
                  </div>
                </div>
                {/* Import file button */}
                {/* <button onClick={() => fileImportRef.current.click()} style={{ fontSize: "15px" }}>Upload File</button> */}
                {/* {collaborator.map((aUser, index) => (
                  <div className="the-user-container" key={index} style={{marginLeft: "10px"}}>
                    <div className="the-user-avatar" style={{cursor: "pointer"}}>
                      <img
                        className="avatar-picture"
                        src={
                          aUser.avatar && aUser.avatar != ""
                            ? `data:image/jpeg;base64,${aUser.avatar}`
                            : avatarPic
                        }
                        alt="user-avatar-picture"
                        title= {aUser.username}
                      />
                    </div>
                  </div>
                ))} */}
                {/* Display document title */}
                <ReactQuill
                  id="the-notes"
                  modules={module}
                  theme="snow"
                  value={selectedNote.text}
                  // Check if change is made by the current user
                  onChange={(newText, delta, source) => {
                    if (source === "user") {
                      handleQuillChange(newText);
                    }
                  }}
                  ref={editorRef}
                />
                {/* Delete note button */}
                <button
                  className="profile-button"
                  style={{
                    position: "absolute",
                    top: "8px",
                    right: "10px",
                  }}
                  onClick={() => {
                    // Call a function to handle note deletion
                    deleteNote(selectedNote.fileID);
                  }}
                >
                  Delete Note
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <input type="file" ref={fileImportRef} style={{ display: 'none' }} onChange={importDocument} accept=".txt, .docx" />
    </>
  );
}

export default Notebook;
