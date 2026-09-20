import { useEffect, useState } from "react";
import ProfileService from "../services/profile/ProfileService";
import FollowService from "../services/friends/FollowService";
import TrustedSixService from "../services/friends/TrustedSixService";
import ProfileRing from "../components/profile/ProfileRing";
import FriendService from "../services/friends/FriendService";
import "../styles/login.css";

function MyProfile({ onBack, onEditProfile, onViewProfile }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [trustedProfiles, setTrustedProfiles] = useState([]);

  async function loadProfile() {
    try {
      const data = await ProfileService.getProfile();
      setProfile(data);

      const followerCount = await FollowService.getFollowerCount(data.id);
      const followingCount = await FollowService.getFollowingCount(data.id);

      setFollowers(followerCount);
      setFollowing(followingCount);

      const trustedRows = await TrustedSixService.getTrustedSix(data.id);
      const profiles = await FriendService.searchUsers("");
      const selectedProfiles = trustedRows
        .map((row) => profiles.find((user) => user.id === row.trusted_user_id))
        .filter(Boolean);

      setTrustedProfiles(selectedProfiles);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function getBubblePosition(index) {
    const positions = [
      { left: "50%", top: "-58px", transform: "translateX(-50%)" },
      { left: "-58px", top: "14px" },
      { right: "-58px", top: "14px" },
      { left: "-58px", bottom: "14px" },
      { right: "-58px", bottom: "14px" },
      { left: "50%", bottom: "-58px", transform: "translateX(-50%)" },
    ];

    return positions[index] || positions[0];
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
        <button onClick={onBack}>← Back</button>
      </div>
    );
  }

  return (
    <div className="login-screen">
      <button className="secondary" onClick={onBack}>
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
          overflow: "visible",
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
              borderRadius: "18px",
              background: "rgba(0, 0, 0, 0.28)",
              zIndex: 0,
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            left: "50%",
            bottom: "-2px",
            transform: "translateX(-50%)",
            zIndex: 2,
          }}
        >
          <div
            className="profile-photo-picker"
            style={{
              position: "relative",
              zIndex: 3,
            }}
          >
            <ProfileRing
              style={profile.profile_ring_style}
              primaryColor={profile.profile_ring_primary_color || "#7c3aed"}
              secondaryColor={profile.profile_ring_secondary_color || "#22d3ee"}
              size={132}
            >
            <div
              className="profile-photo-placeholder"
              style={{
                width: "122px",
                height: "122px",
                minWidth: "122px",
                minHeight: "122px",
                maxWidth: "122px",
                maxHeight: "122px",
                aspectRatio: "1 / 1",
                borderRadius: "50%",
                overflow: "hidden",
                boxSizing: "border-box",
                flexShrink: 0,
              }}
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="profile-photo"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    aspectRatio: "1 / 1",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
              ) : (
                <span className="profile-photo-icon">👤</span>
              )}
            </div>
            </ProfileRing>

            {trustedProfiles.map((trustedProfile, index) => (
              <button
                key={trustedProfile.id}
                type="button"
                onClick={() =>
                  onViewProfile && onViewProfile(trustedProfile.id)
                }
                aria-label={`View ${trustedProfile.display_name}'s profile`}
                style={{
                  position: "absolute",
                  width: "54px",
                  height: "54px",
                  padding: 0,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "3px solid white",
                  background: "#161c2d",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.4)",
                  zIndex: 4,
                  ...getBubblePosition(index),
                }}
              >
                {trustedProfile.avatar_url ? (
                  <img
                    src={trustedProfile.avatar_url}
                    alt=""
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "22px" }}>👤</span>
                )}
              </button>
            ))}
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
        <p>{profile.bio || "No bio has been added yet."}</p>
      </div>

      <button onClick={onEditProfile}>✏️ Edit Profile</button>
    </div>
  );
}

export default MyProfile;
