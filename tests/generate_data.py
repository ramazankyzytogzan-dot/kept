import random

# Фиксированное зерно для воспроизводимости дефектов
random.seed(42)

def generate_mock_gallery_items(count=5):
    sample_titles = [
        "Sunset in mountains", 
        "Code screenshot", 
        "Arch Linux desktop", 
        "Cat sleeping", 
        "Empty state design"
    ]
    
    items = []
    for i in range(1, count + 1):
        items.append({
            "id": f"img-uuid-00{i}",
            "title": random.choice(sample_titles),
            "image_url": f"https://example.com/mock-image-{i}.jpg",
            "is_private": True,
            "owner_id": f"user-uuid-10{i}"
        })
    return items

if __name__ == "__main__":
    print("Сгенерированные тестовые данные с fixed seed (42):")
    data = generate_mock_gallery_items(3)
    for item in data:
        print(item)
