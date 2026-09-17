import { useEffect, useRef, useState } from "react";
import ProfileService from "../services/profile/ProfileService";
import ProfilePhotoPicker from "../components/profile/ProfilePhotoPicker";
import FriendService from "../services/friends/FriendService";
import TrustedSixService from "../services/friends/TrustedSixService";
import "../styles/login.css";

function EditProfile({ onBack }) {
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [headerBackgroundUrl, setHeaderBackgroundUrl] = useState("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState(null);
  const [selectedBackgroundFile, setSelectedBackgroundFile] = useState(null);
  const [pendingBackgroundFile, setPendingBackgroundFile] = useState(null);
  const [backgroundPreview, setBackgroundPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [trustedProfiles, setTrustedProfiles] = useState([]);
  const [trustedSearch, setTrustedSearch] = useState("");
  const [trustedCandidates, setTrustedCandidates] = useState([]);
  const [loadingTrusted, setLoadingTrusted] = useState(true);
  const backgroundInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
    loadTrustedSix();
  }, []);

  useEffect(() => {
    return () => {
      if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
    };
  }, [backgroundPreview]);

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
      setAvatarUrl(profile.avatar_url || "");
      setHeaderBackgroundUrl(profile.header_background_url || "");
    } catch (error) {
      alert(error.message);
    }
  }

  async function loadTrustedSix() {
    try {
      setLoadingTrusted(true);
      const user = await TrustedSixService.getCurrentUser();
      const rows = await TrustedSixService.getTrustedSix(user?.id);
      const profiles = await FriendService.searchUsers("");
      const selected = rows
        .sort((a, b) => a.position - b.position)
        .map((row) => {
          const profile = profiles.find((candidate) => candidate.id === row.trusted_user_id);
          return profile ? { ...profile, trustedSixId: row.id, position: row.position } : null;
        })
        .filter(Boolean);

      setTrustedProfiles(selected);
      setTrustedCandidates(
        profiles
          .filter(
            (profile) =>
              profile.id !== user?.id &&
              !selected.some((trusted) => trusted.id === profile.id)
          )
          .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || ""))
      );
    } catch (error) {
      alert(error.message);
    } finally {
      setLoadingTrusted(false);
    }
  }

  function handleImageSelected(file) {
    setSelectedAvatarFile(file);
  }

  function handleBackgroundSelected(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
    setPendingBackgroundFile(file);
    setBackgroundPreview(URL.createObjectURL(file));
    event.target.value = "";
  }

  function cancelBackgroundSelection() {
    if (backgroundPreview) URL.revokeObjectURL(backgroundPreview);
    setPendingBackgroundFile(null);
    setBackgroundPreview("");
  }

  function useBackgroundSelection() {
    if (!pendingBackgroundFile) return;
    setSelectedBackgroundFile(pendingBackgroundFile);
    setPendingBackgroundFile(null);
    setBackgroundPreview("");
  }

  function addTrustedProfile(profile) {
    if (trustedProfiles.length >= 6) {
      alert("Trusted 6 can contain up to six people.");
      return;
    }

    const usedPositions = new Set(trustedProfiles.map((trusted) => trusted.position));
    let position = 1;
    while (usedPositions.has(position) && position <= 6) position += 1;
    if (position > 6) return;

    setTrustedProfiles((current) => [
      ...current,
      { ...profile, position, trustedSixId: null },
    ]);
    setTrustedCandidates((current) => current.filter((candidate) => candidate.id !== profile.id));
  }

  function removeTrustedProfile(profileId) {
    const removed = trustedProfiles.find((trusted) => trusted.id === profileId);
    setTrustedProfiles((current) => current.filter((trusted) => trusted.id !== profileId));
    if (removed) {
      setTrustedCandidates((current) =>
        [...current.filter((candidate) => candidate.id !== removed.id), removed].sort(
          (a, b) => (a.display_name || "").localeCompare(b.display_name || "")
        )
      );
    }
  }

  async function saveTrustedSix() {
    const existingRows = await TrustedSixService.getTrustedSix();
    const selectedIds = new Set(trustedProfiles.map((profile) => profile.id));

    for (const row of existingRows) {
      if (!selectedIds.has(row.trusted_user_id)) {
        await TrustedSixService.removeTrustedUser(row.trusted_user_id);
      }
    }

    const remainingRows = await TrustedSixService.getTrustedSix();

    for (const profile of trustedProfiles) {
      const existing = remainingRows.find(
        (row) => row.trusted_user_id === profile.id
      );
      if (!existing) {
        await TrustedSixService.addTrustedUser(profile.id, profile.position);
      }
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
      let updatedAvatarUrl = avatarUrl;
      let updatedHeaderBackgroundUrl = headerBackgroundUrl;

      if (selectedAvatarFile) {
        updatedAvatarUrl = await ProfileService.uploadAvatar(selectedAvatarFile);
      }
      if (selectedBackgroundFile) {
        updatedHeaderBackgroundUrl =
          await ProfileService.uploadHeaderBackground(selectedBackgroundFile);
      }

      await ProfileService.updateProfile({
        display_name: displayName,
        username,
        bio,
        avatar_url: updatedAvatarUrl,
        header_background_url: updatedHeaderBackgroundUrl,
      });

      await saveTrustedSix();
      alert("Profile updated successfully.");
      onBack();
    } catch (error) {
      alert(error.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredTrustedCandidates = trustedCandidates.filter((profile) => {
    const search = trustedSearch.trim().toLowerCase();
    if (!search) return true;
    return (
      (profile.display_name || "").toLowerCase().includes(search) ||
      (profile.username || "").toLowerCase().includes(search)
    );
  });

  return (
    <div className="login-screen">
      <button className="secondary" onClick={onBack} disabled={saving}>
        ← Back
      </button>

      <h1>Edit Profile</h1>

      <ProfilePhotoPicker
        currentImageUrl={avatarUrl}
        onImageSelected={handleImageSelected}
      />

      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          marginTop: "24px",
          padding: "16px",
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Profile Background</h2>

        {headerBackgroundUrl && !backgroundPreview && (
          <img
            src={headerBackgroundUrl}
            alt="Current profile background"
            style={{
              width: "100%",
              maxHeight: "220px",
              objectFit: "cover",
              borderRadius: "12px",
              display: "block",
              marginBottom: "12px",
            }}
          />
        )}

        {backgroundPreview && (
          <div style={{ marginBottom: "12px" }}>
            <img
              src={backgroundPreview}
              alt="Selected profile background preview"
              style={{
                width: "100%",
                maxHeight: "220px",
                objectFit: "cover",
                borderRadius: "12px",
                display: "block",
              }}
            />
            <p style={{ textAlign: "center", fontWeight: "600", margin: "12px 0" }}>
              Use This Background?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="secondary"
                onClick={cancelBackgroundSelection}
                disabled={saving}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={useBackgroundSelection}
                disabled={saving}
                style={{ flex: 1 }}
              >
                Use This Background
              </button>
            </div>
          </div>
        )}

        {!backgroundPreview && (
          <>
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundSelected}
              style={{ display: "none" }}
            />
            <button
              type="button"
              onClick={() => backgroundInputRef.current?.click()}
              disabled={saving}
            >
              Upload Profile Background
            </button>
          </>
        )}
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          marginTop: "24px",
          padding: "16px",
          borderRadius: "16px",
          background: "rgba(255, 255, 255, 0.08)",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Trusted 6</h2>
        <p style={{ marginTop: 0 }}>
          Choose up to 6 people you trust most. They will appear as smaller
          profile bubbles around your profile photo.
        </p>

        <input
          type="text"
          placeholder="Search by name or username..."
          value={trustedSearch}
          onChange={(event) => setTrustedSearch(event.target.value)}
          disabled={saving || loadingTrusted}
          style={{ marginBottom: "12px" }}
        />

        {loadingTrusted ? (
          <p>Loading Trusted 6...</p>
        ) : (
          <>
            <h3>Selected</h3>

            {trustedProfiles.length === 0 ? (
              <p>No Trusted 6 people selected yet.</p>
            ) : (
              <div style={{ display: "grid", gap: "10px" }}>
                {trustedProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px",
                      borderRadius: "12px",
                      background: "rgba(0, 0, 0, 0.18)",
                    }}
                  >
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt=""
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <span style={{ fontSize: "28px" }}>👤</span>
                    )}

                    <div style={{ flex: 1, textAlign: "left" }}>
                      <strong>
                        {profile.position}. {profile.display_name}
                      </strong>
                      <div style={{ color: "#4fc3f7" }}>
                        @{profile.username}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="secondary"
                      onClick={() => removeTrustedProfile(profile.id)}
                      disabled={saving}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {trustedProfiles.length < 6 && (
              <>
                <h3 style={{ marginTop: "20px" }}>Add People</h3>

                {filteredTrustedCandidates.length === 0 ? (
                  <p>No matching people found.</p>
                ) : (
                  <div style={{ display: "grid", gap: "10px" }}>
                    {filteredTrustedCandidates.map((profile) => (
                      <div
                        key={profile.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "10px",
                          padding: "10px",
                          borderRadius: "12px",
                          background: "rgba(0, 0, 0, 0.18)",
                        }}
                      >
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            style={{
                              width: "46px",
                              height: "46px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                        ) : (
                          <span style={{ fontSize: "28px" }}>👤</span>
                        )}

                        <div style={{ flex: 1, textAlign: "left" }}>
                          <strong>{profile.display_name}</strong>
                          <div style={{ color: "#4fc3f7" }}>
                            @{profile.username}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => addTrustedProfile(profile)}
                          disabled={saving}
                        >
                          Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

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

      <button onClick={saveProfile} disabled={saving}>
        {saving ? "Saving..." : "💾 Save Changes"}
      </button>
    </div>
  );
}

export default EditProfile;
