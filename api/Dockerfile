FROM ruby:3.3-bookworm

WORKDIR /app

# 依存だけ先に入れてレイヤキャッシュを効かせる
COPY Gemfile ./
RUN bundle install

COPY . .

EXPOSE 3000

CMD ["bundle", "exec", "puma", "-C", "config/puma.rb"]
