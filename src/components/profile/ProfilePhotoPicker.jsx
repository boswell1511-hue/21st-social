import { useRef, useState } from "react";
import "../../styles/login.css";

function ProfilePhotoPicker({ onImageSelected }) {
  const [image, setImage] = useState(null);
    const fileInputRef = useRef(null);

      function handleImageChange(event) {
          const file = event.target.files[0];

              if (!file) return;

                  const imageUrl = URL.createObjectURL(file);
                      setImage(imageUrl);

                          if (onImageSelected) {
                                onImageSelected(file);
                                    }
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
                                                                                                                                                                                                                                                  type="button"
                                                                                                                                                                                                                                                          className="secondary"
                                                                                                                                                                                                                                                                  onClick={openFilePicker}
                                                                                                                                                                                                                                                                        >
                                                                                                                                                                                                                                                                                Upload Profile Photo
                                                                                                                                                                                                                                                                                      </button>
                                                                                                                                                                                                                                                                                          </div>
                                                                                                                                                                                                                                                                                            );
                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                            export default ProfilePhotoPicker;