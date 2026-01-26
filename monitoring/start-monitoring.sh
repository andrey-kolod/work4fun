#!/usr/bin/env bash
# /monitoring/start-monitoring.sh

# Запускает monitoring stack из корня проекта
# .env лежит в корне проекта

set -euo pipefail

echo "[monitoring] Старт скрипта запуска monitoring stack"

if [[ ! -f ".env" ]]; then
  echo "[monitoring][error] .env не найден. Скрипт должен запускаться из корня проекта."
  exit 1
fi

ENV_FILE=".env"
COMPOSE_FILE="monitoring/docker-compose.yml"

if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "[monitoring][error] Файл $COMPOSE_FILE не найден"
  exit 1
fi

# Обязательные переменные из .env
required_vars=("GRAFANA_ADMIN_PASSWORD" "GRAFANA_ADMIN_USER" "METRICS_PROMETHEUS_TOKEN" "SERVICE_NAME" "ALERTING_BOT_API_TOKEN" "ALERTING_TLG_CHAT_ID")
missing=()
for var in "${required_vars[@]}"; do
  if ! grep -q "^${var}=" "$ENV_FILE"; then
    missing+=("$var")
  fi
done

if [[ ${#missing[@]} -gt 0 ]]; then
  echo "[monitoring][error] Отсутствуют обязательные переменные в .env:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

SERVICE_NAME=$(grep -m 1 '^SERVICE_NAME=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r\n\t ' | tr -cd '[:alnum:]-_')
SERVICE_NAME=${SERVICE_NAME:-work4fun}

METRICS_TOKEN=$(grep -m 1 '^METRICS_PROMETHEUS_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r\n\t ' | tr -cd '[:alnum:]-_')
GRAFANA_ADMIN_PASSWORD=$(grep -m 1 '^GRAFANA_ADMIN_PASSWORD=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r\n\t ')
GRAFANA_ADMIN_USER=$(grep -m 1 '^GRAFANA_ADMIN_USER=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r\n\t ')
ALERTING_BOT_API_TOKEN=$(grep -m 1 '^ALERTING_BOT_API_TOKEN=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r\n\t ')
ALERTING_TLG_CHAT_ID=$(grep -m 1 '^ALERTING_TLG_CHAT_ID=' "$ENV_FILE" | cut -d= -f2- | tr -d '\r\n\t ')

if [[ -z "$METRICS_TOKEN" ]]; then
  echo "[monitoring][error] METRICS_PROMETHEUS_TOKEN пустой или не найден"
  exit 1
fi

if [[ -z "$GRAFANA_ADMIN_PASSWORD" ]]; then
  echo "[monitoring][error] GRAFANA_ADMIN_PASSWORD пустой или не найден"
  exit 1
fi

if [[ -z "$GRAFANA_ADMIN_USER" ]]; then
  echo "[monitoring][error] GRAFANA_ADMIN_USER пустой или не найден"
  exit 1
fi

if [[ -z "$ALERTING_BOT_API_TOKEN" ]]; then
  echo "[monitoring][error] ALERTING_BOT_API_TOKEN пустой или не найден"
  exit 1
fi

if [[ -z "$ALERTING_TLG_CHAT_ID" ]]; then
  echo "[monitoring][error] ALERTING_TLG_CHAT_ID пустой или не найден"
  exit 1
fi

echo "[monitoring] Подготовка директории secrets..."
rm -rf monitoring/secrets
mkdir -p monitoring/secrets

# prometheus_token и service_name
printf '%s' "$METRICS_TOKEN" > monitoring/secrets/prometheus_token.txt
printf '%s' "$SERVICE_NAME" > monitoring/secrets/service_name.txt

# НОВОЕ: создаём файлы для Telegram alerting на основе env
printf '%s' "$ALERTING_BOT_API_TOKEN" > monitoring/secrets/telegram_bot_token.txt
printf '%s' "$ALERTING_TLG_CHAT_ID" > monitoring/secrets/telegram_chat_id.txt

echo "[monitoring] Содержимое monitoring/secrets/prometheus_token.txt (с -A):"
cat -A monitoring/secrets/prometheus_token.txt || true
echo ""
echo "[monitoring] Содержимое monitoring/secrets/service_name.txt (с -A):"
cat -A monitoring/secrets/service_name.txt || true
echo ""

TOKEN_LEN=$(wc -c < monitoring/secrets/prometheus_token.txt | awk '{print $1}')
TOKEN_FIRST=$(head -c 16 monitoring/secrets/prometheus_token.txt | tr -d '\n\r\t ')
NAME_LEN=$(wc -c < monitoring/secrets/service_name.txt | awk '{print $1}')

echo "[monitoring] Подготовлены секреты:"
echo "  monitoring/secrets/prometheus_token.txt      ← длина ${TOKEN_LEN} байт (первые 16: ${TOKEN_FIRST}...)"
echo "  monitoring/secrets/service_name.txt          ← ${SERVICE_NAME} (длина ${NAME_LEN} байт)"
echo "  monitoring/secrets/telegram_bot_token.txt    ← создан из .env (значение не логируем)"
echo "  monitoring/secrets/telegram_chat_id.txt      ← создан из .env (значение не логируем)"
echo "  префикс контейнеров                          ← ${SERVICE_NAME}"

echo "[monitoring] Генерация contact_points.yml из файлов-секретов..."
bash monitoring/scripts/generate-contact-points.sh

echo "[monitoring] Останавливаем старые ресурсы и удаляем volume..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down -v --remove-orphans || true

echo "[monitoring] Запускаем monitoring stack..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --remove-orphans

echo ""
echo "[monitoring] Monitoring запущен (префикс: ${SERVICE_NAME})"
echo "Grafana:    http://localhost:${GRAFANA_PORT:-3001}"
echo "Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
echo ""
echo "Логин Grafana: ${GRAFANA_ADMIN_USER}"
echo "Пароль:        ${GRAFANA_ADMIN_PASSWORD:0:4}... (скрыто)"
echo ""
echo "Проверить статус контейнеров:"
echo "  docker compose -f '$COMPOSE_FILE' ps"
echo ""
echo "Проверить targets в Prometheus (должен быть UP):"
echo "  http://localhost:${PROMETHEUS_PORT:-9090}/targets"
echo ""
echo "Тест авторизации (должен вернуть метрики):"
echo "  curl -v -H \"Authorization: Bearer \$(cat monitoring/secrets/prometheus_token.txt)\" http://localhost:3000/api/metrics"
echo ""
echo "Последние логи Prometheus (ищем 401 или ошибки scrape):"
echo "  docker compose -f '$COMPOSE_FILE' logs prometheus --tail=50 | grep -i 'scrape\\|nextjs\\|401\\|error\\|unauthorized'"
