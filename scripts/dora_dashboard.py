import os
import pandas as pd
import requests
import matplotlib.pyplot as plt

# Настройки подключения
REPO = "ramazankyzytozan-dot/kept"
token = os.environ.get("GH_TOKEN")
headers = {"Authorization": f"Bearer {token}"} if token else {}

# Запрос к GitHub API за историей запусков
url = f"https://api.github.com/repos/{REPO}/actions/runs"
response = requests.get(url, headers=headers, params={"per_page": 100})

if response.status_code == 200:
    runs_data = response.json().get("workflow_runs", [])
    if runs_data:
        runs = pd.json_normalize(runs_data)
        
        # Фильтрация успешных деплоев на main
        ok = runs[(runs["conclusion"] == "success") & (runs["head_branch"] == "main")].copy()
        ok["created_at"] = pd.to_datetime(ok["created_at"])
        ok = ok.sort_values("created_at")
        
        # Подготовка данных для графиков
        ok['date'] = ok['created_at'].dt.date
        deploy_counts = ok.groupby('date').size()

        # Строим график частоты развертываний
        plt.figure(figsize=(10, 5))
        deploy_counts.plot(kind='bar', color='skyblue', edgecolor='black')
        plt.title('DORA Metrics: Частота развертываний (Deployment Frequency)')
        plt.xlabel('Дата')
        plt.ylabel('Количество успешных деплоев')
        plt.grid(axis='y', linestyle='--', alpha=0.7)
        plt.xticks(rotation=45)
        plt.tight_layout()
        
        # Сохранение графика в файл для отчёта
        plt.savefig('dora_deployments.png')
        print("График успешно сохранен в файл dora_deployments.png!")
        plt.show()
    else:
        print("Запусков не найдено.")
else:
    print(f"Ошибка запроса к API: {response.status_code}, {response.text}")
