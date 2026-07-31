function CommunityCard({
      icon,
        name,
          description,
            members,
              joined = false,
                onJoin,
                  onClick,
                  }) {
                    return (
                        <div
                              className="community-card"
                                    onClick={onClick}
                                          style={{
                                                  border: "1px solid rgba(255,255,255,0.15)",
                                                          borderRadius: "16px",
                                                                  padding: "18px",
                                                                          marginBottom: "18px",
                                                                                  background: "#111827",
                                                                                          cursor: onClick ? "pointer" : "default",
                                                                                                  transition: "0.2s",
                                                                                                        }}
                                                                                                            >
                                                                                                                  <div style={{ fontSize: "2rem", marginBottom: "8px" }}>
                                                                                                                          {icon}
                                                                                                                                </div>

                                                                                                                                      <h2 style={{ margin: "0 0 8px 0" }}>
                                                                                                                                              {name}
                                                                                                                                                    </h2>

                                                                                                                                                          <p style={{ color: "#9ad8ff", marginBottom: "12px" }}>
                                                                                                                                                                  {description}
                                                                                                                                                                        </p>

                                                                                                                                                                              <p>
                                                                                                                                                                                      <strong>{members.toLocaleString()}</strong> members
                                                                                                                                                                                            </p>

                                                                                                                                                                                                  <button
                                                                                                                                                                                                          onClick={(e) => {
                                                                                                                                                                                                                    e.stopPropagation();
                                                                                                                                                                                                                              if (onJoin) onJoin();
                                                                                                                                                                                                                                      }}
                                                                                                                                                                                                                                              style={{
                                                                                                                                                                                                                                                        marginTop: "10px",
                                                                                                                                                                                                                                                                  padding: "10px 18px",
                                                                                                                                                                                                                                                                            borderRadius: "999px",
                                                                                                                                                                                                                                                                                      border: "none",
                                                                                                                                                                                                                                                                                                background: joined ? "#16a34a" : "#7c3aed",
                                                                                                                                                                                                                                                                                                          color: "white",
                                                                                                                                                                                                                                                                                                                    fontWeight: "600",
                                                                                                                                                                                                                                                                                                                              cursor: "pointer",
                                                                                                                                                                                                                                                                                                                                      }}
                                                                                                                                                                                                                                                                                                                                            >
                                                                                                                                                                                                                                                                                                                                                    {joined ? "✓ Joined" : "+ Join"}
                                                                                                                                                                                                                                                                                                                                                          </button>
                                                                                                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                                                                                                export default CommunityCard;
