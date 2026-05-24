#include <string>
#include <vector>
#include <sstream>
#include <algorithm>
#include <cctype>
#include <cstring>
#include <cstdlib>
#include <cmath>
#include <functional>
#include <limits>
#include <emscripten/emscripten.h>

void trim(std::string &s) {
  auto start = s.find_first_not_of(" \t\r\n");
  auto end = s.find_last_not_of(" \t\r\n");
  s = (start == std::string::npos) ? "" : s.substr(start, end - start + 1);
}

bool is_number(const std::string &s) {
  std::string value = s;
  trim(value);
  if (value.empty()) return false;
  char *end = nullptr;
  double parsed = std::strtod(value.c_str(), &end);
  if (end == value.c_str()) return false;
  while (*end != '\0') {
    if (!std::isspace(static_cast<unsigned char>(*end))) return false;
    ++end;
  }
  return std::isfinite(parsed);
}

std::string round_number(const std::string &s, int decimals) {
  if (!is_number(s)) return s;
  if (decimals < 0) decimals = 0;
  
  double value = std::stod(s);
  double multiplier = std::pow(10.0, decimals);
  double rounded = std::round(value * multiplier) / multiplier;
  
  std::ostringstream oss;
  oss.precision(decimals);
  oss << std::fixed << rounded;
  return oss.str();
}

std::string round_significant_figures(const std::string &s, int sig_figs) {
  if (!is_number(s)) return s;
  if (sig_figs <= 0) sig_figs = 1;
  
  double value = std::stod(s);
  if (value == 0.0) return "0";
  
  double abs_value = std::abs(value);
  int exponent = std::floor(std::log10(abs_value));
  double multiplier = std::pow(10.0, sig_figs - 1 - exponent);
  double rounded = std::round(value * multiplier) / multiplier;
  
  // 整数として表示する必要があるか判定
  int decimal_places = std::max(0, sig_figs - 1 - exponent);
  
  std::ostringstream oss;
  if (decimal_places > 0) {
    oss.precision(decimal_places);
    oss << std::fixed << rounded;
  } else {
    oss << std::fixed << rounded;
    std::string result = oss.str();
    // 小数点以下の0を削除
    size_t dot_pos = result.find('.');
    if (dot_pos != std::string::npos) {
      result = result.substr(0, dot_pos);
    }
    return result;
  }
  return oss.str();
}

std::vector<std::string> split(const std::string &line) {
  std::vector<std::string> out;
  std::string cur;
  char delim = line.find('\t') != std::string::npos ? '\t' : ',';
  for (char c : line) {
    if (c == delim) { out.push_back(cur); cur.clear(); }
    else cur += c;
  }
  out.push_back(cur);
  return out;
}

typedef std::vector<std::vector<std::string>> Table;
typedef std::function<std::string(const std::string&)> CellFormatter;

enum RoundMode {
  ROUND_NONE = 0,
  ROUND_DECIMAL = 1,
  ROUND_SIG_FIGS = 2
};

void append_utf8(std::string &out, int cp) {
  if (cp <= 0x7F) {
    out += static_cast<char>(cp);
  } else if (cp <= 0x7FF) {
    out += static_cast<char>(0xC0 | (cp >> 6));
    out += static_cast<char>(0x80 | (cp & 0x3F));
  } else if (cp <= 0xFFFF) {
    out += static_cast<char>(0xE0 | (cp >> 12));
    out += static_cast<char>(0x80 | ((cp >> 6) & 0x3F));
    out += static_cast<char>(0x80 | (cp & 0x3F));
  } else {
    out += static_cast<char>(0xF0 | (cp >> 18));
    out += static_cast<char>(0x80 | ((cp >> 12) & 0x3F));
    out += static_cast<char>(0x80 | ((cp >> 6) & 0x3F));
    out += static_cast<char>(0x80 | (cp & 0x3F));
  }
}

std::vector<int> decode_utf8(const std::string &s) {
  std::vector<int> out;
  for (size_t i = 0; i < s.size();) {
    unsigned char c = static_cast<unsigned char>(s[i]);
    if (c < 0x80) {
      out.push_back(c);
      ++i;
    } else if ((c & 0xE0) == 0xC0 && i + 1 < s.size()) {
      out.push_back(((c & 0x1F) << 6) | (static_cast<unsigned char>(s[i + 1]) & 0x3F));
      i += 2;
    } else if ((c & 0xF0) == 0xE0 && i + 2 < s.size()) {
      out.push_back(((c & 0x0F) << 12) |
                    ((static_cast<unsigned char>(s[i + 1]) & 0x3F) << 6) |
                    (static_cast<unsigned char>(s[i + 2]) & 0x3F));
      i += 3;
    } else if ((c & 0xF8) == 0xF0 && i + 3 < s.size()) {
      out.push_back(((c & 0x07) << 18) |
                    ((static_cast<unsigned char>(s[i + 1]) & 0x3F) << 12) |
                    ((static_cast<unsigned char>(s[i + 2]) & 0x3F) << 6) |
                    (static_cast<unsigned char>(s[i + 3]) & 0x3F));
      i += 4;
    } else {
      out.push_back(c);
      ++i;
    }
  }
  return out;
}

std::string encode_utf8(const std::vector<int> &codepoints) {
  std::string out;
  for (int cp : codepoints) append_utf8(out, cp);
  return out;
}

std::string normalize_fullwidth_ascii(const std::string &s) {
  std::vector<int> normalized;
  for (int cp : decode_utf8(s)) {
    if (cp >= 0xFF01 && cp <= 0xFF5E) {
      normalized.push_back(cp - 0xFEE0);
    } else if (cp == 0x3000) {
      normalized.push_back(' ');
    } else if (cp == 0x201C || cp == 0x201D) {
      normalized.push_back('"');
    } else if (cp == 0x2018 || cp == 0x2019) {
      normalized.push_back('\'');
    } else {
      normalized.push_back(cp);
    }
  }
  return encode_utf8(normalized);
}

bool quote_pair(int open, int close) {
  return (open == '"' && close == '"') ||
         (open == '\'' && close == '\'') ||
         (open == 0x300C && close == 0x300D) ||
         (open == 0x300E && close == 0x300F);
}

std::string strip_wrapping_quotes(const std::string &s) {
  std::string next = s;
  trim(next);
  bool changed = true;
  while (changed) {
    changed = false;
    std::vector<int> cps = decode_utf8(next);
    if (cps.size() >= 2 && quote_pair(cps.front(), cps.back())) {
      cps.erase(cps.begin());
      cps.pop_back();
      next = encode_utf8(cps);
      trim(next);
      changed = true;
    }
  }
  return next;
}

std::string clean_cell(const std::string &cell) {
  std::string out = normalize_fullwidth_ascii(cell);
  trim(out);
  out = strip_wrapping_quotes(out);
  trim(out);
  return out;
}

Table parse(const std::string &input) {
  Table t;
  std::stringstream ss(input);
  std::string line;
  while (std::getline(ss, line)) {
    trim(line);
    if (line.empty()) continue;
    auto cells = split(line);
    for (auto &c : cells) trim(c);
    t.push_back(cells);
  }
  return t;
}

Table prepare_table(const char* input, bool has_header, bool clean_input, bool include_header) {
  if (!input) return Table();
  Table t = parse(input);
  if (clean_input) {
    for (auto &row : t) {
      for (auto &cell : row) {
        cell = clean_cell(cell);
      }
    }
  }
  if (has_header && !include_header && !t.empty()) {
    t.erase(t.begin());
  }
  return t;
}

std::string escape(const std::string &s) {
  std::string out;
  for (char c : s) {
    if (c == '&' || c == '%' || c == '$' || c == '#' || c == '_' || c == '{' || c == '}') out += '\\';
    out += c;
  }
  return out;
}

std::string to_latex_formatted(const Table &t, const CellFormatter &format_cell) {
  if (t.empty()) return "";
  std::string out = "\\begin{tabular}{" + std::string(t[0].size(), 'c') + "}\n\\hline\n";
  for (const auto &row : t) {
    for (size_t i = 0; i < row.size(); ++i) {
      if (i) out += " & ";
      out += escape(format_cell(row[i]));
    }
    out += " \\\\\n";
  }
  return out + "\\hline\n\\end{tabular}";
}

std::string to_latex(const Table &t) {
  return to_latex_formatted(t, [](const std::string &cell) {
    return cell;
  });
}

std::string to_latex_rounded(const Table &t, int decimals) {
  return to_latex_formatted(t, [decimals](const std::string &cell) {
    return round_number(cell, decimals);
  });
}

std::string to_latex_sig_figs(const Table &t, int sig_figs) {
  return to_latex_formatted(t, [sig_figs](const std::string &cell) {
    return round_significant_figures(cell, sig_figs);
  });
}

std::string to_csv_formatted(const Table &t, const CellFormatter &format_cell) {
  std::string out;
  for (size_t i = 0; i < t.size(); ++i) {
    for (size_t j = 0; j < t[i].size(); ++j) {
      if (j) out += ',';
      out += format_cell(t[i][j]);
    }
    if (i + 1 < t.size()) out += '\n';
  }
  return out;
}

std::string to_csv(const Table &t) {
  return to_csv_formatted(t, [](const std::string &cell) {
    return cell;
  });
}

std::string to_csv_rounded(const Table &t, int decimals) {
  return to_csv_formatted(t, [decimals](const std::string &cell) {
    return round_number(cell, decimals);
  });
}

std::string to_csv_sig_figs(const Table &t, int sig_figs) {
  return to_csv_formatted(t, [sig_figs](const std::string &cell) {
    return round_significant_figures(cell, sig_figs);
  });
}

std::string to_graph_csv(const Table &t) {
  return to_csv_formatted(t, [](const std::string &cell) {
    return is_number(cell) ? cell : "nan";
  });
}

std::string to_latex_mode(const Table &t, int mode, int decimals, int sig_figs) {
  if (mode == ROUND_DECIMAL) return to_latex_rounded(t, decimals);
  if (mode == ROUND_SIG_FIGS) return to_latex_sig_figs(t, sig_figs);
  return to_latex(t);
}

std::string to_csv_mode(const Table &t, int mode, int decimals, int sig_figs) {
  if (mode == ROUND_DECIMAL) return to_csv_rounded(t, decimals);
  if (mode == ROUND_SIG_FIGS) return to_csv_sig_figs(t, sig_figs);
  return to_csv(t);
}

struct Point {
  double x;
  double y;
};

struct FitResult {
  bool ok = false;
  std::string method;
  std::string expression;
  std::string tex_expression;
  double r2 = -std::numeric_limits<double>::infinity();
};

struct FitEquation {
  std::string legend;
  std::string equation;
  double r2 = 0.0;
};

struct LinearCoefficients {
  bool ok = false;
  double intercept = 0.0;
  double slope = 0.0;
};

std::string format_double(double value) {
  if (std::abs(value) < 1e-12) value = 0.0;
  std::ostringstream oss;
  oss.precision(10);
  oss << value;
  return oss.str();
}

double r_squared(const std::vector<Point> &points, const std::function<double(double)> &predict) {
  if (points.size() < 2) return -std::numeric_limits<double>::infinity();
  double mean = 0.0;
  for (const auto &p : points) mean += p.y;
  mean /= points.size();

  double sse = 0.0;
  double sst = 0.0;
  for (const auto &p : points) {
    double predicted = predict(p.x);
    if (!std::isfinite(predicted)) return -std::numeric_limits<double>::infinity();
    double residual = p.y - predicted;
    sse += residual * residual;
    double centered = p.y - mean;
    sst += centered * centered;
  }
  if (sst < 1e-12) return sse < 1e-12 ? 1.0 : 0.0;
  return 1.0 - (sse / sst);
}

bool solve_linear_system(std::vector<std::vector<double>> a, std::vector<double> b, std::vector<double> &x) {
  const int n = static_cast<int>(b.size());
  for (int i = 0; i < n; ++i) {
    int pivot = i;
    for (int r = i + 1; r < n; ++r) {
      if (std::abs(a[r][i]) > std::abs(a[pivot][i])) pivot = r;
    }
    if (std::abs(a[pivot][i]) < 1e-12) return false;
    if (pivot != i) {
      std::swap(a[pivot], a[i]);
      std::swap(b[pivot], b[i]);
    }
    double div = a[i][i];
    for (int c = i; c < n; ++c) a[i][c] /= div;
    b[i] /= div;
    for (int r = 0; r < n; ++r) {
      if (r == i) continue;
      double factor = a[r][i];
      for (int c = i; c < n; ++c) a[r][c] -= factor * a[i][c];
      b[r] -= factor * b[i];
    }
  }
  x = b;
  return true;
}

LinearCoefficients linear_coefficients(const std::vector<Point> &points) {
  LinearCoefficients coeffs;
  if (points.size() < 2) return coeffs;

  double sx = 0.0, sy = 0.0, sxx = 0.0, sxy = 0.0;
  for (const auto &p : points) {
    sx += p.x;
    sy += p.y;
    sxx += p.x * p.x;
    sxy += p.x * p.y;
  }

  double n = static_cast<double>(points.size());
  double denom = n * sxx - sx * sx;
  if (std::abs(denom) < 1e-12) return coeffs;

  coeffs.slope = (n * sxy - sx * sy) / denom;
  coeffs.intercept = (sy - coeffs.slope * sx) / n;
  coeffs.ok = true;
  return coeffs;
}

FitResult polynomial_fit(const std::vector<Point> &points, int degree, const std::string &method) {
  FitResult result;
  result.method = method;
  if (points.size() < static_cast<size_t>(degree + 1)) return result;

  const int n = degree + 1;
  std::vector<std::vector<double>> a(n, std::vector<double>(n, 0.0));
  std::vector<double> b(n, 0.0);
  for (const auto &p : points) {
    std::vector<double> powers(2 * degree + 1, 1.0);
    for (int i = 1; i <= 2 * degree; ++i) powers[i] = powers[i - 1] * p.x;
    for (int row = 0; row < n; ++row) {
      for (int col = 0; col < n; ++col) {
        a[row][col] += powers[row + col];
      }
      b[row] += p.y * powers[row];
    }
  }

  std::vector<double> coeffs;
  if (!solve_linear_system(a, b, coeffs)) return result;

  auto predict = [coeffs](double x) {
    double y = 0.0;
    double power = 1.0;
    for (double coeff : coeffs) {
      y += coeff * power;
      power *= x;
    }
    return y;
  };
  result.r2 = r_squared(points, predict);
  if (!std::isfinite(result.r2)) return result;

  std::string expr = "(" + format_double(coeffs[0]) + ")";
  std::string tex_expr = format_double(coeffs[0]);
  for (int i = 1; i <= degree; ++i) {
    expr += " + (" + format_double(coeffs[i]) + ")*x";
    tex_expr += " + " + format_double(coeffs[i]) + "x";
    if (i > 1) expr += "^" + std::to_string(i);
    if (i > 1) tex_expr += "^{" + std::to_string(i) + "}";
  }
  result.expression = expr;
  result.tex_expression = tex_expr;
  result.ok = true;
  return result;
}

FitResult exponential_fit(const std::vector<Point> &points) {
  std::vector<Point> transformed;
  for (const auto &p : points) {
    if (p.y <= 0.0) return FitResult();
    transformed.push_back({p.x, std::log(p.y)});
  }
  LinearCoefficients coeffs = linear_coefficients(transformed);
  if (!coeffs.ok) return FitResult();

  double a = std::exp(coeffs.intercept);
  double b = coeffs.slope;
  FitResult result;
  result.ok = true;
  result.method = "exponential";
  result.expression = "(" + format_double(a) + ")*exp((" + format_double(b) + ")*x)";
  result.tex_expression = format_double(a) + "e^{" + format_double(b) + "x}";
  result.r2 = r_squared(points, [a, b](double x) { return a * std::exp(b * x); });
  return result;
}

FitResult logarithmic_fit(const std::vector<Point> &points) {
  std::vector<Point> transformed;
  for (const auto &p : points) {
    if (p.x <= 0.0) return FitResult();
    transformed.push_back({std::log(p.x), p.y});
  }
  LinearCoefficients coeffs = linear_coefficients(transformed);
  if (!coeffs.ok) return FitResult();

  double a = coeffs.slope;
  double b = coeffs.intercept;
  FitResult result;
  result.ok = true;
  result.method = "logarithmic";
  result.expression = "(" + format_double(a) + ")*ln(x) + (" + format_double(b) + ")";
  result.tex_expression = format_double(a) + "\\ln x + " + format_double(b);
  result.r2 = r_squared(points, [a, b](double x) { return x > 0.0 ? a * std::log(x) + b : std::numeric_limits<double>::quiet_NaN(); });
  return result;
}

FitResult power_fit(const std::vector<Point> &points) {
  std::vector<Point> transformed;
  for (const auto &p : points) {
    if (p.x <= 0.0 || p.y <= 0.0) return FitResult();
    transformed.push_back({std::log(p.x), std::log(p.y)});
  }
  LinearCoefficients coeffs = linear_coefficients(transformed);
  if (!coeffs.ok) return FitResult();

  double a = std::exp(coeffs.intercept);
  double b = coeffs.slope;
  FitResult result;
  result.ok = true;
  result.method = "power";
  result.expression = "(" + format_double(a) + ")*pow(x," + format_double(b) + ")";
  result.tex_expression = format_double(a) + "x^{" + format_double(b) + "}";
  result.r2 = r_squared(points, [a, b](double x) { return x > 0.0 ? a * std::pow(x, b) : std::numeric_limits<double>::quiet_NaN(); });
  return result;
}
FitResult select_fit(const std::vector<Point> &points, const std::string &fit_method) {
  if (fit_method == "none") return FitResult{false, "none", "", "", 0.0};
  std::vector<FitResult> candidates;
  if (fit_method == "auto" || fit_method == "linear") candidates.push_back(polynomial_fit(points, 1, "linear"));
  if (fit_method == "auto" || fit_method == "quadratic") candidates.push_back(polynomial_fit(points, 2, "quadratic"));
  if (fit_method == "auto" || fit_method == "cubic") candidates.push_back(polynomial_fit(points, 3, "cubic"));
  if (fit_method == "auto" || fit_method == "exponential") candidates.push_back(exponential_fit(points));
  if (fit_method == "auto" || fit_method == "logarithmic") candidates.push_back(logarithmic_fit(points));
  if (fit_method == "auto" || fit_method == "power") candidates.push_back(power_fit(points));

  FitResult best;
  for (const auto &candidate : candidates) {
    if (candidate.ok && candidate.r2 > best.r2) best = candidate;
  }
  return best;
}

std::string fit_method_for_series(const std::string &fit_methods, size_t series_index) {
  std::vector<std::string> methods = split(fit_methods);
  if (methods.empty()) return "auto";
  size_t index = std::min(series_index, methods.size() - 1);
  std::string method = methods[index];
  trim(method);
  return method.empty() ? "auto" : method;
}

std::vector<Point> points_for_column(const Table &t, size_t col) {
  std::vector<Point> points;
  for (const auto &row : t) {
    if (row.size() > col && is_number(row[0]) && is_number(row[col])) {
      points.push_back({std::stod(row[0]), std::stod(row[col])});
    }
  }
  return points;
}

std::string plot_mark_style(size_t index) {
  static const char* styles[] = {
    "only marks, color=black, mark=*,         mark size=2pt",
    "only marks, color=black, mark=square*,   mark size=2pt",
    "only marks, color=black, mark=triangle*, mark size=3pt",
    "only marks, color=black, mark=diamond*,  mark size=3pt",
    "only marks, color=black, mark=o,         mark size=2pt",
    "only marks, color=black, mark=square,    mark size=2pt",
    "only marks, color=black, mark=triangle,  mark size=3pt",
    "only marks, color=black, mark=diamond,   mark size=3pt"
  };
  return styles[index % 8];
}

std::string to_tikz_graph(const Table &t, const std::string &filename, int sig_figs, const std::string &legend_pos, const std::string &scale_mode, int figure_number = 0, const std::string &fit_methods = "auto") {
  if (t.empty()) return "";
  
  size_t num_cols = t[0].size();
  if (num_cols < 2) return ""; // 少なくとも2列必要（x軸とy軸）
  if (sig_figs < 1) sig_figs = 3;
  
  // データの最小値・最大値を計算
  double x_min = 1e100, x_max = -1e100;
  double y_min = 1e100, y_max = -1e100;
  
  for (const auto &row : t) {
    if (row.size() >= 2) {
      // x軸データ（第1列）
      if (is_number(row[0])) {
        double x_val = std::stod(row[0]);
        x_min = std::min(x_min, x_val);
        x_max = std::max(x_max, x_val);
      }
      // y軸データ（第2列以降）
      for (size_t i = 1; i < row.size(); ++i) {
        if (is_number(row[i])) {
          double y_val = std::stod(row[i]);
          y_min = std::min(y_min, y_val);
          y_max = std::max(y_max, y_val);
        }
      }
    }
  }
  
  // ガウス記号を適用
  int xmin_val = (int)std::floor(x_min);
  int xmax_val = (int)std::floor(x_max) + 1;
  int ymin_val = (int)std::floor(y_min);
  int ymax_val = (int)std::floor(y_max) + 1;
  
  std::string out = "\\begin{figure}[H]\n";
  std::vector<FitEquation> fit_equations;
  out += "    \\centering\n";
  out += "    \\begin{tikzpicture}\n";
  out += "        \\begin{axis}[\n";
  out += "            width=0.8\\textwidth,\n";
  out += "            height=0.6\\textwidth,\n";
  out += "            minor tick num=1,\n";
  out += "            tick style={major tick length=5pt, minor tick length=3pt, tick pos=both, color=black, line width=0.5pt},\n";
  out += "            tick align=inside,\n";
  out += "            xmajorgrids=false,\n";
  out += "            ymajorgrids=false,\n";
  out += "            xminorgrids=false,\n";
  out += "            yminorgrids=false,\n";
  out += "            axis line style={-},\n";
  out += "            scaled ticks=false,\n";
  out += "            xticklabel style={/pgf/number format/fixed},\n";
  out += "            yticklabel style={/pgf/number format/fixed},\n";
  out += "            xticklabel style = {/pgf/number format/precision=";
  out += std::to_string(sig_figs);
  out += "},\n";
  out += "            yticklabel style = {/pgf/number format/precision=";
  out += std::to_string(sig_figs);
  out += "},\n";
  out += "            unbounded coords=discard,\n";
  out += "            legend cell align = {left},\n";
  out += "            legend pos = ";
  out += legend_pos;
  out += ",\n";
  
  // スケールモードを設定
  if (scale_mode == "semilog") {
    out += "            ymode=log,\n";
  } else if (scale_mode == "loglog") {
    out += "            xmode=log,\n";
    out += "            ymode=log,\n";
  }
  
  out += "            xlabel={x軸},\n";
  out += "            ylabel={y軸},\n";
  out += "            xmin=";
  out += std::to_string(xmin_val);
  out += ", xmax=";
  out += std::to_string(xmax_val);
  out += ",\n";
  out += "            ymin=";
  out += std::to_string(ymin_val);
  out += ", ymax=";
  out += std::to_string(ymax_val);
  out += ",\n";
  
  // (max-min)/5刻みで目盛りを設定
  int x_step = (xmax_val - xmin_val) / 5;
  int y_step = (ymax_val - ymin_val) / 5;
  if (x_step < 1) x_step = 1;
  if (y_step < 1) y_step = 1;
  
  out += "            xtick={";
  for (int i = xmin_val; i <= xmax_val; i += x_step) {
    if (i != xmin_val) out += ",";
    out += std::to_string(i);
  }
  out += "},\n";
  
  out += "            ytick={";
  for (int i = ymin_val; i <= ymax_val; i += y_step) {
    if (i != ymin_val) out += ",";
    out += std::to_string(i);
  }
  out += "}\n";
  out += "        ]\n";
  
  // 各y列に対してaddplotを生成（列1がx軸、列2以降がy軸）
  for (size_t i = 1; i < num_cols; ++i) {
    out += "            \\addplot [";
    out += plot_mark_style(i - 1);
    out += "] table [col sep=comma, x index=0, y index=";
    out += std::to_string(i);
    out += "] {";
    out += filename;
    out += ".csv};\n";
    std::string legend_text = "data " + std::to_string(i);
    out += "            \\addlegendentry{";
    out += legend_text;
    out += "}\n";

    std::string fit_method = fit_method_for_series(fit_methods, i - 1);
    FitResult fit = select_fit(points_for_column(t, i), fit_method);
    if (fit.ok) {
      out += "            \\addplot [forget plot, color=black, domain=";
      out += std::to_string(xmin_val);
      out += ":";
      out += std::to_string(xmax_val);
      out += ", samples=100, no markers, thick] {";
      out += fit.expression;
      out += "};\n";
      fit_equations.push_back({
        legend_text,
        "y_{" + std::to_string(i) + "} = " + fit.tex_expression,
        fit.r2
      });
    }
  }
  out += "        \\end{axis}\n";
  out += "    \\end{tikzpicture}\n";
  if (figure_number > 0) {
    out += "    \\setcounter{figure}{";
    out += std::to_string(figure_number - 1);
    out += "}\n";
  }
  out += "    \\caption{図題}\n";
  out += "    \\label{fig:label}\n";
  out += "\\end{figure}\n";
  for (const auto &fit_equation : fit_equations) {
    out += fit_equation.legend;
    out += " : $R^2=";
    out += format_double(fit_equation.r2);
    out += "$\n";
    out += "\\begin{equation}\n";
    out += "    ";
    out += fit_equation.equation;
    out += "\n";
    out += "\\end{equation}\n";
  }
  
  return out;
}

std::string to_tikz_graph_preview(const Table &t, int sig_figs, const std::string &legend_pos, const std::string &scale_mode) {
  if (t.empty()) return "";
  
  size_t num_cols = t[0].size();
  if (num_cols < 2) return ""; // 少なくとも2列必要（x軸とy軸）
  if (sig_figs < 1) sig_figs = 3;
  
  // データの最小値・最大値を計算
  double x_min = 1e100, x_max = -1e100;
  double y_min = 1e100, y_max = -1e100;
  
  for (const auto &row : t) {
    if (row.size() >= 2) {
      if (is_number(row[0])) {
        double x_val = std::stod(row[0]);
        x_min = std::min(x_min, x_val);
        x_max = std::max(x_max, x_val);
      }
      for (size_t i = 1; i < row.size(); ++i) {
        if (is_number(row[i])) {
          double y_val = std::stod(row[i]);
          y_min = std::min(y_min, y_val);
          y_max = std::max(y_max, y_val);
        }
      }
    }
  }
  
  int xmin_val = (int)std::floor(x_min);
  int xmax_val = (int)std::floor(x_max) + 1;
  int ymin_val = (int)std::floor(y_min);
  int ymax_val = (int)std::floor(y_max) + 1;
  
  std::string out = "\\begin{tikzpicture}\n";
  out += "  \\begin{axis}[\n";
  out += "    width=0.8\\textwidth,\n";
  out += "    height=0.6\\textwidth,\n";
  out += "    minor tick num=1,\n";
  out += "    tick style={major tick length=5pt, minor tick length=3pt, tick pos=both, color=black, line width=0.5pt},\n";
  out += "    tick align=inside,\n";
  out += "    xmajorgrids=false,\n";
  out += "    ymajorgrids=false,\n";
  out += "    xminorgrids=false,\n";
  out += "    yminorgrids=false,\n";
  out += "    axis line style={-},\n";
  out += "    scaled ticks=false,\n";
  out += "    legend cell align = {left},\n";
  out += "    legend pos = ";
  out += legend_pos;
  out += ",\n";
  
  if (scale_mode == "semilog") {
    out += "    ymode=log,\n";
  } else if (scale_mode == "loglog") {
    out += "    xmode=log,\n";
    out += "    ymode=log,\n";
  }
  
  out += "    xlabel={x軸},\n";
  out += "    ylabel={y軸},\n";
  out += "    xmin=";
  out += std::to_string(xmin_val);
  out += ", xmax=";
  out += std::to_string(xmax_val);
  out += ",\n";
  out += "    ymin=";
  out += std::to_string(ymin_val);
  out += ", ymax=";
  out += std::to_string(ymax_val);
  out += ",\n";
  
  int x_step = (xmax_val - xmin_val) / 5;
  int y_step = (ymax_val - ymin_val) / 5;
  if (x_step < 1) x_step = 1;
  if (y_step < 1) y_step = 1;
  
  out += "    xtick={";
  for (int i = xmin_val; i <= xmax_val; i += x_step) {
    if (i != xmin_val) out += ",";
    out += std::to_string(i);
  }
  out += "},\n";
  
  out += "    ytick={";
  for (int i = ymin_val; i <= ymax_val; i += y_step) {
    if (i != ymin_val) out += ",";
    out += std::to_string(i);
  }
  out += "}\n";
  out += "  ]\n";
  
  // データを埋め込み形式で生成
  for (size_t col = 1; col < num_cols; ++col) {
    out += "    \\addplot [only marks, mark=*] coordinates {\n";
    for (const auto &row : t) {
      if (row.size() > col && is_number(row[0]) && is_number(row[col])) {
        out += "      (";
        out += row[0];
        out += ",";
        out += row[col];
        out += ")\n";
      }
    }
    out += "    };\n";
    out += "    \\addlegendentry{凡例";
    out += std::to_string(col);
    out += "}\n";
  }
  
  out += "  \\end{axis}\n";
  out += "\\end{tikzpicture}\n";
  
  return out;
}

char* dup(const std::string &s) {
  char *p = (char*)malloc(s.size() + 1);
  memcpy(p, s.c_str(), s.size() + 1);
  return p;
}

extern "C" {
EMSCRIPTEN_KEEPALIVE char* gen_latex(const char* in) {
  return in ? dup(to_latex(parse(in))) : dup("");
}
EMSCRIPTEN_KEEPALIVE char* gen_csv(const char* in) {
  return in ? dup(to_csv(parse(in))) : dup("");
}
EMSCRIPTEN_KEEPALIVE char* gen_csv_rounded(const char* in, int decimals) {
  return in ? dup(to_csv_rounded(parse(in), decimals)) : dup("");
}
EMSCRIPTEN_KEEPALIVE char* gen_csv_sig_figs(const char* in, int sig_figs) {
  return in ? dup(to_csv_sig_figs(parse(in), sig_figs)) : dup("");
}
EMSCRIPTEN_KEEPALIVE char* gen_latex_rounded(const char* in, int decimals) {
  return in ? dup(to_latex_rounded(parse(in), decimals)) : dup("");
}
EMSCRIPTEN_KEEPALIVE char* gen_latex_sig_figs(const char* in, int sig_figs) {
  return in ? dup(to_latex_sig_figs(parse(in), sig_figs)) : dup("");
}
EMSCRIPTEN_KEEPALIVE char* gen_tikz_graph(const char* in, const char* filename, int sig_figs, const char* legend_pos, const char* scale_mode) {
  if (!in || !filename) return dup("");
  std::string lp = legend_pos ? legend_pos : "north west";
  std::string sm = scale_mode ? scale_mode : "linear";
  return dup(to_tikz_graph(parse(in), filename, sig_figs, lp, sm));
}
EMSCRIPTEN_KEEPALIVE char* gen_tikz_graph_preview(const char* in, int sig_figs, const char* legend_pos, const char* scale_mode) {
  if (!in) return dup("");
  std::string lp = legend_pos ? legend_pos : "north west";
  std::string sm = scale_mode ? scale_mode : "linear";
  return dup(to_tikz_graph_preview(parse(in), sig_figs, lp, sm));
}
EMSCRIPTEN_KEEPALIVE char* gen_latex_config(const char* in, int mode, int decimals, int sig_figs, int has_header, int clean_input) {
  Table t = prepare_table(in, has_header != 0, clean_input != 0, true);
  return dup(to_latex_mode(t, mode, decimals, sig_figs));
}
EMSCRIPTEN_KEEPALIVE char* gen_csv_config(const char* in, int mode, int decimals, int sig_figs, int has_header, int clean_input) {
  Table t = prepare_table(in, has_header != 0, clean_input != 0, true);
  return dup(to_csv_mode(t, mode, decimals, sig_figs));
}
EMSCRIPTEN_KEEPALIVE char* gen_tikz_graph_config(const char* in, const char* filename, int sig_figs, const char* legend_pos, const char* scale_mode, const char* fit_method, int has_header, int clean_input, int figure_number) {
  if (!filename) return dup("");
  std::string lp = legend_pos ? legend_pos : "north west";
  std::string sm = scale_mode ? scale_mode : "linear";
  std::string fm = fit_method ? fit_method : "auto";
  Table t = prepare_table(in, has_header != 0, clean_input != 0, false);
  return dup(to_tikz_graph(t, filename, sig_figs, lp, sm, figure_number, fm));
}
EMSCRIPTEN_KEEPALIVE char* gen_csv_attachment(const char* in, int has_header, int clean_input) {
  Table t = prepare_table(in, has_header != 0, clean_input != 0, false);
  return dup(to_graph_csv(t));
}
}
