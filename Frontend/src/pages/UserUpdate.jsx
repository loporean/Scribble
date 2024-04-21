import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function UserUpdate() {
  const navigate = useNavigate();
  const formData = useRef(null);

  const [name, setName] = useState(null);
  const [userType, setUserType] = useState(null);
  const [email, setUserEmail] = useState(null);
  const [username, setUsername] = useState(null);

  // User update page nav
  const resetPassword = async (e) => {
    e.preventDefault();
    try {
      window.location.href = "/reset-password";
    } catch (error) {
      console.error("Error", error);
    }
  };

  // Grabs the user info to display for user
  const userInfo = async () => {
    try {
      const response = await axios.get("http://localhost:3000/user-info");

      const { username, email, password, user_id, userType, name } =
        response.data[0];

      // Hold user info
      if (name === null) {
        setName("(Enter Name)");
      } else {
        setName(name);
      }
      if (email === "") {
        setUserEmail("Anonymous");
      } else {
        setUserEmail(email);
      }
      if (username === "") {
        setUsername("Anonymous");
      } else {
        setUsername(username);
      }
      setUserType(userType);

      // Display user info to console
      // to make sure info is correct
      // (PRESS UPDATE BUTTON TO TEST)
      console.log(`
        Name: ${name},
        Username: ${username},
        Email: ${email},
        Type: ${userType}
        `);
    } catch (error) {
      console.log("Error fetching user info:", error);
    }
  };

  // Update user profile from user profile page
  const updateUser = async () => {
    try {
      // Get the updated user input from the form
      const name = formData.current.elements.name.value;
      const username = formData.current.elements.username.value;
      const email = formData.current.elements.email.value;

      // Send a POST request to update the user information
      await axios.post("http://localhost:3000/update-user-info", {
        name,
        username,
        email,
      });

      // Optionally, you can handle success or update UI accordingly
      console.log("User information updated successfully!");
      alert("Profile Updated!");
      // Clear form data after successful input
      userInfo();
    } catch (error) {
      // Display alert with error message
      alert(error.response.data);
    }
    // Clear form data after submit
    formData.current.reset();
  };

  useEffect(() => {
    userInfo();
  }, []);

  return (
    <>
      <div className="main-login">
        <div className="center-2 login-panel">
          <div className="spacer-0"></div>
          <h3 id="welcome-create-text">User Profile</h3>
          <div className="spacer-0"></div>

          <form id="create-form" ref={formData} method="POST">
            {/* Update Name */}
            <p id="uname-create-text">Name</p>
            <input
              type="text"
              className="cr-in"
              id="name"
              name="name"
              placeholder={name}
            />

            <div className="spacer-0"></div>
            {/* Update Username */}
            <p id="ps-create-text">Username</p>
            <input
              type="text"
              className="cr-in"
              id="username"
              name="username"
              placeholder={username}
            />

            <div className="spacer-0"></div>
            {/* Update Email */}
            <p id="ps-create-text">Email</p>
            <input
              type="text"
              className="cr-in"
              id="email"
              name="email"
              placeholder={email}
            />

            {/* <div className="spacer-0"></div>
            <p id="ps-confirm-text">Confirm Password</p>
            <input type="password" className="cr-in" id="ps-confirm-input" /> */}
          </form>
          <div className="spacer-0"></div>

          <button className="reset-password" onClick={resetPassword}>
            Reset Password
          </button>

          <div className="spacer-0"></div>

          <button id="create-account-button" onClick={updateUser}>
            Update Profile
          </button>

          <div className="spacer-0"></div>
          <Link to="/chatroom">Home</Link>
          <div className="spacer-0"></div>
        </div>
      </div>
    </>
  );
}

export default UserUpdate;
