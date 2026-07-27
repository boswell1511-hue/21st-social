import { useState } from "react";
import PostService from "../services/posts/PostService";
import "../styles/login.css";

function CreatePost({ onBack }) {
  const [content, setContent] = useState("");
    const [posting, setPosting] = useState(false);

      async function handlePost() {
          if (!content.trim()) {
                alert("Please write something first.");
                      return;
                          }

                              try {
                                    setPosting(true);

                                          await PostService.createPost(content);

                                                alert("Post created successfully!");

                                                      setContent("");
                                                          } catch (error) {
                                                                alert(error.message);
                                                                    } finally {
                                                                          setPosting(false);
                                                                              }
                                                                                }

                                                                                  return (
                                                                                      <div className="login-screen">

                                                                                            <button
                                                                                                    className="secondary"
                                                                                                            onClick={onBack}
                                                                                                                  >
                                                                                                                          ← Back
                                                                                                                                </button>

                                                                                                                                      <h1>Create Post</h1>

                                                                                                                                            <p
                                                                                                                                                    style={{
                                                                                                                                                              color: "#bbbbbb",
                                                                                                                                                                        marginBottom: "20px",
                                                                                                                                                                                }}
                                                                                                                                                                                      >
                                                                                                                                                                                              What's on your mind?
                                                                                                                                                                                                    </p>

                                                                                                                                                                                                          <textarea
                                                                                                                                                                                                                  value={content}
                                                                                                                                                                                                                          onChange={(e) => setContent(e.target.value)}
                                                                                                                                                                                                                                  rows={7}
                                                                                                                                                                                                                                          placeholder="Share something with the community..."
                                                                                                                                                                                                                                                  style={{
                                                                                                                                                                                                                                                            width: "100%",
                                                                                                                                                                                                                                                                      maxWidth: "500px",
                                                                                                                                                                                                                                                                                padding: "16px",
                                                                                                                                                                                                                                                                                          borderRadius: "12px",
                                                                                                                                                                                                                                                                                                    fontSize: "16px",
                                                                                                                                                                                                                                                                                                              resize: "vertical",
                                                                                                                                                                                                                                                                                                                        marginBottom: "24px",
                                                                                                                                                                                                                                                                                                                                }}
                                                                                                                                                                                                                                                                                                                                      />

                                                                                                                                                                                                                                                                                                                                            <button
                                                                                                                                                                                                                                                                                                                                                    onClick={handlePost}
                                                                                                                                                                                                                                                                                                                                                            disabled={posting}
                                                                                                                                                                                                                                                                                                                                                                  >
                                                                                                                                                                                                                                                                                                                                                                          {posting ? "Posting..." : "Post"}
                                                                                                                                                                                                                                                                                                                                                                                </button>

                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                      );
                                                                                                                                                                                                                                                                                                                                                                                      }

                                                                                                                                                                                                                                                                                                                                                                                      export default CreatePost;