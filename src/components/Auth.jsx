import { useState } from "react";
import { supabase } from "../supabaseClient";
import "./Auth.css";

export default function Auth() {
  const [email, setEmail] = useState(""); 
  const [loading, setLoading] = useState(false); 
  const [status, setStatus] = useState({type: "", text: ""});   

  const handleSendLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({type: "", text: ""}); 

    const {error} = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: window.location.origin,
        shouldCreateUser: false
      }    
    });

    setLoading(false);
    if (error) {
      setStatus({type: "error", text: "Ошибка входа. Проверьте правильность введенного адреса."});
    } else {
      setStatus({type: "success", text: "Ссылка для входа отправлена на вашу почту!"});
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Частная галерея Kept Photos</h1>
        <p>Добро пожаловать!</p>
        
        <form onSubmit={handleSendLink}>
          <input
            type="email"
            placeholder="Введите ваш email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Отправка..." : "Войти в галерею"}
          </button>
        </form>

        {status.text && (
          <p className={`status-message ${status.type}`}>{status.text}</p>
        )}
      </div>
    </div>
  );
}