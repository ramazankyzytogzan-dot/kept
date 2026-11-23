import time
 
from playwright.sync_api import Page, expect
 
BASE_URL = "http://localhost:5173"
PASSCODE = "SAM-2"
 
 
def unique_username() -> str:
    # Уникальное имя на каждый запуск, чтобы тесты не конфликтовали с уже созданными профилями
    return f"Test{int(time.time() * 1000)}"
 
 
def login(page: Page, username: str, passcode: str = PASSCODE):
    page.goto(BASE_URL)
    page.get_by_placeholder("Имя пользователя").fill(username)
    page.get_by_placeholder("Пароль").fill(passcode)
    page.get_by_role("button", name="Войти в галерею").click()
 
 
def test_open_login_page(page: Page):
    page.goto(BASE_URL)
    expect(page.get_by_role("heading", name="Исторические фотографии SAM")).to_be_visible()
 
 
def test_elements_visibility(page: Page):
    page.goto(BASE_URL)
    expect(page.get_by_placeholder("Имя пользователя")).to_be_visible()
    expect(page.get_by_placeholder("Пароль")).to_be_visible()
    expect(page.get_by_role("button", name="Войти в галерею")).to_be_visible()
 
 
def test_successful_login(page: Page):
    login(page, unique_username())
    expect(page.get_by_role("button", name="Выйти")).to_be_visible()
    page.screenshot(path="success_login.png")
 
 
def test_form_validation(page: Page):
    page.goto(BASE_URL)
    page.get_by_role("button", name="Войти в галерею").click()
 
    # Пустая форма: остаёмся на экране входа, галерея не открывается
    expect(page.get_by_role("button", name="Войти в галерею")).to_be_visible()
    expect(page.get_by_role("button", name="Выйти")).not_to_be_visible()
 
 
def test_logout(page: Page):
    login(page, unique_username())
    expect(page.get_by_role("button", name="Выйти")).to_be_visible()
 
    page.get_by_role("button", name="Выйти").click()
 
    # После выхода должна снова появиться форма входа (перезагрузка не нужна)
    expect(page.get_by_placeholder("Имя пользователя")).to_be_visible()
    expect(page.get_by_role("button", name="Выйти")).not_to_be_visible()
 
