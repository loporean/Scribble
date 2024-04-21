import logo_transformed from "../images/logoscribble-transformed.png";
import pyramid from "../images/scrib_pyramid.png";
import chat_ex from "../images/chat_ex.png";
import note_ex from "../images/notes_ex.png";
import { Link } from "react-router-dom";
// landing page for the application
function Home() {
  return (
    <>
      <nav id="top" className="purple-nav">
        <div className="container">
          <div className="row h-100">
            <div className="col-6 nav-left my-auto">
              <img
                className="logo"
                src={logo_transformed}
                alt="scribble logo"
              />
            </div>
            <div className="col-6 nav-right my-auto">
              <Link to="/login-page">
                <button className="login-button">Log In</button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <div className="home-container">
        <div className="main-home">
          <div className="intro">
            <h1>Your class, your notes, and</h1>
            <h1>your peers - all in one place.</h1>
            <button className="dark-button">
              Open Scribble in your browser
            </button>
          </div>
        </div>
        <div className="home-1">
          <div className="container the-container">
            <div className="row h-100">
              <div className="col-6 disp-left-1 .text-center my-auto">
                <h1>Who We Are</h1>
                <p>
                  At Scribble, we are passionate about helping grade school and
                  college students across the globe succeed in their studies.
                  Our application blends the best of online chat and note-taking
                  to provide a seamless learning and collaboration experience
                  for students. No more having multiple apps open when working -
                  everything you need is right here.
                </p>
                <h1>Our Team</h1>
                <p>Jarl Ramos - Front-End Developer</p>
                <p>Spencer Denney - Back-End Developer</p>
                <p>Moises Fuentes - Full-Stack Developer</p>
                <p>Aiesha Esa - Database Administrator/Cloud Architect</p>
              </div>
              <div className="col-6 disp-right-1 my-auto">
                <img id="pyr" src={pyramid} alt="Scribble Pyramid Of Success" />
              </div>
            </div>
          </div>
        </div>
        <div className="home-2">
          <div className="container the-container">
            <div className="row h-100">
              <div className="col-6 disp-left-2 .text-center my-auto">
                <h1>Connect to your class with class.</h1>
                <p>
                  Scribble contains a chat room for every class you're taking,
                  where you can touch base with your peers on anything from last
                  week's midterm to upcoming projects.
                </p>
              </div>
              <div className="col-6 disp-right-2 my-auto">
                <img id="c-ex" src={chat_ex} alt="Scribble Chat" />
              </div>
            </div>
          </div>
        </div>
        <div className="home-3">
          <div className="container the-container">
            <div className="row h-100">
              <div className="col-6 disp-left-3 my-auto">
                <img id="n-ex" src={note_ex} alt="Scribble Notes" />
              </div>
              <div className="col-6 disp-right-3 .text-center my-auto">
                <h1>Catch up with ease.</h1>
                <p>
                  Upload and create notes for your classes so you will never
                  miss a beat when studying.
                </p>
              </div>
              <a href="#top">
                <button className="return-top">Return to Top</button>
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
export default Home;
