import { useState } from "react";
import supabase from "../lib/supabase";
import "../styles/login.css";
import Register from "./Register";

function Login() {
  const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
      const [loading, setLoading] = useState(false);
        const [showRegister, setShowRegister] = useState(false);

          async function signIn() {
              setLoading(true);

                  const { error } = await supabase.auth.signInWithPassword({
                        email,
                              password,
                                  });

                                      setLoading(false);

                                          if (error) {
                                                alert(error.message);
                                                    } else {
                                                          alert("Signed in successfully!");
                                                              }
                                                                }

                                                                  if (showRegister) {
                                                                      return (
                                                                            <Register
                                                                                    onBack={() => setShowRegister(false)}
                                                                                          />
                                                                                              );
                                                                                                }

                                                                                                  return (
                                                                                                      <div className="login-screen">
                                                                                                            <h1>Welcome Back</h1>

                                                                                                                  <input
                                                                                                                          type="email"
                                                                                                                                  placeholder="Email"
                                                                                                                                          value={email}
                                                                                                                                                  onChange={(e) => setEmail(e.target.value)}
                                                                                                                                                        />

                                                                                                                                                              <input
                                                                                                                                                                      type="password"
                                                                                                                                                                              placeholder="Password"
                                                                                                                                                                                      value={password}
                                                                                                                                                                                              onChange={(e) => setPassword(e.target.value)}
                                                                                                                                                                                                    />

                                                                                                                                                                                                          <button onClick={signIn} disabled={loading}>
                                                                                                                                                                                                                  {loading ? "Please wait..." : "Sign In"}
                                                                                                                                                                                                                        </button>

                                                                                                                                                                                                                              <button
                                                                                                                                                                                                                                      className="secondary"
                                                                                                                                                                                                                                              onClick={() => setShowRegister(true)}
                                                                                                                                                                                                                                                      disabled={loading}
                                                                                                                                                                                                                                                            >
                                                                                                                                                                                                                                                                    Create Account
                                                                                                                                                                                                                                                                          </button>
                                                                                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                                                                                );
                                                                                                                                                                                                                                                                                }

                                                                                                                                                                                                                                                                                export default Login;