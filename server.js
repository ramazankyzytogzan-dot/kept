const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Индивидуальный маршрут по заданию
app.get("/api/student", (req, res) => {
  res.json({
    student: "Ваши Фамилия Имя",
    group: "Ваша группа",
    lab: 9
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});