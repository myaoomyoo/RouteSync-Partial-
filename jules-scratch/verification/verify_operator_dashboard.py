from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Increase timeout to 60 seconds
    page.set_default_timeout(60000)

    try:
        # Sign up a new operator user
        page.goto("http://localhost:3001/signup")
        page.fill('input[name="name"]', "Test Operator")
        page.fill('input[name="email"]', "operator@test.com")
        page.fill('input[name="password"]', "password123")
        page.select_option('select[name="role"]', "operator")
        page.click('button[type="submit"]')
        page.wait_for_load_state('networkidle')

        # Log in as the operator
        page.goto("http://localhost:3001/login")
        page.fill('input[name="email"]', "operator@test.com")
        page.fill('input[name="password"]', "password123")
        page.click('button[type="submit"]')

        # Wait for navigation to the operator dashboard and for the columns to be visible
        page.wait_for_url("**/dashboard/operator")
        page.wait_for_selector(".columns", state="visible")

        # Take a screenshot
        page.screenshot(path="jules-scratch/verification/operator_dashboard.png")
        print("Screenshot taken of operator dashboard.")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)