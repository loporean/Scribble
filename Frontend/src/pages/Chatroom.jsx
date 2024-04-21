import Navbar from "../components/Navbar.jsx";
import Sidebar from "../components/Sidebar.jsx";
import Userbar from "../components/Userbar.jsx";
import axios from "axios";
import moment from "moment"; // For timestamp
import { useEffect, useState, useRef } from "react";
import socket from "../components/Socket.jsx";
import emptyPic from "../images/huh_what.png";
import avatarPic from "../images/default_pic.png";
// GIPHY SDK code
//+++++++++++++++++++++++++++++++++++++++++++++++++
// import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
//+++++++++++++++++++++++++++++++++++++++++++++++++

function Chatroom({
  room,
  setRoom,
  classes,
  setClasses,
  chats,
  setChats,
  username,
  setUsername,
  activeUsers,
  setActiveUsers,
  inactiveUsers,
  setInactiveUsers,
  notePages,
  setNotes,
  selectedNote,
  setSelectedNote,
  classNotes,
  setClassNotes,
}) {
  console.log("YOOOO", room);
  // Message State
  const [message, setMessage] = useState(null);
  // Typing State
  const [typing, setTyping] = useState([]);

  // GIPHY
  //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  const [showGiphyPopup, setShowGiphyPopup] = useState(false);
  const [selectedGif, setSelectedGif] = useState(null);
  const [gifs, setGifs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const giphyFetch = new GiphyFetch('7nPk2WhT8IBxootuOo954A0bpDpESPac');
  const gifPopupRef = useRef(null);

  useEffect(() => {
    // Event listener to detect clicks outside popup
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      // Remove event listener when component unmounts
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    // Fetch trending GIFs
    fetchTrendingGifs();
  }, []);
  
  const fetchTrendingGifs = async () => {
    const { data } = await giphyFetch.trending();
    setGifs(data);
  };
  
  const searchGifs = async () => {
    // Check for whitespace or empty text
    if (searchQuery.trim() !== '') {
      const { data } = await giphyFetch.search(searchQuery);
      setGifs(data);
    } else {
      // Show trending gifs
      fetchTrendingGifs();
    }
  };
  
  const handleGifSelect = (gif) => {
    setSelectedGif(gif);

    setShowGiphyPopup(false);
    setSearchQuery(''); 
  };

  // Closes popup when clicking outside of box
  // OR When clicking gif button again
  const handleClickOutside = (event) => {
    if (
      gifPopupRef.current &&
      !gifPopupRef.current.contains(event.target) &&
      !event.target.classList.contains("overlay-button")
    ) {
      setShowGiphyPopup(false);
      // Clear the search query when popup closes
      setSearchQuery(''); 
    }
  };

  // Allow user to press enter for search for gifs
  const handleGifKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchGifs();
    }
  };

  useEffect(() => {
    console.log("Gif:", selectedGif);
  }, [selectedGif]);
  //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  
  // // Get avatar data for all users
  // const getAvatarData = async () => {
    //   try {
      //     // Fetch avatar data
      //     const response = await axios.get("http://localhost:3000/user-avatars");
      //     const formattedData = response.data.avatarData.map((item) => ({
        //       // Grab message data
        //       avatar: item.avatar,
        //       username: item.username,
        //       userID: item.userID,
        //     }));
        //     console.log("avatar data:", formattedData);
  //     console.log("chat data:", chats);
  //     // setAvatar(formattedData);
  //   } catch (error) {
  //     console.error("Error fetching avatar data:", error);
  //   }
  // };

  // Load the user avatars from session storage
  const avatarData = JSON.parse(sessionStorage.getItem("avatarData")) || null;

  useEffect(() => {
    console.log("avatar data:", avatarData);
  }, [])

  function get_time(timestamp) {
    const date = new Date(timestamp);
    const returnedDate = date.toLocaleDateString("en-US");
    const returnedTime = date.toLocaleTimeString("en-US");
    const timeString = returnedDate.concat(" ", returnedTime);
    return timeString;
  }

  // Function to get base64 encoded avatar for user
  const getAvatarForUser = (userID) => {
    // Find user in the avatar state by userID
    const userAvatar = avatarData.find(user => user.userID === userID);
    // If user found in avatar state, return the avatar base64 string
    return userAvatar ? `data:image/png;base64,${userAvatar.avatar}` : avatarPic;
  };

  // Reference for chat container
  const chatContainerRef = useRef(null);

  function show_chats() {
    console.log(chats.length);

    return (
      <div ref={chatContainerRef} className="chat-container">
        {chats.map((chat, index) => (
          <div key={index} className="chat-panel">
            <div className="container-fluid the-chat-div rounded-0">
              <div className="flexed-container">
                <div className="avatar-body">
                  <img
                    className="avatar-picture"
                    // src={`${chat.profilePic}`}
                    // src={chat.profilePic && chat.profilePic !== "" ? `data:image/png;base64,${chat.profilePic}` : avatarPic}
                    src={getAvatarForUser(chat.userID)}
                    // src={
                    //   chat.profilePic && chat.profilePic !== ""
                    //     ? `data:image/png;base64,${chat.profilePic}`
                    //     : avatarPic
                    // }
                    alt="avatar-picture"
                  />
                </div>
                <div className="container-body">
                  <p className="full-datetime">{get_time(chat.timestamp)}</p>
                  <p className="user-text">{chat.username}</p>
                  <p className="text-content">{chat.text}</p>
                  {chat.gif !== null && (
                    <img src={chat.gif}/>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Function to scroll to the bottom of the chat container
  function scrollToBottom() {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }

  let dummyCallback = (data) => {
    return data;
  };

  // Grab username from session storage (data disappears when browser is closed)
  const storedData = JSON.parse(sessionStorage.getItem("userData")); // Grab object

  function handleKeyDown(event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  }

  // Shows the user's own message
  function userMsg(gifUrl) {
    const curChat = {
      username: "(Me) " + storedData.username,
      userID: storedData.userID,
      text: message,
      timestamp: Date.now(),
      profilePic:
        storedData.avatar !== null
          ? storedData.avatar.toString()
          : storedData.avatar,
      gif: gifUrl,
    };
    setChats((prevChats) => [...prevChats, curChat]); //update local chat
  }

  const sendMessage = async () => {
    let gifUrl = null;
    if (selectedGif && selectedGif.images && selectedGif.images.fixed_height && selectedGif.images.fixed_height.url) {
      gifUrl = selectedGif.images.fixed_height.url;
    }
    console.log("gifUrl:", gifUrl);
    // If message empty, do nothing (allows for whitespace)
    // if (message.trim() !== '' || message !== '') {
    if (/\S/.test(message) || (selectedGif && selectedGif.length !== 0)) {
      // Clear the textarea value after submit
      document.getElementById("txt").value = "";
      setMessage("");
      // Stops page from refreshing on submission
      // event.preventDefault();
      userMsg(gifUrl);
      // Send username and message
      socket.emit("send_message", {
        username: storedData.username,
        userID: storedData.userID,
        message,
        avatar:
          storedData.avatar !== null
            ? storedData.avatar.toString()
            : storedData.avatar, // Include avatar in the message data
        gif: gifUrl,
      });
      // Update chatroom for class
      // Need the current classID (got it)
      console.log("Current classID: ", room.ID);
      const classID = room.ID;
      await axios.post("http://localhost:3000/insert-message", {
        message: message,
        gif: gifUrl,
        timestamp: moment().format("YYYY-MM-DD HH:mm:ss"),
        classID: classID,
      });
      // Clear selected gif
      setSelectedGif([]);
    }
  };

  // Typing
  function userTyping() {
    // emit username
    socket.emit("typing", username);
  }

  // Clear textarea when switching tabs
  function clearText() {
    const textarea = document.getElementById("txt");
    if (textarea) {
      textarea.value = ""; // Clear value of textarea
    }
  }

  useEffect(() => {
    clearText();
    setSelectedGif([]);
    scrollToBottom();
  }, [chats]);

  useEffect(() => {
    socket.on(
      "receive_message",
      (data) => {
        console.log("LETSGOOO", data);
        const newChat = {
          username: data.username,
          userID: data.userID,
          text: data.message,
          timestamp: Date.now(),
          profilePic: data.avatar,
          gif: data.gif,
        };
        // Update chats
        setChats((prevChats) => [...prevChats, newChat]);
      },
      []
    );

    // Users typing in chatroom
    socket.on("is_typing", (data) => {
      // Update typing users array based on previous state
      setTyping(data);
    });

    socket.on("clear_typing", (data) => {
      setTyping([]);
    });

    // User joined
    // *** Display message + username when user joins a room ***
    socket.once("user joined", (data) => {
      // const joined = {
      //   username: null,
      //   text: "User Joined",
      //   timestamp: Date.now()
      // };
      // setChats((prevChats) => [...prevChats, joined]);
    });

    // User left
    // *** Display message + username when user leaves a room ***
    socket.once("user left", (data) => {
      // const left = {
      //   username: null,
      //   text: "User Left",
      //   timestamp: Date.now()
      // };
      // setChats((prevChats) => [...prevChats, left]);
    });

    return () => {
      socket.off("receive_message");
      socket.off("user joined");
      socket.off("user left");
      socket.off("is_typing");
    };
  }, [socket, message]);

  return (
    <>
      {/* Pass props to Navbar component */}
      <Navbar
        room={room}
        setRoom={setRoom}
        classes={classes}
        setClasses={setClasses}
        chats={chats}
        setChats={setChats}
        username={username}
        setUsername={setUsername}
      />
      <div className="container-fluid">
        <div className="row no-gutters">
          <div className="col-2 column1">
            <Sidebar
              parentCallback={dummyCallback}
              notePages={notePages}
              setNotes={setNotes}
              selectedNote={selectedNote}
              setSelectedNote={setSelectedNote}
              classes={classes}
              chats={chats}
              room={room}
              username={username}
              classNotes={classNotes}
              setClassNotes={setClassNotes}
            />
          </div>
          <div className="col-8 column2">
            <div id="chat-window">{show_chats()}</div>
            {/* Only display chatbox and submit if user belongs to a class */}
            {classes && classes.length > 0 && (
              <form className="the-chat-form">
                <div id="the-textarea" className="container-fluid">
                  {/* Added functionality for submitting */}
                  {selectedGif && selectedGif.length !== 0 && (
                    <img 
                      className="dispaly-gif"
                      src={selectedGif.images.fixed_height.url} 
                      alt="Selected GIF"
                    />
                  )}
                  <textarea
                    id="txt"
                    onChange={(event) => {
                      setMessage(event.target.value);
                      userTyping();
                    }}
                    onKeyDown={handleKeyDown}
                    style={{
                      resize: "none",
                      height: "45px",
                      // height: "145px",
                      borderRadius: "8px",
                      outline: "none",
                      boxShadow: "0 0 0 transparent",
                      padding: "8px",
                      overflow: "hidden",
                    }}
                    // Colored outline and shadow when textarea clicked
                    onFocus={(event) => {
                      event.target.style.outline = "2px purple";
                      event.target.style.boxShadow = "0 0 5px rgb(65, 65, 102)";
                    }}
                    onBlur={(event) => {
                      event.target.style.outline = "none";
                      event.target.style.boxShadow = "0 0 0 transparent";
                    }}
                    placeholder={"Message in " + room.Name}
                    required
                  ></textarea>
                </div>
                <div
                  id="chat-text-btn"
                  className="container-fluid"
                  style={{
                    width: "65%",
                    marginLeft: "0px",
                    marginTop: "-55px",
                    position: "fixed",
                  }}
                >
                  {/* Send the message after entering */}
                  <button onClick={sendMessage} id="send-button">
                    Send
                  </button>
                  {typing && typing.length > 0 && (
                    <div
                      className="typing-container"
                      style={{ marginTop: "-12px" }}
                    >
                      <div className="typing">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                      <p style={{ marginTop: "20px" }}>
                        <b>{typing}</b> is typing...
                      </p>
                    </div>
                  )}
                </div>
              </form>
            )}
            {/* Show button if user is in at least one class */}
            {classes && classes.length > 0 && (
              <div className="overlay-button-container">
                <button className="overlay-button" onClick={() => setShowGiphyPopup(!showGiphyPopup)}>GIF</button>
              </div>
            )}
            {showGiphyPopup && (
              <div className="giphy-popup-container">
                <div 
                  className="giphy-popup"
                  ref={gifPopupRef}
                  style={{ display: showGiphyPopup ? "block" : "none" }}
                >
                  {/* Search bar and button fixed at top */}
                  <div style={{ position: "fixed" }}>
                    <input
                      style={{ borderRadius: "3px", marginBottom: "5px", marginRight: "5px" }}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={handleGifKeyPress}
                      placeholder="Search GIFs..."
                    />
                    <button className="gif-search-button" onClick={searchGifs}>Search</button>
                  </div>
                  <div className="gif-container">
                    {gifs.map((gif) => (
                      <img
                        key={gif.id}
                        src={gif.images.fixed_height.url}
                        alt={gif.title}
                        onClick={() => handleGifSelect(gif)}
                        style={{ cursor: "pointer", marginTop: "40px" }}
                        className="glow"
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
            {classes && classes.length === 0 && (
              <div className="fade-in-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img 
                  src={emptyPic} 
                  alt="Empty" 
                  className="fade-in-image" 
                  style={{ 
                    maxWidth: '100%', 
                    height: 'auto',
                    marginTop: '20%',
                  }} 
                />
                <p className="fade-in-text"
                  style={{ 
                    textAlign: 'center',
                    marginTop: "20px",
                    marginLeft: "5px",
                    fontFamily: "Montserrat",
                    fontWeight: "bold",
                    fontSize: "20px"
                  }}
                >It looks like you don't have any classes.</p>
              </div>
            )}

          </div>
          <div className="col-2 column3">
            <Userbar
              activeUsers={activeUsers}
              setActiveUsers={setActiveUsers}
              inactiveUsers={inactiveUsers}
              setInactiveUsers={setInactiveUsers}
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default Chatroom;