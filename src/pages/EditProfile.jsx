import { useEffect, useState } from "react";
import ProfileService from "../services/profile/ProfileService";
import "../styles/login.css";

function EditProfile({ onBack }) {
  const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
      const [bio, setBio] = useState("");
        const [saving, setSaving] = useState(false);

          useEffect(() => {
              loadProfile();
                }, []);

                  async function loadProfile() {
                      try {
                            const profile = await ProfileService.getProfile();

                                  if (!profile) {
                                          alert("Profile not found.");
                                                  onBack();
                                                          return;
                                                                }

                                                                      setDisplayName(profile.display_name || "");
                                                                            setUsername(profile.username || "");
                                                                                  setBio(profile.bio || "");
                                                                                      } catch (error) {
                                                                                            alert(error.message);
                                                                                                }
                                                                                                  }

                                                                                                    async function saveProfile() {
                                                                                                        if (!displayName.trim()) {
                                                                                                              alert("Display Name is required.");
                                                                                                                    return;
                                                                                                                        }

                                                                                                                            if (!username.trim()) {
                                                                                                                                  alert("Username is required.");
                                                                                                                                        return;
                                                                                                                                            }

                                                                                                                                                setSaving(true);

                                                                                                                                                    try {
                                                                                                                                                          await ProfileService.updateProfile({
                                                                                                                                                                  display_name: displayName,
                                                                                                                                                                          username,
                                                                                                                                                                                  bio,
                                                                                                                                                                                        });

                                                                                                                                                                                              alert("Profile updated successfully.");

                                                                                                                                                                                                    onBack();
                                                                                                                                                                                                        } catch (error) {
                                                                                                                                                                                                              alert(error.message);
                                                                                                                                                                                                                  } finally {
                                                                                                                                                                                                                        setSaving(false);
                                                                                                                                                                                                                            }
                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                return (
                                                                                                                                                                                                                                    <div className="login-screen">

                                                                                                                                                                                                                                          <button
                                                                                                                                                                                                                                                  className="secondary"
                                                                                                                                                                                                                                                          onClick={onBack}
                                                                                                                                                                                                                                                                >
                                                                                                                                                                                                                                                                        ← Back
                                                                                                                                                                                                                                                                              </button>

                                                                                                                                                                                                                                                                                    <h1>Edit Profile</h1>

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
                                                                                                                                                                                                                                                                                                                                                                                                  rows={5}
                                                                                                                                                                                                                                                                                                                                                                                                          placeholder="Tell everyone about yourself..."
                                                                                                                                                                                                                                                                                                                                                                                                                  value={bio}
                                                                                                                                                                                                                                                                                                                                                                                                                          onChange={(e) => setBio(e.target.value)}
                                                                                                                                                                                                                                                                                                                                                                                                                                />

                                                                                                                                                                                                                                                                                                                                                                                                                                      <button
                                                                                                                                                                                                                                                                                                                                                                                                                                              onClick={saveProfile}
                                                                                                                                                                                                                                                                                                                                                                                                                                                      disabled={saving}
                                                                                                                                                                                                                                                                                                                                                                                                                                                            >
                                                                                                                                                                                                                                                                                                                                                                                                                                                                    {saving ? "Saving..." : "💾 Save Changes"}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </button>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                export default EditProfile;