import { useState } from "react";
import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";

function App() {
  const [screen, setScreen] = useState("welcome");

    switch (screen) {
        case "login":
              return <Login />;

                  case "register":
                        return <Register />;

                            case "profile":
                                  return <ProfileSetup />;

                                      default:
                                            return <Welcome onContinue={() => setScreen("login")} />;
                                              }
                                              }

                                              export default App;