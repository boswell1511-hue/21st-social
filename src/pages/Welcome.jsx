import AnimatedLogo from "../components/AnimatedLogo";
import "../styles/welcome.css";

function Welcome({ onContinue }) {
  return (
      <div
            className="welcome-screen"
                  onClick={onContinue}
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