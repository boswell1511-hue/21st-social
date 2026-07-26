import { useState } from "react";
import supabase from "../lib/supabase";
import "../styles/login.css";

function Login({ onRegister, onSuccess }) {
  const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
      const [loading, setLoading] = useState(false);

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
                                                        onSuccess();
                                                            }
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
                                                                                                                                                                                                            onClick={onRegister}
                                                                                                                                                                                                                    disabled={loading}
                                                                                                                                                                                                                          >
                                                                                                                                                                                                                                  Create Account
                                                                                                                                                                                                                                        </button>
                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                              }

                                                                                                                                                                                                                                              export default Login;