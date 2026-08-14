import { useState, useEffect } from "react";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import CommunityEntrance from "./pages/CommunityEntrance";
import Home from "./pages/Home";
import MyProfile from "./pages/MyProfile";
import EditProfile from "./pages/EditProfile";
import FindFriends from "./pages/FindFriends";
import PublicProfile from "./pages/PublicProfile";
import CreatePost from "./pages/CreatePost";
import Feed from "./pages/Feed";
import DiscoverCommunities from "./pages/DiscoverCommunities";
import CommunityDetail from "./pages/CommunityDetail";
import supabase from "./lib/supabase";
import CreateCommunity from "./pages/CreateCommunity";
import CommunityMembershipService from "./services/community/CommunityMembershipService";

function App() {
  const [screen, setScreen] = useState(() => {
    try {
      // TESTING ONLY:
      // A fresh opening of the test app starts at Login.
      // A browser refresh keeps the last screen/page.
      const navigationEntry = performance.getEntriesByType("navigation")[0];
      const isRefresh = navigationEntry?.type === "reload";

      if (!isRefresh) {
        return "login";
      }

      return localStorage.getItem("21st_social_screen") || "welcome";
    } catch {
      return "login";
    }
  });

  const [selectedUserId, setSelectedUserId] = useState(() => {
    try {
      return localStorage.getItem("21st_social_selected_user_id") || null;
    } catch {
      return null;
    }
  });

  const [selectedCommunity, setSelectedCommunity] = useState(() => {
    try {
      const saved = localStorage.getItem("21st_social_selected_community");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [joinedCommunities, setJoinedCommunities] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem("21st_social_screen", screen);

      if (selectedUserId) {
        localStorage.setItem("21st_social_selected_user_id", selectedUserId);
      } else {
        localStorage.removeItem("21st_social_selected_user_id");
      }

      if (selectedCommunity) {
        localStorage.setItem(
          "21st_social_selected_community",
          JSON.stringify(selectedCommunity)
        );
      } else {
        localStorage.removeItem("21st_social_selected_community");
      }
    } catch (error) {
      console.warn("Unable to persist navigation state:", error);
    }
  }, [screen, selectedUserId, selectedCommunity]);
async function loadJoinedCommunities() {
        const {
            data: { user },
              } = await supabase.auth.getUser();

                if (!user) return;

                  const { data, error } = await supabase
                      .from("community_members")
                          .select("community_id")
                              .eq("user_id", user.id);

                                if (error) {
                                    console.error(error);
                                        return;
                                          }

                                            setJoinedCommunities(data.map((item) => item.community_id));
                                            }
                                          
                                                                                                                        useEffect(() => {
                                                                                                                            loadJoinedCommunities();
                                                                                                                            }, []);
                                                                                                                        

      switch (screen) {
          case "login":
                return (
                        <Login
                                  onRegister={() => setScreen("register")}
                                            onSuccess={(nextScreen) => setScreen(nextScreen)}
                                                    />
                                                          );

                                                              case "register":
                                                                    return (
                                                                            <Register
                                                                                      onBack={() => setScreen("login")}
                                                                                                onSuccess={() => setScreen("profile")}
                                                                                                        />
                                                                                                              );

                                                                                                                  case "profile":
                                                                                                                        return (
                                                                                                                                <ProfileSetup
                                                                                                                                          onContinue={() => setScreen("community")}
                                                                                                                                                  />
                                                                                                                                                        );

                                                                                                                                                            case "community":
                                                                                                                                                                  return (
                                                                                                                                                                          <CommunityEntrance
                                                                                                                                                                                    onEnter={() => setScreen("home")}
                                                                                                                                                                                            />
                                                                                                                                                                                                  );

                                                                                                                                                                                                      case "home":
                                                                                                                                                                                                            return (
                                                                                                                                                                                                                    <Home
                                                                                                                                                                                                                              onMyProfile={() => setScreen("myProfile")}
                                                                                                                                                                                                                                        onFindFriends={() => setScreen("findFriends")}
                                                                                                                                                                                                                                                  onCreatePost={() => setScreen("createPost")}
                                                                                                                                                                                                                                                            onCommunity={() => setScreen("feed")}
                                                                                                                                                                                                                                                                     onDiscoverCommunities={() => setScreen("discoverCommunities")}
                                                                                                                                                                                                                                                                    />
                                                                                                                                                                                                                                                                          );

                                                                                                                                                                                                                                                                              case "myProfile":
                                                                                                                                                                                                                                                                                    return (
                                                                                                                                                                                                                                                                                            <MyProfile
                                                                                                                                                                                                                                                                                                      onBack={() => setScreen("home")}
                                                                                                                                                                                                                                                                                                                onEditProfile={() => setScreen("editProfile")}
                                                                                                                                                                                                                                                                                                                        />
                                                                                                                                                                                                                                                                                                                              );

                                                                                                                                                                                                                                                                                                                                  case "editProfile":
                                                                                                                                                                                                                                                                                                                                        return (
                                                                                                                                                                                                                                                                                                                                                <EditProfile
                                                                                                                                                                                                                                                                                                                                                          onBack={() => setScreen("myProfile")}
                                                                                                                                                                                                                                                                                                                                                                  />
                                                                                                                                                                                                                                                                                                                                                                        );

                                                                                                                                                                                                                                                                                                                                                                            case "findFriends":
                                                                                                                                                                                                                                                                                                                                                                                  return (
                                                                                                                                                                                                                                                                                                                                                                                          <FindFriends
                                                                                                                                                                                                                                                                                                                                                                                                    onBack={() => setScreen("home")}
                                                                                                                                                                                                                                                                                                                                                                                                              onViewProfile={(userId) => {
                                                                                                                                                                                                                                                                                                                                                                                                                          setSelectedUserId(userId);
                                                                                                                                                                                                                                                                                                                                                                                                                                      setScreen("publicProfile");
                                                                                                                                                                                                                                                                                                                                                                                                                                                }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                        />
                                                                                                                                                                                                                                                                                                                                                                                                                                                              );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                  case "publicProfile":
                                                                                                                                                                                                                                                                                                                                                                                                                                                                        return (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <PublicProfile
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          userId={selectedUserId}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    onBack={() => setScreen("findFriends")}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      case "createPost":
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            return (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <CreatePost
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              onBack={() => setScreen("home")}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            );

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                case "feed":
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      return (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              <Feed
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                onBack={() => setScreen("home")}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  onCreatePost={() => setScreen("createPost")}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    onViewProfile={(userId) => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        setSelectedUserId(userId);
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            setScreen("publicProfile");
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              }}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              />
   
                    
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          );
case "discoverCommunities":
          return (
<DiscoverCommunities
  onBack={() => setScreen("home")}
    joinedCommunities={joinedCommunities}
      setJoinedCommunities={setJoinedCommunities}
        onJoinCommunity={async (communityId) => {
              await CommunityMembershipService.toggle(communityId);
                  await loadJoinedCommunities();
                  }}
          onOpenCommunity={(community) => {
              setSelectedCommunity(community);
              setScreen("communityDetail");
            }}
            onCreateCommunity={() => setScreen("createCommunity")}
          />
        );

                  case "createCommunity":
                      return (
                          <CreateCommunity
                                onBack={() => setScreen("discoverCommunities")}
                                    />
                                      );

case "communityDetail":
        if (!selectedCommunity) {
          return (
            <DiscoverCommunities
              onBack={() => setScreen("home")}
              joinedCommunities={joinedCommunities}
              setJoinedCommunities={setJoinedCommunities}
              onJoinCommunity={async (communityId) => {
                await CommunityMembershipService.toggle(communityId);
                await loadJoinedCommunities();
              }}
              onOpenCommunity={(community) => {
                setSelectedCommunity(community);
                setScreen("communityDetail");
              }}
              onCreateCommunity={() => setScreen("createCommunity")}
            />
          );
        }

        return (
            <CommunityDetail
                  community={selectedCommunity}
                        onBack={() => setScreen("discoverCommunities")}
                            onJoin={async () => {
                                  await CommunityMembershipService.toggle(selectedCommunity.id);

                                      // Refresh joined state
                                          await loadJoinedCommunities();

                                              // Refresh the selected community
                                                  const { data, error } = await supabase
                                                          .from("communities")
                                                                  .select("*")
                                                                          .eq("id", selectedCommunity.id)
                                                                                  .single();

                                                                                      if (!error && data) {
                                                                                              setSelectedCommunity(data);
                                                                                                  }
                                                                                                  }}
                            
                              joined={joinedCommunities.includes(selectedCommunity?.id)}
                                                />
                                                  );
                                                  

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    default:
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          return (
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  <Welcome
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            onContinue={() => setScreen("login")}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    />
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          );
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            }

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            export default App;