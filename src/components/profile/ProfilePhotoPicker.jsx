import { useRef, useState } from "react";
import "../../styles/login.css";

function ProfilePhotoPicker() {
  const [image, setImage] = useState(null);
    const fileInputRef = useRef(null);

      function handleImageChange(event) {
          const file = event.target.files[0];

              if (!file) return;

                  const imageUrl = URL.createObjectURL(file);
                      setImage(imageUrl);
                        }

                          function openFilePicker() {
                              fileInputRef.current.click();
                                }

                                  return (
                                      <div className="profile-photo-picker">
                                            <div
                                                    className="profile-photo-placeholder"
                                                            onClick={openFilePicker}
                                                                  >
                                                                          {image ? (
                                                                                    <img
                                                                                                src={image}
                                                                                                            alt="Profile"
                                                                                                                        className="profile-photo"
                                                                                                                                  />
                                                                                                                                          ) : (
                                                                                                                                                    <span className="profile-photo-icon">👤</span>
                                                                                                                                                            )}
                                                                                                                                                                  </div>

                                                                                                                                                                        <input
                                                                                                                                                                                ref={fileInputRef}
                                                                                                                                                                                        type="file"
                                                                                                                                                                                                accept="image/*"
                                                                                                                                                                                                        onChange={handleImageChange}
                                                                                                                                                                                                                style={{ display: "none" }}
                                                                                                                                                                                                                      />

                                                                                                                                                                                                                            <button
                                                                                                                                                                                                                                    className="secondary"
                                                                                                                                                                                                                                            onClick={openFilePicker}
                                                                                                                                                                                                                                                  >
                                                                                                                                                                                                                                                          Upload Profile Photo
                                                                                                                                                                                                                                                                </button>
                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                      export default ProfilePhotoPicker;