import { useState } from "react";
import "../styles/login.css";

function ProfileSetup({ onContinue }) {
  const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
      const [bio, setBio] = useState("");

        function handleContinue() {
            if (!displayName.trim()) {
                  alert("Please enter a display name.");
                        return;
                            }

                                if (!username.trim()) {
                                      alert("Please choose a username.");
                                            return;
                                                }

                                                    onContinue();
                                                      }

                                                        return (
                                                            <div className="login-screen">
                                                                  <h1>Create Your Profile</h1>

                                                                        <div
                                                                                className="profile-photo-placeholder"
                                                                                        onClick={() => alert("Profile photo upload coming soon!")}
                                                                                              >
                                                                                                      👤
                                                                                                            </div>

                                                                                                                  <button
                                                                                                                          className="secondary"
                                                                                                                                  onClick={() => alert("Profile photo upload coming soon!")}
                                                                                                                                        >
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
                                                                                                                                                                                                                                                            className="bio-field"
                                                                                                                                                                                                                                                                    placeholder="Tell the community a little about yourself, your interests, or what you're passionate about..."
                                                                                                                                                                                                                                                                            rows={5}
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