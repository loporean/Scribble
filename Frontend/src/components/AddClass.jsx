import { useState, useEffect } from "react";
import { Modal, Box, Button, Select, MenuItem } from "@mui/material";
import axios from "axios";

function AddClass({ onClose, classes }) {
  const [displayProfile, setDisplayProfile] = useState(true);
  const [selectedClass, setSelectedClass] = useState("");
  // State for available classes for user
  const [classList, setClassList] = useState([]);
  const [showAddButton, setShowAddButton] = useState(false);

  // Query for classes user is not in
  const availableClasses = async (req, res) => {
    try {
      const response = await axios.get(
        "http://localhost:3000/available-classes"
      );
      const formattedData = response.data.classData.map((item) => ({
        // Grab message data
        classID: item.classID,
        className: item.className,
      }));
      setClassList(formattedData);
    } catch (error) {
      console.error("Error fetching available classes:", error);
    }
  };

  // Add user to class
  const addClass = async (req, res) => {
    try {
      await axios.post("http://localhost:3000/add-class", {
        classID: selectedClass,
      });
      // Refresh browser to show changes
      window.location.reload();
    } catch (error) {
      console.error("Error adding user to class", error);
    }
  };

  useEffect(() => {
    setDisplayProfile(true);
    openUserProfile();
    availableClasses();
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
    setShowAddButton(event.target.value !== "");
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
              <h4 style={{ marginRight: "15%" }}>Join A Class</h4>
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
                {classList.map((classInSchool) => (
                  <MenuItem
                    key={classInSchool.classID}
                    value={classInSchool.classID}
                  >
                    <div add-class-selection>{classInSchool.className}</div>
                  </MenuItem>
                ))}
              </Select>
              <br />
              {showAddButton && (
                <button
                  variant="contained"
                  color="primary"
                  onClick={addClass}
                  style={{ width: "15%", marginTop: "10%", marginRight: "1%" }}
                  className="profile-button"
                >
                  Add
                </button>
              )}
              {/* <ul style={{ listStyleType: 'none', padding: 0 }}>
                {classList.map((classInSchool, index) => (
                    <li key={index}>
                    <label style={{ userSelect: "none" }}>
                        {classInSchool.className}
                    </label>
                    </li>
                ))}
              </ul> */}
              <br />
            </div>
          </Box>
        </Modal>
      )}
    </>
  );
}

export default AddClass;
