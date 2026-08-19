#!/usr/bin/env python3
import os
import sys
import requests
import json

def send_genesio_message(context_decisao):
    """Send message to Telegram via Genesio bridge"""
    # Load credentials from environment or config file
    telegram_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    telegram_chat_id = os.environ.get('TELEGRAM_CHAT_ID') or os.environ.get('TELEGRAM_CHAT_ID_PESSOAL')
    
    # Try to load from credentials file as fallback
    if not telegram_token or not telegram_chat_id:
        try:
            credentials_path = os.path.expanduser('~/.config/opencode/state/credentials.env')
            if os.path.exists(credentials_path):
                with open(credentials_path, 'r') as f:
                    for line in f:
                        if line.startswith('TELEGRAM_BOT_TOKEN='):
                            telegram_token = line.split('=', 1)[1].strip()
                        elif line.startswith('TELEGRAM_CHAT_ID='):
                            telegram_chat_id = line.split('=', 1)[1].strip()
        except Exception as e:
            print(f"Error loading credentials: {e}")
    
    if not telegram_token or not telegram_chat_id:
        print("Error: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured")
        return False
    
    url = f"https://api.telegram.org/bot{telegram_token}/sendMessage"
    payload = {
        'chat_id': telegram_chat_id,
        'text': context_decisao,
        'parse_mode': 'HTML'
    }
    
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        result = response.json()
        if result.get('ok'):
            print("Message sent successfully via Genesio bridge")
            return True
        else:
            print(f"Telegram API error: {result}")
            return False
    except Exception as e:
        print(f"Failed to send message: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3 or sys.argv[1] != "--send":
        print("Usage: python genesio-bridge.py --send \"<context + decisao>\"")
        sys.exit(1)
    
    context_decisao = sys.argv[2]
    success = send_genesio_message(context_decisao)
    sys.exit(0 if success else 1)
