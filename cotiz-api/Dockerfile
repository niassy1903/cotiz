FROM php:8.4-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends $PHPIZE_DEPS libssl-dev unzip \
    && pecl install mongodb-1.21.5 \
    && docker-php-ext-enable mongodb \
    && a2enmod rewrite \
    && apt-get purge -y --auto-remove $PHPIZE_DEPS libssl-dev \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html
COPY . .

RUN mkdir -p storage/framework/cache/data storage/framework/sessions \
        storage/framework/testing storage/framework/views storage/logs bootstrap/cache \
    && composer install \
        --no-dev \
        --no-interaction \
        --no-progress \
        --prefer-dist \
        --optimize-autoloader \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/render-entrypoint
RUN sed -i 's/^Listen 80$/Listen 10000/' /etc/apache2/ports.conf \
    && chmod +x /usr/local/bin/render-entrypoint

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr

EXPOSE 10000

CMD ["sh", "/usr/local/bin/render-entrypoint"]
