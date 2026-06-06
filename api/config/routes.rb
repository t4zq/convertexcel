Rails.application.routes.draw do
  get  "/api/health", to: "stats#health"

  # 計算は原則 Rust(WASM) が担当。stats は任意の代替計算経路として残す。
  post "/api/stats",  to: "stats#create"

  # 薄いAPI: データセット(grid)の永続化
  get  "/api/datasets",       to: "datasets#index"
  post "/api/datasets",       to: "datasets#create"
  get  "/api/datasets/:name", to: "datasets#show", constraints: { name: /[^\/]+/ }
end
