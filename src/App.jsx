import { useState } from "react";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import CommunityEntrance from "./pages/CommunityEntrance";
import Home from "./pages/Home";
function App() {
  const [screen, setScreen] = useState("welcome");

    switch (screen) {
        case "login":
            return (
                <Login
                      onRegister={() => setScreen("register")}
                            onSuccess={() => setScreen("profile")}
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
      return <Home />;
                                      default:
                                            return <Welcome onContinue={() => setScreen("login")} />;
                                              }
                                              }

                                              export default App;