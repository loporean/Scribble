import { Link } from "react-router-dom";

import { useState, useRef, useEffect } from "react";

import axios from "axios";
import { useNavigate } from "react-router-dom";
import ReactCropperElement from "react-cropper";
import Cropper from "react-cropper";
import "cropperjs/dist/cropper.css";

// allows the user to create a new account within the website
function CreateAccount() {
  const [image, setImage] = useState();
  const [cropperState, setCropperState] = useState("none");
  const [imgData, setImgData] = useState();
  const [profileData, setProfileData] = useState();
  const navigate = useNavigate();

  const formData = {
    cropper: useRef(null),
    croppedimg: useRef(null),
    username: useRef(null),
    password: useRef(null),
    email: useRef(null),
  };
  const handleAccount = async (event) => {
    event.preventDefault();
    console.log("hi");
    try {
      const response = await axios.post(
        "http://localhost:3000/create-account",
        {
          username: formData.username.current.value,
          password: formData.password.current.value,
          email: formData.email.current.value,
          croppedimg: formData.croppedimg.current.value,
        }
      );
      console.log(response.data);
      if (response.data.success) {
        // Redirect to the LoggedInComponent
        navigate("/login-page");
      } else {
        alert("error!");
      }
    } catch (error) {
      console.error("Error during login", error);
      //   let errorMSG = document.getElementsByClassName("err-msg-2");
    }
  };
  function emptyImg() {
    setImgData(null);
    setImage(null);
  }
  const onChange = (e) => {
    let files;
    if (e.dataTransfer) {
      files = e.dataTransfer.files;
    } else if (e.target) {
      files = e.target.files;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(files[0]);
  };

  // const cropperRef = useRef<Cropper>(null);
  // console.log(cropperRef)
  const onCrop = () => {
    console.log(formData.cropper);
    const cropper = formData.cropper.current.cropper;
    // console.log(cropper.getCroppedCanvas().toDataURL());
  };

  const getCropData = (event) => {
    event.preventDefault();
    const cropper = formData.cropper.current.cropper;
    setImgData(cropper.getCroppedCanvas().toDataURL());
    console.log(imgData);
    setProfileData(imgData.split(",")[1]);
    console.log(profileData);
  };

  const extractBase = async (img) => {
    let data = img.split(",")[1];
    setProfileData(data);
  };

  useEffect(() => {
    console.log(imgData);
    extractBase(imgData);
  }, [imgData]);

  return (
    <>
      <div className="main-login">
        <div className="center-2 login-panel">
          <div className="spacer-0"></div>
          <h3 id="welcome-create-text">Welcome to Scribble!</h3>
          <div className="spacer-0"></div>
          <form id="create-form" method="POST" encType="multipart/form-data">
            {!image && !imgData && (
              <label
                htmlFor="file"
                id="create-account-button"
                className="buttonPress"
              >
                {imgData ? "Change Profile Picture" : "Upload Profile Picture"}
              </label>
            )}
            {!image && !imgData && (
              <input
                id="file"
                onClick={emptyImg}
                onChange={onChange}
                type="file"
                className="cr-in"
              />
            )}

            {/* CHANGE PROFILE */}
            {imgData && (
              <label
                htmlFor="file"
                onClick={emptyImg}
                id="create-account-button"
                className="buttonPress"
              >
                {imgData ? "Change Profile Picture" : "Upload Profile Picture"}
              </label>
            )}
            {image && !imgData && (
              <button id="create-account-button" onClick={getCropData}>
                Crop
              </button>
            )}
            <br />
            <br />
            <div
              className="cropper"
              style={{ display: image ? "flex" : "none" }}
            >
              {" "}
              {!imgData && (
                <Cropper
                  key={image}
                  src={image}
                  style={{
                    height: 200,
                    width: "100%",
                    visibility: { cropperState },
                    justifySelf: "center",
                  }}
                  // Cropper.js options
                  aspectRatio={1}
                  guides={false}
                  background={false}
                  ref={formData.cropper}
                />
              )}
              {imgData && (
                <div style={{ width: "100%" }}>
                  <img
                    style={{
                      height: 200,
                      visibility: { cropperState },
                    }}
                    src={imgData}
                  />
                </div>
              )}
            </div>
            <input
              type="hidden"
              value={profileData}
              ref={formData.croppedimg}
              name="croppedimg"
            />
            <br />
            <p id="uname-create-text">Create Username</p>
            <input
              type="text"
              className="cr-in"
              id="username"
              name="username"
              ref={formData.username}
            />
            <div className="spacer-0"></div>
            <p id="ps-create-text">Create Password</p>
            <input
              type="password"
              className="cr-in"
              id="password"
              name="password"
              ref={formData.password}
            />
            <div className="spacer-0"></div>
            <p id="ps-create-text">Email</p>
            <input
              type="text"
              className="cr-in"
              id="email"
              name="email"
              ref={formData.email}
            />
            {/* <div className="spacer-0"></div>
            <p id="ps-confirm-text">Confirm Password</p>
            <input type="password" className="cr-in" id="ps-confirm-input" /> */}
          </form>
          <div className="spacer-0"></div>
          <Link to="/chatroom">
            <button id="create-account-button" onClick={handleAccount}>
              Sign Up
            </button>
          </Link>
          <div className="spacer-0"></div>
          <Link to="/login-page">Have an account? Log In!</Link>
          <div className="spacer-0"></div>
        </div>
      </div>
    </>
  );
}

export default CreateAccount;
