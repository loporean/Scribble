import { useEffect, useState } from "react";
import socket from "../components/Socket.jsx";
import avatarPic from "../images/default_pic.png";

function Userbar({
  activeUsers,
  setActiveUsers,
  inactiveUsers,
  setInactiveUsers,
}) {
  // Grab username object from session storage
  const storedData = JSON.parse(sessionStorage.getItem("userData"));
  useEffect(() => {
    socket.connect();
    // Send the username to socket.io ('username')

    socket.emit("login", storedData.username, storedData.avatar);

    // Receive updated list of active users
    socket.on("activeUsers", (users) => {
      setActiveUsers(users);
      // Save active and inactive users to session storage
      // sessionStorage.setItem("activeUsers", JSON.stringify(users));
    });

    // Receive updated list of inactive users
    socket.on("inactiveUsers", (users) => {
      setInactiveUsers(users);
      // Save inactive users to session storage
      // sessionStorage.setItem("inactiveUsers", JSON.stringify(users));
    });

    // Clean up the socket listener
    return () => {
      socket.off("activeUsers");
      socket.off("inactiveUsers");
    };
  }, [socket]);

  return (
    <>
      <div className="the-user-column">
        <ul className="active-users">
          <h5>Online - {activeUsers.length}</h5>
          {activeUsers.map((aUser, index) => (
            <div className="the-user-container" key={index}>
              <div className="the-user-avatar">
                <img
                  className="avatar-picture"
                  src={
                    aUser.avatar && aUser.avatar != ""
                      ? `data:image/jpeg;base64,${aUser.avatar}`
                      : avatarPic
                  }
                  alt="user-avatar-picture"
                />
              </div>
              <li key={index}>{aUser.username}</li>
            </div>
          ))}
        </ul>
        <ul className="inactive-users">
          <h5>Offline - {inactiveUsers.length}</h5>
          {inactiveUsers.map((iUser, index) => (
            <div className="the-user-container" key={index}>
              <div className="the-user-avatar">
                <img
                  className="avatar-picture"
                  src={
                    iUser.avatar && iUser.avatar != ""
                      ? `data:image/jpeg;base64,${iUser.avatar}`
                      : avatarPic
                  }
                  alt="user-avatar-picture"
                />
              </div>
              <li key={index}>{iUser.username}</li>
            </div>
          ))}
        </ul>
      </div>
    </>
  );
}

export default Userbar;
