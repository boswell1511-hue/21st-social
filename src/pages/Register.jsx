import { useState } from "react";
import supabase from "../lib/supabase";
import "../styles/login.css";

function Register({ onBack }) {
  const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
      const [loading, setLoading] = useState(false);

        async function createAccount() {
            setLoading(true);

                const { error } = await supabase.auth.signUp({
                      email,
                            password,
                                });

                                    setLoading(false);

                                        if (error) {
                                              alert(error.message);
                                                  } else {
                                                        alert("Account created! Check your email to confirm your account.");
                                                            }
                                                              }

                                                                return (
                                                                    <div className="login-screen">
                                                                          <h1>Create Account</h1>

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

                                                                                                                                                                        <button onClick={createAccount} disabled={loading}>
                                                                                                                                                                                {loading ? "Please wait..." : "Create Account"}
                                                                                                                                                                                      </button>

                                                                                                                                                                                            <button className="secondary" onClick={onBack}>
                                                                                                                                                                                                    Back to Login
                                                                                                                                                                                                          </button>
                                                                                                                                                                                                              </div>
                                                                                                                                                                                                                );
                                                                                                                                                                                                                }

                                                                                                                                                                                                                export default Register;