function ProfileRing({
        style = "none",
          primaryColor = "#7c3aed",
            secondaryColor = "#22d3ee",
              size = 132,
                children,
                }) {
                  if (style === "none") {
                      return <>{children}</>;
                        }

                          const ringStyles = {
                              classic: {
                                    background: primaryColor,
                                          padding: "4px",
                                              },

                                                  basic: {
                                                        background: primaryColor,
                                                              padding: "4px",
                                                                  },

                                                                      gradient: {
                                                                            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                                                                  padding: "4px",
                                                                                      },

                                                                                          neon: {
                                                                                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                                                                                      padding: "4px",
                                                                                                            boxShadow: `0 0 8px ${primaryColor}, 0 0 18px ${secondaryColor}`,
                                                                                                                },

                                                                                                                    radiant: {
                                                                                                                          background: `conic-gradient(from 0deg, ${primaryColor}, ${secondaryColor}, ${primaryColor})`,
                                                                                                                                padding: "5px",
                                                                                                                                      boxShadow: `0 0 14px ${primaryColor}, 0 0 28px ${secondaryColor}`,
                                                                                                                                          },

                                                                                                                                              dual: {
                                                                                                                                                    background: primaryColor,
                                                                                                                                                          padding: "4px",
                                                                                                                                                                boxShadow: `0 0 0 3px ${secondaryColor}`,
                                                                                                                                                                    },
                                                                                                                                                                      };

                                                                                                                                                                        const selectedStyle = ringStyles[style] || ringStyles.basic;

                                                                                                                                                                          return (
                                                                                                                                                                              <div
                                                                                                                                                                                    style={{
                                                                                                                                                                                            width: `${size}px`,
                                                                                                                                                                                                    height: `${size}px`,
                                                                                                                                                                                                            borderRadius: "50%",
                                                                                                                                                                                                                    display: "flex",
                                                                                                                                                                                                                            alignItems: "center",
                                                                                                                                                                                                                                    justifyContent: "center",
                                                                                                                                                                                                                                            flexShrink: 0,
                                                                                                                                                                                                                                                    boxSizing: "border-box",
                                                                                                                                                                                                                                                            ...selectedStyle,
                                                                                                                                                                                                                                                                  }}
                                                                                                                                                                                                                                                                      >
                                                                                                                                                                                                                                                                            {children}
                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                  }

                                                                                                                                                                                                                                                                                  export default ProfileRing;
