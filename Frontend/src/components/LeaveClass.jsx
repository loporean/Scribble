import { useState, useEffect } from "react";
import { Modal, Box, Button, Select, MenuItem } from "@mui/material";
import axios from "axios";

function LeaveClass({ onClose, classes }) {
  const [displayProfile, setDisplayProfile] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  const [showLeaveButton, setShowLeaveButton] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Remove user from class
  const leaveClass = async (req, res) => {
    try {
      // Remove user from classList table
      await axios.post("http://localhost:3000/leave-class", {
        classID: selectedClass.classID,
      });
      // Refresh browser to show changes
      window.location.reload();
    } catch (error) {
      console.error("Error adding user to class", error);
    }
  };

  // Grab userID (userid passed to login page)
  const handleSubmit = async () => {
    try {
      // Grab userID from sessionStorage
      const userDataJSON = sessionStorage.getItem("userData");
      const userData = JSON.parse(userDataJSON);
      const userID = userData.userID;
      console.log("userID:", userID);
      const selectedOwnerID = selectedClass.ownerID;
      console.log("ownerID:", selectedOwnerID);

      // If the userID and the ownerID match, do not allow user to leave class
      // Owner of course can only leave class if they remove entire course
      // (For now. May implement passing of ownership later)
      if (selectedOwnerID !== userID) {
        setErrorMessage("");
        leaveClass();
      } else {
        setErrorMessage("Owner cannot leave class");
        return;
      }
    } catch (error) {
      console.error("Error grabbing user info:", error);
    }
  };

  useEffect(() => {
    setDisplayProfile(true);
    openUserProfile();
  }, []);

  function openUserProfile() {
    setDisplayProfile(true);
  }

  function closeUserProfile() {
    setDisplayProfile(false);
    onClose();
  }

  const handleClassChange = (event) => {
    setSelectedClass(event.target.value);
    setShowLeaveButton(event.target.value !== "");
  };

  return (
    <>
      {displayProfile && (
        <Modal open={true} onClose={closeUserProfile} id="the-user-profile">
          <Box
            sx={{
              maxWidth: "500px",
              margin: "auto",
              marginTop: "50px",
              padding: "20px",
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            <div className="user-profile-content">
              {/* List user's classes */}
              <h4 style={{ marginRight: "15%" }}>Leave A Class</h4>
              <Select
                value={selectedClass}
                onChange={handleClassChange}
                sx={{
                  width: "60%",
                  height: "50px",
                  marginBottom: "20px",
                  marginRight: "15%",
                  outline: "none",
                  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ffff90", // Change the border color when focused
                  },
                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ffff90", // Change the border color on hover
                  },
                  ".MuiOutlinedInput-notchedOutline": {
                    borderColor: "#ffff90", // Change the default border color
                  },
                }}
              >
                <MenuItem value="">
                  <em>--</em>
                </MenuItem>
                {classes.map((classInSchool) => (
                  <MenuItem key={classInSchool.classID} value={classInSchool}>
                    {classInSchool.className}
                  </MenuItem>
                ))}
              </Select>
              <br />
              {showLeaveButton && (
                <button
                  variant="contained"
                  color="primary"
                  onClick={handleSubmit}
                  style={{ width: "17%", marginTop: "10%", marginRight: "1%" }}
                  className="profile-button"
                >
                  Leave
                </button>
              )}
              <br />
              {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            </div>
          </Box>
        </Modal>
      )}
    </>
  );
}

export default LeaveClass;
