import {Outlet, Link} from "react-router-dom";
// allows the user to login to the web application
function Login() {
    return (
        <>
            <div className="spacer-0"></div>
            <h3 id="welcome-text">Welcome back!</h3>
            <div className="spacer-0"></div>
            <p id="uname-text">Username</p>
            <input type="text" id="uname-input"/>
            <div className="spacer-0"></div>
            <p id="ps-text">Password</p>
            <input type="password" id="ps-input"/>
            <div className="spacer-0"></div>
            <Link to="chatroom">
                <button id="log-page-button" onclick="sign_in()">Log In</button>
            </Link>
            <div className="spacer-0"></div>
            <Link to="create-account">No account? Create one!</Link>
            <div className="spacer-0"></div>
        </>
    );
  }

export default Login;