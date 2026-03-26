import base64
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import time

class ScreenshotCapture:
    def __init__(self):
        self.driver = None
    
    def capture_screenshot(self, url):
        """Capture screenshot of suspicious page for evidence"""
        try:
            chrome_options = Options()
            chrome_options.add_argument('--headless')
            chrome_options.add_argument('--no-sandbox')
            chrome_options.add_argument('--disable-dev-shm-usage')
            
            driver = webdriver.Chrome(options=chrome_options)
            driver.get(url)
            time.sleep(2)  # Wait for page load
            
            screenshot = driver.get_screenshot_as_base64()
            driver.quit()
            
            return screenshot
        except Exception as e:
            print(f"Screenshot failed: {e}")
            return None