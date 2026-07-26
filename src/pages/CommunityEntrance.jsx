import "../styles/login.css";

function CommunityEntrance({ onEnter }) {
  return (
      <div className="login-screen">
            <h1 className="community-title">
                    🎉 Welcome to
                      <br />
                        the Community!
                        </h1>

                  <p>
                          Your profile is ready.
                                </p>

                                      <p>
                                              Thank you for becoming part of 21st Social.
                                                    </p>

                                                          <h3>Create • Connect • Collaborate</h3>

                                                                <button onClick={onEnter}>
                                                                        Enter 21st Social
                                                                              </button>
                                                                                  </div>
                                                                                    );
                                                                                    }

                                                                                    export default CommunityEntrance;