class StatsController < ApplicationController
  # POST /api/stats
  # body: { "rows": [["x","A"], ["1","2.1"], ...] }  (1行目=ヘッダ)
  def create
    grid = Array(params[:rows]).map { |row| Array(row).map(&:to_s) }
    render json: StatsCalculator.new(grid).call
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  # GET /api/health
  def health
    render json: { status: "ok" }
  end
end
