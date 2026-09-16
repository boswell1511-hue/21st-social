import { useEffect, useRef, useState } from "react";
import ProfileService from "../services/profile/ProfileService";
import ProfilePhotoPicker from "../components/profile/ProfilePhotoPicker";
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
  const backgroundInputRef = useRef(null);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    return () => {
      if (backgroundPreview) {
        URL.revokeObjectURL(backgroundPreview);
      }
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

  function handleImageSelected(file) {
    setSelectedAvatarFile(file);
  }

  function handleBackgroundSelected(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (backgroundPreview) {
      URL.revokeObjectURL(backgroundPreview);
    }

    setPendingBackgroundFile(file);
    setBackgroundPreview(URL.createObjectURL(file));
    event.target.value = "";
  }

  function cancelBackgroundSelection() {
    if (backgroundPreview) {
      URL.revokeObjectURL(backgroundPreview);
    }

    setPendingBackgroundFile(null);
    setBackgroundPreview("");
  }

function useBackgroundSelection() {
    if (!pendingBackgroundFile) {
        return;
          }

            setSelectedBackgroundFile(pendingBackgroundFile);
              setPendingBackgroundFile(null);
                setBackgroundPreview("");
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
        disabled={saving}
      >
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

            <p
              style={{
                textAlign: "center",
                fontWeight: "600",
                margin: "12px 0",
              }}
            >
              Use This Background?
            </p>

            <div
              style={{
                display: "flex",
                gap: "10px",
              }}
            >
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
