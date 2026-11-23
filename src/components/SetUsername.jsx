import { useState } from "react";
import { supabase } from "../supabaseClient";
import "./SetUsername.css"; 

const isValidPasscode = (code) => {
  const match = code.trim().match(/^SAM-([1-9]|10)$/);
  return Boolean(match); 
};

export default function SetUsername({session, onProfileCreated}) {
  const [username, setUsername] = useState("");
  const [passcode, setPasscode] = useState(""); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    const cleanName = username.trim();
    const cleanPasscode = passcode.trim();

    if (!cleanName) return; 

    if (!isValidPasscode(cleanPasscode)) {
      setError("Неверный пароль. Используйте формат от SAM-1 до SAM-10.");
      return; 
    } 

    setLoading(true);
    setError("");

    try {
      // 1. Проверяем, существует ли уже профиль с таким именем и паролем в базе
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", cleanName)
        .eq("passcode", cleanPasscode)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingProfile) {
        // Если такой профиль есть, но у него другой id (другая анонимная сессия),
        // обновляем его под текущий session.user.id с помощью upsert
        const { data: upsertedData, error: upsertError } = await supabase
          .from("profiles")
          .upsert(
            { id: session.user.id, username: cleanName, passcode: cleanPasscode },
            { onConflict: 'username' }
          )
          .select()
          .single();

        if (upsertError) throw upsertError;
        onProfileCreated(upsertedData);

      } else {
        // 2. Если профиль с таким именем и паролем не найден, пробуем создать или перепривязать
        const { data: newProfile, error: insertError } = await supabase
          .from("profiles")
          .upsert(
            { id: session.user.id, username: cleanName, passcode: cleanPasscode },
            { onConflict: 'id' }
          )
          .select()
          .single();

        if (insertError) {
          if (insertError.code === "23505") {
            setError("Это имя уже занято с другим паролем. Выберите другое.");
          } else {
            setError(insertError.message);
          }
        } else {
          onProfileCreated(newProfile);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false); 
    }
  };

  return(
    <main className="setUsername-container">
      <h1>Исторические фотографии SAM</h1>

      <h2>Добро пожаловать!</h2>
      <p className="setUsername-message">
        Введите ваше имя и пароль для входа.
      </p>

      <form className="setUsername-form" onSubmit={handleSubmit}>
        <input 
         className="setUsername-input"
         type="text" 
         value={username}
         placeholder="Имя пользователя"
         maxLength={20}
         onChange={(e) => setUsername(e.target.value)}
         required
        />

        <input 
         className="setUsername-input"
         type="text"
         value={passcode}
         placeholder="Пароль (например, SAM-1)"
         onChange={(e) => setPasscode(e.target.value)}
         required
        />

        <button
         className="setUsername-btn"
         type="submit"
         disabled={loading}
         style={{cursor: loading ? "not-allowed" : "pointer"}}
        >
         {loading ? "Вход..." : "Войти в галерею"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}
    </main>
  );
}