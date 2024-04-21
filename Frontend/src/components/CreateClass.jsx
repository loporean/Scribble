import { useState, useEffect } from "react";
import { Modal, Box, Button, Select, MenuItem, Input } from "@mui/material";
import axios from "axios";
// import { create } from "@mui/material/styles/createTransitions";

function CreateClass({ onClose, classes }) {
  const [displayProfile, setDisplayProfile] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [className, setClassName] = useState("");
  const [description, setDescription] = useState("");

  // Create a class
  const createClass = async (req, res) => {
    try {
      // Verify the class name
      const classVerified = await verifyClassName();
      if (classVerified) {
        // Check to make sure that the user wants to create this class
        const confirmed = window.confirm(
          `Are you sure you want to create the class with the following details?\nClass Name: ${className}\nDescription: ${description}`
        );
        if (confirmed) {
          const response = await axios.post(
            "http://localhost:3000/create-class",
            {
              className: className,
              description: description,
            }
          );
          console.log("classID:", response.data.classID);
          // Add user to the created class
          await axios.post("http://localhost:3000/add-class", {
            classID: response.data.classID,
          });
          // Refresh browser to show changes
          window.location.reload();
        }
      } else {
        return;
      }
    } catch (error) {
      console.error("Error creating class", error);
    }
  };

  // Make sure the class name is not already taken
  const verifyClassName = async (req, res) => {
    try {
      const { data } = await axios.get("http://localhost:3000/classes");
      const classExists = data.classData.some(
        (item) => item.className === className
      );
      if (classExists) {
        console.log("Class already exists");
        setErrorMessage("Class name already exists");
        return false;
      } else {
        setErrorMessage("");
        return true;
      }
    } catch (error) {
      console.error("Error adding owner to class:", error);
      setErrorMessage("Error verifying class name");
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!className.trim()) {
      console.error("Class name is required");
      return;
    }
    await createClass();
    setClassName("");
    setDescription("");
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
              <h4>Create a Class</h4>
              <h6>Class Name</h6>
              <input
                type="text"
                value={className}
                // onChange={getClassName}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Enter class name"
                required
              />
              <h6>
                <br />
                Description (optional)
              </h6>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter class description"
              />
              <br />
              <br />
              <button
                variant="contained"
                color="primary"
                // onClick={createClass}
                // onClick={verifyClassName}
                onClick={handleSubmit}
                style={{ width: "18%", marginTop: "44%", marginRight: "10%" }}
                className="profile-button"
              >
                Create
              </button>
              <br />
              {errorMessage && <p style={{ color: "red" }}>{errorMessage}</p>}
            </div>
          </Box>
        </Modal>
      )}
    </>
  );
}

export default CreateClass;
