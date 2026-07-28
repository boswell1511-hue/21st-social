import { useEffect, useState } from "react";
import ProfileService from "../services/profile/ProfileService";
import "../styles/login.css";

function Home({
  onMyProfile,
    onFindFriends,
      onCreatePost,
        onCommunity,
        }) {
          const [profile, setProfile] = useState(null);

            useEffect(() => {
                loadProfile();
                  }, []);

                    async function loadProfile() {
                        try {
                              const data = await ProfileService.getProfile();
                                    setProfile(data);
                                        } catch (error) {
                                              console.error(error);
                                                  }
                                                    }

                                                      function getGreeting() {
                                                          const hour = new Date().getHours();

                                                              if (hour < 12) return "Good Morning";
                                                                  if (hour < 17) return "Good Afternoon";

                                                                      return "Good Evening";
                                                                        }

                                                                          function getCompletion() {
                                                                              if (!profile) return 0;

                                                                                  let completed = 0;

                                                                                      if (profile.display_name) completed++;
                                                                                          if (profile.username) completed++;
                                                                                              if (profile.bio) completed++;
                                                                                                  if (profile.avatar_url) completed++;

                                                                                                      return Math.round((completed / 4) * 100);
                                                                                                        }

                                                                                                          const completion = getCompletion();

                                                                                                            return (
                                                                                                                <div className="login-screen">

                                                                                                                      <h3 className="welcome-title">
                                                                                                                              {getGreeting()}
                                                                                                                                      {profile?.display_name
                                                                                                                                                ? `, ${profile.display_name}`
                                                                                                                                                          : ""} 👋
                                                                                                                                                                </h3>

                                                                                                                                                                      <h1 className="logo-title">
                                                                                                                                                                              21<span className="logo-sup">st</span> Social
                                                                                                                                                                                    </h1>

                                                                                                                                                                                          <p className="tagline">
                                                                                                                                                                                                  Create • Connect • Collaborate
                                                                                                                                                                                                        </p>

                                                                                                                                                                                                              <div className="progress-card">
                                                                                                                                                                                                                      <h3>Complete Your Journey</h3>

                                                                                                                                                                                                                              <div className="progress-bar">
                                                                                                                                                                                                                                        <div
                                                                                                                                                                                                                                                    className="progress-fill"
                                                                                                                                                                                                                                                                style={{
                                                                                                                                                                                                                                                                              width: `${completion}%`,
                                                                                                                                                                                                                                                                                          }}
                                                                                                                                                                                                                                                                                                    />
                                                                                                                                                                                                                                                                                                            </div>

                                                                                                                                                                                                                                                                                                                    <p>{completion}% Complete</p>
                                                                                                                                                                                                                                                                                                                          </div>

                                                                                                                                                                                                                                                                                                                                <button
                                                                                                                                                                                                                                                                                                                                        className="secondary home-card"
                                                                                                                                                                                                                                                                                                                                                onClick={onMyProfile}
                                                                                                                                                                                                                                                                                                                                                      >
                                                                                                                                                                                                                                                                                                                                                              👤 My Profile
                                                                                                                                                                                                                                                                                                                                                                    </button>

                                                                                                                                                                                                                                                                                                                                                                          <button
                                                                                                                                                                                                                                                                                                                                                                                  className="secondary home-card"
                                                                                                                                                                                                                                                                                                                                                                                          onClick={onFindFriends}
                                                                                                                                                                                                                                                                                                                                                                                                >
                                                                                                                                                                                                                                                                                                                                                                                                        🌎 Get Connected
                                                                                                                                                                                                                                                                                                                                                                                                              </button>

                                                                                                                                                                                                                                                                                                                                                                                                                    <button
                                                                                                                                                                                                                                                                                                                                                                                                                            className="secondary home-card"
                                                                                                                                                                                                                                                                                                                                                                                                                                    onClick={onCreatePost}
                                                                                                                                                                                                                                                                                                                                                                                                                                          >
                                                                                                                                                                                                                                                                                                                                                                                                                                                  ✨ Be Creative
                                                                                                                                                                                                                                                                                                                                                                                                                                                        </button>

                                                                                                                                                                                                                                                                                                                                                                                                                                                              <button
                                                                                                                                                                                                                                                                                                                                                                                                                                                                      className="secondary home-card"
                                                                                                                                                                                                                                                                                                                                                                                                                                                                              onClick={onCommunity}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    >
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            🌍 Community
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </button>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <button className="secondary home-card">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                🌱 Discover Communities
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </button>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <p className="coming-soon">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    Share a thought, a photo, a story,
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            or something that inspires others.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  </p>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        export default Home;