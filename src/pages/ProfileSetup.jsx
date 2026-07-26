import { useState } from "react";
import "../styles/login.css";

function ProfileSetup() {
  const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
      const [bio, setBio] = useState("");

        function handleContinue() {
            alert("Next: Save profile and open Home.");
              }

                return (
                    <div className="login-screen">
                          <h1>Create Your Profile</h1>

                                <div className="profile-photo-placeholder">
                                        👤
                                              </div>

                                                    <button className="secondary">
                                                            Upload Profile Photo
                                                                  </button>

                                                                        <input
                                                                                type="text"
                                                                                        placeholder="Display Name"
                                                                                                value={displayName}
                                                                                                        onChange={(e) => setDisplayName(e.target.value)}
                                                                                                              />

                                                                                                                    <input
                                                                                                                            type="text"
                                                                                                                                    placeholder="Username"
                                                                                                                                            value={username}
                                                                                                                                                    onChange={(e) => setUsername(e.target.value)}
                                                                                                                                                          />

                                                                                                                                                                <textarea
                                                                                                                                                                        placeholder="Tell everyone about yourself..."
                                                                                                                                                                                rows={4}
                                                                                                                                                                                        value={bio}
                                                                                                                                                                                                onChange={(e) => setBio(e.target.value)}
                                                                                                                                                                                                      />

                                                                                                                                                                                                            <button onClick={handleContinue}>
                                                                                                                                                                                                                    Continue
                                                                                                                                                                                                                          </button>
                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                export default ProfileSetup;