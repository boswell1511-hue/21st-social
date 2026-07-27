import { useEffect, useState } from "react";
import ProfileService from "../services/profile/ProfileService";
import "../styles/login.css";

function MyProfile({ onBack, onEditProfile }) {
  const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

      useEffect(() => {
          loadProfile();
            }, []);

              async function loadProfile() {
                  try {
                        const data = await ProfileService.getProfile();
                              setProfile(data);
                                  } catch (error) {
                                        alert(error.message);
                                            } finally {
                                                  setLoading(false);
                                                      }
                                                        }

                                                          if (loading) {
                                                              return (
                                                                    <div className="login-screen">
                                                                            <h1>Loading Profile...</h1>
                                                                                  </div>
                                                                                      );
                                                                                        }

                                                                                          if (!profile) {
                                                                                              return (
                                                                                                    <div className="login-screen">
                                                                                                            <h1>Profile Not Found</h1>
                                                                                                                    <p>Please complete your profile setup.</p>

                                                                                                                            <button onClick={onBack}>
                                                                                                                                      ← Back
                                                                                                                                              </button>
                                                                                                                                                    </div>
                                                                                                                                                        );
                                                                                                                                                          }

                                                                                                                                                            return (
                                                                                                                                                                <div className="login-screen">

                                                                                                                                                                      <button
                                                                                                                                                                              className="secondary"
                                                                                                                                                                                      onClick={onBack}
                                                                                                                                                                                            >
                                                                                                                                                                                                    ← Back
                                                                                                                                                                                                          </button>

                                                                                                                                                                                                                <div className="profile-photo-picker">
                                                                                                                                                                                                                        <div className="profile-photo-placeholder">
                                                                                                                                                                                                                                  {profile.avatar_url ? (
                                                                                                                                                                                                                                              <img
                                                                                                                                                                                                                                                            src={profile.avatar_url}
                                                                                                                                                                                                                                                                          alt={profile.display_name}
                                                                                                                                                                                                                                                                                        className="profile-photo"
                                                                                                                                                                                                                                                                                                    />
                                                                                                                                                                                                                                                                                                              ) : (
                                                                                                                                                                                                                                                                                                                          <span className="profile-photo-icon">👤</span>
                                                                                                                                                                                                                                                                                                                                    )}
                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                  </div>

                                                                                                                                                                                                                                                                                                                                                        <h1>{profile.display_name}</h1>

                                                                                                                                                                                                                                                                                                                                                              <p
                                                                                                                                                                                                                                                                                                                                                                      style={{
                                                                                                                                                                                                                                                                                                                                                                                color: "#4fc3f7",
                                                                                                                                                                                                                                                                                                                                                                                          fontWeight: 600,
                                                                                                                                                                                                                                                                                                                                                                                                    marginTop: "-8px",
                                                                                                                                                                                                                                                                                                                                                                                                            }}
                                                                                                                                                                                                                                                                                                                                                                                                                  >
                                                                                                                                                                                                                                                                                                                                                                                                                          @{profile.username}
                                                                                                                                                                                                                                                                                                                                                                                                                                </p>

                                                                                                                                                                                                                                                                                                                                                                                                                                      <div className="progress-card">
                                                                                                                                                                                                                                                                                                                                                                                                                                              <h3>About Me</h3>

                                                                                                                                                                                                                                                                                                                                                                                                                                                      <p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                {profile.bio || "No bio has been added yet."}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <button onClick={onEditProfile}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            ✏️ Edit Profile
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </button>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        export default MyProfile;