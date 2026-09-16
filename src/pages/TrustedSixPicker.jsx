import { useEffect, useState } from "react";
import TrustedSixService from "../services/friends/TrustedSixService";
import FriendService from "../services/friends/FriendService";

function TrustedSixPicker({ onViewProfile }) {
  const [trustedSix, setTrustedSix] = useState([]);
  const [users, setUsers] = useState([]);
  const [allProfiles, setAllProfiles] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingUserId, setSavingUserId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadTrustedSix();
    loadProfiles();
  }, []);

  async function loadProfiles() {
    try {
      const profiles = await FriendService.searchUsers("");
      setAllProfiles(profiles);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadTrustedSix() {
    try {
      setLoading(true);
      setError("");

      const rows = await TrustedSixService.getTrustedSix();

      setTrustedSix(rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function getProfile(userId) {
    return allProfiles.find((user) => user.id === userId) || null;
  }

  async function searchUsers(value) {
    setSearch(value);
    setError("");

    if (!value.trim()) {
      setUsers([]);
      return;
    }

    try {
      const results = await FriendService.searchUsers(value);
      setUsers(results);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addUser(userId) {
    if (trustedSix.length >= 6) return;

    const usedPositions = new Set(
      trustedSix.map((item) => item.position)
    );

    let position = 1;
    while (usedPositions.has(position) && position <= 6) {
      position += 1;
    }

    if (position > 6) return;

    try {
      setSavingUserId(userId);
      setError("");

      await TrustedSixService.addTrustedUser(userId, position);
      await loadTrustedSix();

      setSearch("");
      setUsers([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingUserId(null);
    }
  }

  async function removeUser(userId) {
    try {
      setSavingUserId(userId);
      setError("");

      await TrustedSixService.removeTrustedUser(userId);
      await loadTrustedSix();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingUserId(null);
    }
  }

  if (loading) {
    return (
      <div className="progress-card">
        <h3>Trusted 6</h3>
        <p>Loading your Trusted 6...</p>
      </div>
    );
  }

  return (
    <div className="progress-card" style={{ marginTop: "24px" }}>
      <h3>Trusted 6</h3>

      <p>
        Choose up to six people you trust most. Their profile bubbles will
        appear around your profile photo.
      </p>

      {error && <p style={{ color: "#ff8a80" }}>{error}</p>}

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "12px",
          flexWrap: "wrap",
          margin: "18px 0",
        }}
      >
        {trustedSix.map((item) => {
          const profile = getProfile(item.trusted_user_id);

          return (
            <div
              key={item.id}
              style={{
                width: "64px",
                textAlign: "center",
              }}
            >
              <button
                type="button"
                onClick={() =>
                  profile &&
                  onViewProfile &&
                  onViewProfile(profile.id)
                }
                style={{
                  width: "58px",
                  height: "58px",
                  padding: 0,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "2px solid rgba(255,255,255,0.7)",
                  background: "#161c2d",
                }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.display_name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span style={{ fontSize: "24px" }}>👤</span>
                )}
              </button>

              <small>{profile?.display_name || "Profile"}</small>

              <button
                type="button"
                className="secondary"
                onClick={() => removeUser(item.trusted_user_id)}
                disabled={savingUserId === item.trusted_user_id}
                style={{
                  marginTop: "6px",
                  padding: "4px 8px",
                  fontSize: "12px",
                }}
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>

      {trustedSix.length < 6 && (
        <>
          <input
            value={search}
            onChange={(event) => searchUsers(event.target.value)}
            placeholder="Search people to add..."
            style={{ width: "100%", boxSizing: "border-box" }}
          />

          {users.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              {users
                .filter(
                  (user) =>
                    !trustedSix.some(
                      (item) => item.trusted_user_id === user.id
                    )
                )
                .slice(0, 8)
                .map((user) => (
                  <div
                    key={user.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "10px 0",
                    }}
                  >
                    <div
                      style={{
                        width: "42px",
                        height: "42px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        background: "#161c2d",
                        flexShrink: 0,
                      }}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.display_name}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <span
                          style={{
                            display: "grid",
                            placeItems: "center",
                            height: "100%",
                          }}
                        >
                          👤
                        </span>
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <strong>{user.display_name}</strong>
                      <br />
                      <small>@{user.username}</small>
                    </div>

                    <button
                      type="button"
                      className="primary"
                      onClick={() => addUser(user.id)}
                      disabled={savingUserId === user.id}
                    >
                      {savingUserId === user.id ? "Adding..." : "Add"}
                    </button>
                  </div>
                ))}
            </div>
          )}
        </>
      )}

      {trustedSix.length === 6 && (
        <p style={{ marginBottom: 0 }}>
          Your Trusted 6 is full.
        </p>
      )}
    </div>
  );
}

export default TrustedSixPicker;
