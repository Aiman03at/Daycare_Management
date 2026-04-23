import { useEffect, useState } from "react";
import { api } from "../api/client";
import { useNavigate } from "react-router-dom";
import { setAuthSession, getToken } from "../auth/session";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) {
      navigate("/");
    }
  }, [navigate]);

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password
      });
      console.log(res.data);

      setAuthSession(res.data.token, res.data.user);
      navigate("/");
      alert("Login success");

    } catch (err) {
      alert("Login failed");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        placeholder="Password"
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} disabled={isLoading}>
        {isLoading ? "Signing In..." : "Login"}
      </button>
    </div>
  );
}
