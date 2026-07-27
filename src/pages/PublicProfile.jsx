import { useEffect, useState } from "react";
import ProfileService from "../services/profile/ProfileService";
import "../styles/login.css";

function PublicProfile({ userId, onBack }) {
  const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

      useEffect(() => {
          loadProfile();
            }, [userId]);

              async function loadProfile() {
                  try {
                        const data = await ProfileService.getProfileById(userId);
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

                                                                                                                    <button
                                                                                                                              className="secondary"
                                                                                                                                        onClick={onBack}
                                                                                                                                                >
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <h3>About</h3>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    {profile.bio || "This user hasn't added a bio yet."}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        export default PublicProfile;