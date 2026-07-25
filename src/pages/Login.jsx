import "../styles/login.css";

function Login() {
  return (
      <div className="login-screen">

            <h1>Welcome Back</h1>

                  <input
                          type="email"
                                  placeholder="Email"
                                        />

                                              <input
                                                      type="password"
                                                              placeholder="Password"
                                                                    />

                                                                          <button>Sign In</button>

                                                                                <button className="secondary">
                                                                                        Create Account
                                                                                              </button>

                                                                                                  </div>
                                                                                                    );
                                                                                                    }

                                                                                                    export default Login;