import { useState } from "react";
import CommunityCard from "../components/community/CommunityCard";

const sampleCommunities = [
  {
      id: 1,
          icon: "💻",
              name: "Tech Innovators",
                  description: "Technology, AI, coding, and innovation.",
                      members: 2481,
                        },
                          {
                              id: 2,
                                  icon: "🎮",
                                      name: "Gaming Central",
                                          description: "Console, PC, mobile, and esports.",
                                              members: 1924,
                                                },
                                                  {
                                                      id: 3,
                                                          icon: "📸",
                                                              name: "Photography Hub",
                                                                  description: "Share your best photos and learn new skills.",
                                                                      members: 1368,
                                                                        },
                                                                          {
                                                                              id: 4,
                                                                                  icon: "🎵",
                                                                                      name: "Music Lounge",
                                                                                          description: "Discover music and connect with artists.",
                                                                                              members: 1152,
                                                                                                },
                                                                                                  {
                                                                                                      id: 5,
                                                                                                          icon: "🌍",
                                                                                                              name: "Travel Explorers",
                                                                                                                  description: "Share adventures from around the world.",
                                                                                                                      members: 973,
                                                                                                                        },
                                                                                                                        ];

                                                                                                                        function DiscoverCommunities({
                                                                                                                              onOpenCommunity,
                                                                                                                                onBack,
                                                                                                                                }) {
                                                                                                                    
                                                                                                                          const [search, setSearch] = useState("");

                                                                                                                            const filtered = sampleCommunities.filter((community) =>
                                                                                                                                community.name.toLowerCase().includes(search.toLowerCase())
                                                                                                                                  );

                                                                                                                                    return (
                                                                                                                                        <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
                                                                                                                                              <h1>🌱 Discover Communities</h1>

                                                                                                                                                    <p>
                                                                                                                                                            Find people who share your passions and interests.
                                                                                                                                                                  </p>

                                                                                                                                                                        <input
                                                                                                                                                                                type="text"
                                                                                                                                                                                        placeholder="Search communities..."
                                                                                                                                                                                                value={search}
                                                                                                                                                                                                        onChange={(e) => setSearch(e.target.value)}
                                                                                                                                                                                                                style={{
                                                                                                                                                                                                                          width: "100%",
                                                                                                                                                                                                                                    padding: "12px",
                                                                                                                                                                                                                                              borderRadius: "10px",
                                                                                                                                                                                                                                                        margin: "20px 0",
                                                                                                                                                                                                                                                                }}
                                                                                                                                                                                                                                                                      />

                                                                                                                                                                                                                                                                            
                                                                                                                                                                                                                                                                                    {filtered.map((community) => (
                                                                                                                                                                                                                                                                                          <CommunityCard
                                                                                                                                                                                                                                                                                              key={community.id}
                                                                                                                                                                                                                                                                                                  icon={community.icon}
                                                                                                                                                                                                                                                                                                      name={community.name}
                                                                                                                                                                                                                                                                                                          description={community.description}
                                                                                                                                                                                                                                                                                                              members={community.members}
                                                                                                                                                                                                                                                                                                                  joined={false}
                                                                                                                                                                                                                                                                                                                      onJoin={() => {
                                                                                                                                                                                                                                                                                                                            console.log(`Joined ${community.name}`);
                                                                                                                                                                                                                                                                                                                                }}
                                                                                                                                                                                                                                                                                                                                    onClick={() => {
                                                                                                                                                                                                                                                                                                                                          if (onOpenCommunity) {
                                                                                                                                                                                                                                                                                                                                              onOpenCommunity(community);
                                                                                                                                                                                                                                                                                                                                                }
                                                                                                                                                                                                                                                                                                                                                }}
                                                                                                                                                                                                                                                                                                                                    />
                                                                                                                                                                                                                                                                                                                                            ))}             
                                                                                                                                                                                                                                                                                                                                                
                                                                                                                                                                                                                                                                                    

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  {filtered.length === 0 && (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          <p>No communities found.</p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                )}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      <hr style={{ marginTop: "30px" }} />

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <p style={{ textAlign: "center" }}>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    More communities and community creation are coming soon.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          </p>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                export default DiscoverCommunities;