Rails.application.routes.draw do
  get  "/api/health", to: "health#show"

  # 薄いAPI: データセット(grid)の永続化
  get  "/api/datasets",       to: "datasets#index"
  post "/api/datasets",       to: "datasets#create"
  get  "/api/datasets/:name", to: "datasets#show", constraints: { name: /[^\/]+/ }
end
