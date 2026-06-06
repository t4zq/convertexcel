# フロント (Vite dev server: localhost:5173) からの呼び出しを許可する。
Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "*"
    resource "/api/*",
      headers: :any,
      methods: [:get, :post, :options]
  end
end
