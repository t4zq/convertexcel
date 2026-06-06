require_relative "boot"

require "rails"
require "action_controller/railtie"

Bundler.require(*Rails.groups)

module ConvertexcelApi
  class Application < Rails::Application
    config.load_defaults 7.1

    # API 専用 (ビュー/セッション/アセット等を読み込まない)
    config.api_only = true
    config.eager_load = false

    # autoload paths: app/services 等
    config.autoload_paths << Rails.root.join("app", "services")
  end
end
