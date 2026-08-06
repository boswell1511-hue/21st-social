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
  const [screen, setScreen] = useState("welcome");
    const [selectedUserId, setSelectedUserId] = useState(null);
       const [selectedCommunity, setSelectedCommunity] = useState(null);
const [joinedCommunities, setJoinedCommunities] = useState([]);
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