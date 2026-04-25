from app import create_app
from apscheduler.schedulers.background import BackgroundScheduler
import os
import requests

app = create_app()


def trigger_monthly_billing():
    """Run the monthly billing job in the background."""
    print("Running the monthly billing job...")
    try:
        backend_url = os.getenv('BACKEND_URL', f"http://127.0.0.1:{os.getenv('PORT', '5000')}")
        response = requests.post(f'{backend_url}/api/billing/auto-generate')
        print("Billing job result:", response.json())
    except Exception as e:
        print("Monthly billing job failed:", e)


scheduler = BackgroundScheduler()
scheduler.add_job(func=trigger_monthly_billing, trigger="cron", day=1, hour=0, minute=5)
scheduler.start()


if __name__ == '__main__':
    port = int(os.getenv('PORT', '5000'))
    debug = os.getenv('FLASK_ENV') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug, use_reloader=False)
