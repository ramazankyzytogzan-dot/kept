import os
import pandas as pd
import requests

# Ваш репозиторий
REPO = "ramazankyzytozan-dot/kept"

# Токен берется из переменных окружения
token = os.environ.get("GH_TOKEN")
headers = {"Authorization": f"Bearer {token}"} if token else {}

url = f"https://api.github.com/repos/{REPO}/actions/runs"
response = requests.get(url, headers=headers, params={"per_page": 100})

if response.status_code == 200:
  runs_data = response.json().get("workflow_runs", [])
  if runs_data:
    runs = pd.json_normalize(runs_data)
    ok = runs[
        (runs["conclusion"] == "success") & (runs["head_branch"] == "main")
    ]
    ok = ok.assign(created_at=pd.to_datetime(ok["created_at"]))
    print("Всего успешных запусков на main:", len(ok))
    if not ok.empty:
      print(
          "Развёртываний в неделю (медиана):",
          ok.set_index("created_at").resample("W").size().median(),
      )
  else:
    print("Запусков не найдено.")
else:
  print(f"Ошибка запроса к API: {response.status_code}, {response.text}")
