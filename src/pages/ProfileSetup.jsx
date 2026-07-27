import { useState } from "react";
import "../styles/login.css";
import ProfilePhotoPicker from "../components/profile/ProfilePhotoPicker";
import supabase from "../lib/supabase";

function ProfileSetup({ onContinue }) {
  const [displayName, setDisplayName] = useState("");
    const [username, setUsername] = useState("");
      const [bio, setBio] = useState("");
        const [profileImage, setProfileImage] =
               useState(null);

        async function handleContinue() {
                  if (!displayName.trim()) {
                      alert("Please enter a display name.");
                          return;
                            }

                              if (!username.trim()) {
                                  alert("Please choose a username.");
                                      return;
                                        }

                                          const {
                                              data: { user },
                                                } = await supabase.auth.getUser();

                                                  if (!user) {
                                                      alert("Please sign in again.");
                                                          return;
                                                            }

                                                              let avatarUrl = "";

                                                                // Upload profile image if one was selected
                                                                  if (profileImage) {
                                                                      const fileName = `${user.id}-${Date.now()}`;

                                                                          const { error: uploadError } = await supabase.storage
                                                                                .from("avatars")
                                                                                      .upload(fileName, profileImage);

                                                                                          if (uploadError) {
                                                                                                alert(uploadError.message);
                                                                                                      return;
                                                                                                          }

                                                                                                              const { data } = supabase.storage
                                                                                                                    .from("avatars")
                                                                                                                          .getPublicUrl(fileName);

                                                                                                                              avatarUrl = data.publicUrl;
                                                                                                                                }

                                                                                                                                  const { error } = await supabase
                                                                                                                                      .from("profiles")
                                                                                                                                          .insert({
                                                                                                                                                id: user.id,
                                                                                                                                                      display_name: displayName,
                                                                                                                                                            username,
                                                                                                                                                                  bio,
                                                                                                                                                                        avatar_url: avatarUrl,
                                                                                                                                                                            });

                                                                                                                                                                              if (error) {
                                                                                                                                                                                  alert(error.message);
                                                                                                                                                                                      return;
                                                                                                                                                                                        }

                                                                                                                                                                                          onContinue();
                                                                                                                                                                                          }
        

                                                        return (
                                                            <div className="login-screen">
                                                                  <h1>
                                                                      Create Your
                                                                        <br />
                                                                          Profile
                                                                          </h1>

                                                                        <ProfilePhotoPicker onImageSelected={setProfileImage} />

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