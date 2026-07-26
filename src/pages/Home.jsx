import "../styles/login.css";

function Home() {
  return (
      <div className="login-screen">

            <h3 className="welcome-title">
                    Welcome to
                          </h3>

                                <h1 className="logo-title">
                                        21<span className="logo-sup">st</span> Social
                                              </h1>

                                                    <p className="tagline">
                                                            Create • Connect • Collaborate
                                                                  </p>

                                                                        <div className="progress-card">
                                                                                <h3>Complete Your Journey</h3>

                                                                                        <div className="progress-bar">
                                                                                                  <div className="progress-fill"></div>
                                                                                                          </div>

                                                                                                                  <p>25% Complete</p>
                                                                                                                        </div>

                                                                                                                              <button className="secondary home-card">
                                                                                                                                      ✨ Finish Your Profile
                                                                                                                                            </button>

                                                                                                                                                  <button className="secondary home-card">
                                                                                                                                                          👥 Find Friends
                                                                                                                                                                </button>

                                                                                                                                                                      <button className="secondary home-card">
                                                                                                                                                                              🌎 Discover Communities
                                                                                                                                                                                    </button>

                                                                                                                                                                                          <button className="secondary home-card">
                                                                                                                                                                                                  🎥 Create Your First Post
                                                                                                                                                                                                        </button>

                                                                                                                                                                                                              <p className="coming-soon">
                                                                                                                                                                                                                      Your community is waiting...
                                                                                                                                                                                                                            </p>

                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                  export default Home;