#!/usr/bin/env bash
# /monitoring/scripts/generate-contact-points.sh — 100% СТАТИЧЕСКИЙ

set -euo pipefail

echo "[monitoring][contact_points] 🟢 Simple static: $(date +'%H:%M:%S')"

BOT_TOKEN=$(tr -d '\r\n\t ' < "monitoring/secrets/telegram_bot_token.txt")
CHAT_ID=$(tr -d '\r\n\t ' < "monitoring/secrets/telegram_chat_id.txt")

cat > monitoring/grafana/provisioning/alerting/contact_points.yml << EOF
apiVersion: 1
contactPoints:
  - orgId: 1
    name: Telegram Error Notification
    receivers:
      - uid: dfbbvc9e13zlsb
        type: telegram
        settings:
          bottoken: $BOT_TOKEN
          chatid: '$CHAT_ID'
          disable_notification: false
          disable_web_page_preview: false
          parse_mode: ''
          message: |
            🚨 ОШИБКИ В ПРИЛОЖЕНИИ! 
          disableResolveMessage: true
EOF

echo "✅ Готово! Test + Real = работают"
