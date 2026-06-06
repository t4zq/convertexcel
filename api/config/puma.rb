environment ENV.fetch("RAILS_ENV", "development")

# コンテナ内で全インターフェースから待ち受ける (port と二重指定しない)
bind "tcp://0.0.0.0:#{ENV.fetch('PORT', 3000)}"

workers ENV.fetch("WEB_CONCURRENCY", 0).to_i
threads_count = ENV.fetch("RAILS_MAX_THREADS", 5).to_i
threads threads_count, threads_count
