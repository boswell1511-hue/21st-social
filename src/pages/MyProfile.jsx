import { useEffect, useState } from "react";
import ProfileService from "../services/profile/ProfileService";
import FollowService from "../services/friends/FollowService";
import "../styles/login.css";

function MyProfile({ onBack, onEditProfile }) {
  const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
      const [followers, setFollowers] = useState(0);
        const [following, setFollowing] = useState(0);

      useEffect(() => {
          loadProfile();
            }, []);

              async function loadProfile() {
                  try {
                        const data = await ProfileService.getProfile();
                              setProfile(data);

                              const followerCount = await FollowService.getFollowerCount(data.id);
                              const followingCount = await FollowService.getFollowingCount(data.id);

                              setFollowers(followerCount);
                              setFollowing(followingCount);
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

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "520px",
          height: "220px",
          margin: "8px auto 28px",
          borderRadius: "18px",
          overflow: "hidden",
          backgroundImage: profile.header_background_url
            ? `url(${profile.header_background_url})`
            : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundColor: "#161c2d",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.28)",
        }}
      >
        {profile.header_background_url && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.28)",
            }}
          />
        )}

        <div
          className="profile-photo-picker"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "-2px",
            transform: "translateX(-50%)",
            zIndex: 2,
          }}
        >
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

                                                                                                                                                                                                                                                                                                                                                                           <div
                                                                                                                                                                                                                                                                                                                                                                               style={{
                                                                                                                                                                                                                                                                                                                                                                                   display: "flex",
                                                                                                                                                                                                                                                                                                                                                                                   justifyContent: "center",
                                                                                                                                                                                                                                                                                                                                                                                   gap: "32px",
                                                                                                                                                                                                                                                                                                                                                                                   marginTop: "20px",
                                                                                                                                                                                                                                                                                                                                                                                   marginBottom: "24px",
                                                                                                                                                                                                                                                                                                                                                                                   color: "white",
                                                                                                                                                                                                                                                                                                                                                                               }}
                                                                                                                                                                                                                                                                                                                                                                           >
                                                                                                                                                                                                                                                                                                                                                                               <div>
                                                                                                                                                                                                                                                                                                                                                                                   <strong>{followers}</strong>
                                                                                                                                                                                                                                                                                                                                                                                   <br />
                                                                                                                                                                                                                                                                                                                                                                                   Followers
                                                                                                                                                                                                                                                                                                                                                                               </div>

                                                                                                                                                                                                                                                                                                                                                                               <div>
                                                                                                                                                                                                                                                                                                                                                                                   <strong>{following}</strong>
                                                                                                                                                                                                                                                                                                                                                                                   <br />
                                                                                                                                                                                                                                                                                                                                                                                   Following
                                                                                                                                                                                                                                                                                                                                                                               </div>
                                                                                                                                                                                                                                                                                                                                                                           </div>
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
