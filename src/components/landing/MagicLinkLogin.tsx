import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";

const MagicLinkLogin: React.FC = () => {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = await signInWithMagicLink(email);
    if (error) {
      setMessage("Error sending magic link: " + error.message);
    } else {
      setMessage("Check your email for the magic link!");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-sm mx-auto">
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        required
        onChange={e => setEmail(e.target.value)}
        className="border p-2 rounded"
      />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">
        Continue 
      </button>
      {message && <div>{message}</div>}
    </form>
  );
};

export default MagicLinkLogin;
