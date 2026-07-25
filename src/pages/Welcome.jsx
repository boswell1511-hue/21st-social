import { useState } from "react";
import AnimatedLogo from "../components/AnimatedLogo";
import "../styles/welcome.css";
import Login from "./Login";

function Welcome() {
  const [showLogin, setShowLogin] = useState(false);

    if (showLogin) {
        return <Login />;
          }

            return (
                <div
                      className="welcome-screen"
                            onClick={() => setShowLogin(true)}
                                >
                                      <AnimatedLogo />

                                            <h1>21st Social</h1>

                                                  <p>Create • Connect • Collaborate</p>

                                                        <span className="tap-text">
                                                                Tap anywhere to begin
                                                                      </span>
                                                                          </div>
                                                                            );
                                                                            }

                                                                            export default Welcome;