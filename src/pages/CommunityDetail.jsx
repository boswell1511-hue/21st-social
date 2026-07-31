import { useEffect, useState } from "react";
import supabase from "../lib/supabase";

function CommunityDetail({
      community,
        onBack,
          onJoin,
          joined,
          }) {
            if (!community) return null;

            const [localJoined, setLocalJoined] = useState(false);
            useEffect(() => {
                  checkMembership();
                  }, [community]);

                  async function checkMembership() {
                    const {
                        data: { user },
                          } = await supabase.auth.getUser();

                            if (!user) return;

                              const { data, error } = await supabase
                                  .from("community_members")
                                      .select("id")
                                          .eq("community_id", community.id)
                                              .eq("user_id", user.id)
                                                  .maybeSingle();

                                                    if (error) {
                                                        console.error(error);
                                                            return;
                                                              }

                                                                setJoined(!!data);
                                                                }
            
              return (
                  <div
                        style={{
                                maxWidth: "700px",
                                        margin: "0 auto",
                                                padding: "20px",
                                                      }}
                                                          >
                                                                <button
                                                                        onClick={onBack}
                                                                                style={{
                                                                                          marginBottom: "20px",
                                                                                                    padding: "10px 16px",
                                                                                                              borderRadius: "10px",
                                                                                                                        border: "none",
                                                                                                                                  cursor: "pointer",
                                                                                                                                          }}
                                                                                                                                                >
                                                                                                                                                        ← Back
                                                                                                                                                              </button>

                                                                                                                                                                    <div
                                                                                                                                                                            style={{
                                                                                                                                                                                      height: "180px",
                                                                                                                                                                                                borderRadius: "18px",
                                                                                                                                                                                                          background:
                                                                                                                                                                                                                      "linear-gradient(135deg,#7c3aed,#5b21b6,#312e81)",
                                                                                                                                                                                                                                marginBottom: "20px",
                                                                                                                                                                                                                                        }}
                                                                                                                                                                                                                                              />

                                                                                                                                                                                                                                                    <div style={{ textAlign: "center" }}>
                                                                                                                                                                                                                                                            <div style={{ fontSize: "64px" }}>
                                                                                                                                                                                                                                                                      {community.icon}
                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                      <h1>{community.name}</h1>

                                                                                                                                                                                                                                                                                              <p>{community.description}</p>

                                                                                                                                                                                                                                                                                                      <h3>
                                                                                                                                                                                                                                                                                                                {community.members.toLocaleString()} Members
                                                                                                                                                                                                                                                                                                                        </h3>

                                                                                                                                                                                                                                                                                                                                <button
                                                                                                                                                                                                                                                                                                                                  onClick={joined ? undefined : onJoin}
                                                                                                                                                                                                                                                                                                                                    disabled={joined}
                                                                                                                                                                                                                                                                                                                                      style={{
                                                                                                                                                                                                                                                                                                                                          marginTop: "10px",
                                                                                                                                                                                                                                                                                                                                              padding: "12px 26px",
                                                                                                                                                                                                                                                                                                                                                  borderRadius: "999px",
                                                                                                                                                                                                                                                                                                                                                      border: "none",
                                                                                                                                                                                                                                                                                                                                                          background: joined ? "#16a34a" : "#7c3aed",
                                                                                                                                                                                                                                                                                                                                                              color: "#fff",
                                                                                                                                                                                                                                                                                                                                                                  fontWeight: "bold",
                                                                                                                                                                                                                                                                                                                                                                      cursor: joined ? "default" : "pointer",
                                                                                                                                                                                                                                                                                                                                                                        }}
                                                                                                                                                                                                                                                                                                                                                                        >
                                                                                                                                                                                                                                                                                                                                                                          {joined ? "✓ Joined" : "+ Join Community"}
                                                                                                                                                                                                                                                                                                                                                                          </button>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <hr style={{ margin: "30px 0" }} />

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <h2>About</h2>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        Welcome to the {community.name} community.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                This is where members will be able to share
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        posts, ideas, discussions, photos, and much
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                more.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </p>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <hr style={{ margin: "30px 0" }} />

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <h2>Community Feed</h2>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <p>🚧 Community feed coming soon.</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              export default CommunityDetail;
