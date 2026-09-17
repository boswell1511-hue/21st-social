import { useEffect, useState } from "react";
import ProfileService from "../services/profile/ProfileService";
import FollowService from "../services/friends/FollowService";
import TrustedSixService from "../services/friends/TrustedSixService";
import "../styles/login.css";

function PublicProfile({ userId, onBack, onViewProfile }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [trustedProfiles, setTrustedProfiles] = useState([]);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    try {
      setLoading(true);

      const data = await ProfileService.getProfileById(userId);
      setProfile(data);

      const followingStatus = await FollowService.isFollowing(userId);
      setIsFollowing(followingStatus);

      const followerCount = await FollowService.getFollowerCount(userId);
      const followingCount = await FollowService.getFollowingCount(userId);

      setFollowers(followerCount);
      setFollowing(followingCount);

      const trustedRows = await TrustedSixService.getTrustedSix(userId);
      const selectedProfiles = (
        await Promise.all(
          trustedRows.map(async (row) => {
            try {
              return await ProfileService.getProfileById(row.trusted_user_id);
            } catch {
              return null;
            }
          })
        )
      ).filter(Boolean);

      setTrustedProfiles(selectedProfiles);
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFollow() {
    try {
      if (isFollowing) {
        await FollowService.unfollow(userId);
        setIsFollowing(false);
        setFollowers((count) => count - 1);
      } else {
        await FollowService.follow(userId);
        setIsFollowing(true);
        setFollowers((count) => count + 1);
      }
    } catch (error) {
      alert(error.message);
    }
  }

  function getBubblePosition(index) {
    const positions = [
      {
        left: "50%",
        top: "-30px",
        transform: "translateX(-50%)",
      },
      { left: "8%", top: "18px" },
      {
        left: "92%",
        top: "18px",
        transform: "translateX(-100%)",
      },
      { left: "8%", bottom: "18px" },
      {
        left: "92%",
        bottom: "18px",
        transform: "translateX(-100%)",
      },
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
        <button className="secondary" onClick={onBack}>
          ← Back
        </button>
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

          {trustedProfiles.map((trustedProfile, index) => (
            <button
              key={trustedProfile.id}
              type="button"
              onClick={() => {
                onViewProfile?.(trustedProfile.id);
              }}
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

      <button
        className="primary"
        onClick={handleFollow}
        style={{ marginBottom: "24px" }}
      >
        {isFollowing ? "Following ✓" : "Follow"}
      </button>

      <div className="progress-card">
        <h3>About</h3>
        <p>{profile.bio || "This user hasn't added a bio yet."}</p>
      </div>
    </div>
  );
}

export default PublicProfile;
