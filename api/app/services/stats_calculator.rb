# 記述統計 + Pearson 相関。Rust(engine) / TS(frontend) と同一仕様。
#   入力 grid: 文字列セルの2次元配列 (1行目=ヘッダ)
#   出力: { descriptive: [...], correlation: { columns:, matrix: } }
class StatsCalculator
  def initialize(grid)
    @grid = grid
  end

  def call
    {
      descriptive: numeric_indices.map { |c| describe(c) },
      correlation: correlation_matrix
    }
  end

  private

  def parse_num(str)
    s = str.to_s.strip
    return nil if s.empty?
    f = Float(s, exception: false)
    return nil if f.nil? || !f.finite?
    f
  end

  def header(col)
    h = @grid[0][col].to_s.strip
    h.empty? ? "col#{col + 1}" : h
  end

  # 1つでも数値を含む列のインデックス
  def numeric_indices
    return [] if @grid.length < 2
    cols = @grid[0].length
    (0...cols).select do |c|
      @grid[1..].any? { |row| !parse_num(row[c]).nil? }
    end
  end

  def column_values(col)
    @grid[1..].filter_map { |row| parse_num(row[col]) }
  end

  # 線形補間の分位数 (numpy 既定 'linear' 相当)。sorted は昇順。
  def quantile(sorted, q)
    return Float::NAN if sorted.empty?
    return sorted[0] if sorted.length == 1
    pos = (sorted.length - 1) * q
    base = pos.floor
    rest = pos - base
    if base + 1 < sorted.length
      sorted[base] + rest * (sorted[base + 1] - sorted[base])
    else
      sorted[base]
    end
  end

  def describe(col)
    xs = column_values(col)
    n = xs.length
    mean = xs.sum / n
    variance = n > 1 ? xs.sum { |x| (x - mean)**2 } / (n - 1) : 0.0
    sorted = xs.sort
    {
      column: header(col),
      n: n,
      mean: mean,
      std: Math.sqrt(variance),
      min: sorted.first,
      q1: quantile(sorted, 0.25),
      median: quantile(sorted, 0.5),
      q3: quantile(sorted, 0.75),
      max: sorted.last
    }
  end

  def pearson(a, b)
    n = [a.length, b.length].min
    return Float::NAN if n < 2
    ma = a.first(n).sum / n
    mb = b.first(n).sum / n
    cov = va = vb = 0.0
    n.times do |i|
      da = a[i] - ma
      db = b[i] - mb
      cov += da * db
      va += da * da
      vb += db * db
    end
    return Float::NAN if va.zero? || vb.zero?
    cov / Math.sqrt(va * vb)
  end

  def correlation_matrix
    idx = numeric_indices
    columns = idx.map { |c| header(c) }
    matrix = Array.new(idx.length) { Array.new(idx.length, Float::NAN) }

    idx.each_index do |i|
      (i...idx.length).each do |j|
        ci = idx[i]
        cj = idx[j]
        a = []
        b = []
        @grid[1..].each do |row|
          va = parse_num(row[ci])
          vb = parse_num(row[cj])
          if !va.nil? && !vb.nil?
            a << va
            b << vb
          end
        end
        r = i == j ? 1.0 : pearson(a, b)
        matrix[i][j] = r
        matrix[j][i] = r
      end
    end

    { columns: columns, matrix: matrix }
  end
end
