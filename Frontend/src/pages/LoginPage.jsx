import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import socket from "../components/Socket.jsx";

// page for logging in
function LoginPage() {
  const navigate = useNavigate();
  const formData = useRef(null);
  const [loginFail, setLoginFail] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    console.log("hi");
    try {
      const response = await axios.post("http://localhost:3000/login", {
        username: formData.current.username.value,
        password: formData.current.password.value,
        withCredentials: true,
      });
      if (response.data.success) {
        console.log(response.data);
        // Store username in sessionStorage
        // Using username returned from database
        const dataToStore = {
          username: response.data.username,
          avatar: response.data.avatar,
          userID: response.data.userID,
        };
        sessionStorage.setItem("userData", JSON.stringify(dataToStore));

        // Send the username to socket.io ('username')
        // socket.emit("login", response.data.username, response.data.avatar);

        // Fetch avatar data
        const response2 = await axios.get("http://localhost:3000/user-avatars");
        const avatarData = response2.data.avatarData.map((item) => ({
          // Grab message data
          avatar: item.avatar,
          username: item.username,
          userID: item.userID,
        }));
        sessionStorage.setItem("avatarData", JSON.stringify(avatarData));

        // Redirect to the chatroom
        navigate("/chatroom");
      } else {
        // Failed login
        setLoginFail(true);
      }
    } catch (error) {
      console.error("Error during login", error);
      // let errorMSG = document.getElementsByClassName("err-msg-2");
    }
  };
  return (
    <>
      <div className="main-login">
        <div className="center-2 login-panel">
          <div className="spacer-0"></div>
          <h3 id="welcome-text">Welcome back!</h3>
          <div className="spacer-0"></div>
          <form id="login-form" ref={formData} method="POST">
            <label id="uname-text">Username</label>
            <br />
            <input name="username" type="text" id="name" />
            <div className="spacer-0"></div>
            <label id="ps-text">Password</label>
            <br />
            <input name="password" type="password" id="password" />

            <div className="spacer-0"></div>
            <button id="log-page-button" onClick={handleLogin}>
              Log In
            </button>
          </form>
          <div className="spacer-0"></div>
          <Link to="/create-account">No account? Create one!</Link>
          <div className="spacer-0"></div>
          <p className="err-msg-1">The account doesn't exist!</p>
          <p className="err-msg-2">Incorrect password!</p>
          {loginFail && (
            <p className="err-msg-3show">
              Incorrect username
              <br />
              or password.
            </p>
          )}
          <div className="spacer-0"></div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
