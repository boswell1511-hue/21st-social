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

                                            async function joinCommunity(communityId) {
                                              const {
                                                  data: { user },
                                                    } = await supabase.auth.getUser();

                                                      if (!user) {
                                                          alert("Please sign in first.");
                                                              return;
                                                                }

                                                                  const { error } = await supabase
                                                                      .from("community_members")
                                                                          .insert({
                                                                                community_id: communityId,
                                                                                      user_id: user.id,
                                                                                            role: "member",
                                                                                                  status: "joined",
                                                                                                      });

                                                                                                        if (error) {
                                                                                                            console.error(error);
                                                                                                                alert(error.message);
                                                                                                                    return;
                                                                                                                      }

                                                                                                                        setJoinedCommunities((current) => [...current, communityId]);
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
        onJoinCommunity={joinCommunity}
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
                              onJoin={() => joinCommunity(selectedCommunity.id)}
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