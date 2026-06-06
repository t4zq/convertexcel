require "json"
require "fileutils"

# 薄いAPI: グリッド(2次元文字列配列)を名前付きで保存・取得する。
# 計算は行わない。永続化は単純な JSON ファイル。
class DatasetsController < ApplicationController
  STORE = Rails.root.join("storage", "datasets.json")

  # GET /api/datasets → 保存済み名の一覧
  def index
    render json: { datasets: load_all.keys.sort }
  end

  # POST /api/datasets  body: { name: "実験1", rows: [["x","y"],["1","2"]] }
  def create
    name = params[:name].to_s.strip
    return render json: { error: "name は必須です" }, status: :unprocessable_entity if name.empty?

    rows = Array(params[:rows]).map { |r| Array(r).map(&:to_s) }
    data = load_all
    data[name] = { "rows" => rows, "updated_at" => Time.now.utc.iso8601 }
    save_all(data)
    render json: { name: name, count: rows.length }, status: :created
  end

  # GET /api/datasets/:name
  def show
    entry = load_all[params[:name].to_s]
    return render json: { error: "見つかりません" }, status: :not_found if entry.nil?
    render json: { name: params[:name], rows: entry["rows"], updated_at: entry["updated_at"] }
  end

  private

  def load_all
    return {} unless File.exist?(STORE)
    JSON.parse(File.read(STORE))
  rescue JSON::ParserError
    {}
  end

  def save_all(data)
    FileUtils.mkdir_p(File.dirname(STORE))
    File.write(STORE, JSON.pretty_generate(data))
  end
end
