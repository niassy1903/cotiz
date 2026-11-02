#!/bin/sh
set -eu

port="${PORT:-10000}"

case "$port" in
    ''|*[!0-9]*)
        printf 'Invalid PORT: expected a number, got "%s"\n' "$port" >&2
        exit 1
        ;;
esac

if [ "$port" -lt 1 ] || [ "$port" -gt 65535 ]; then
    printf 'Invalid PORT: expected a value between 1 and 65535, got "%s"\n' "$port" >&2
    exit 1
fi

sed -i "s/^Listen 10000$/Listen ${port}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \\*:10000>/<VirtualHost *:${port}>/" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
