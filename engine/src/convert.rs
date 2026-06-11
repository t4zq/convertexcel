//! LaTeX 表 / CSV / TikZ(pgfplots) / 近似を生成する Rust/WASM エンジン。
//! 数値整形は従来の出力互換性を保つため、`%g` 既定・precision=10 と半away丸めに合わせる。

use wasm_bindgen::prelude::*;

pub type Table = Vec<Vec<String>>;

const ROUND_DECIMAL: i32 = 1;
const ROUND_SIG_FIGS: i32 = 2;

// ─── 数値判定・整形 ────────────────────────────────────────

pub fn is_number(s: &str) -> bool {
    let t = s.trim();
    if t.is_empty() {
        return false;
    }
    matches!(t.parse::<f64>(), Ok(v) if v.is_finite())
}

fn parse_f64(s: &str) -> f64 {
    s.trim().parse::<f64>().unwrap_or(f64::NAN)
}

/// 0.5 は絶対値を増やす方向へ丸める。
fn round_half_away(x: f64) -> f64 {
    if x >= 0.0 {
        (x + 0.5).floor()
    } else {
        (x - 0.5).ceil()
    }
}

pub fn round_number(s: &str, decimals: i32) -> String {
    if !is_number(s) {
        return s.to_string();
    }
    let decimals = decimals.max(0) as usize;
    let value = parse_f64(s);
    let mult = 10f64.powi(decimals as i32);
    let rounded = round_half_away(value * mult) / mult;
    format!("{:.*}", decimals, rounded)
}

pub fn round_significant_figures(s: &str, sig_figs: i32) -> String {
    if !is_number(s) {
        return s.to_string();
    }
    let sig_figs = if sig_figs <= 0 { 1 } else { sig_figs };
    let value = parse_f64(s);
    if value == 0.0 {
        return "0".to_string();
    }
    let abs_value = value.abs();
    let exponent = abs_value.log10().floor() as i32;
    let mult = 10f64.powi(sig_figs - 1 - exponent);
    let rounded = round_half_away(value * mult) / mult;

    let decimal_places = (sig_figs - 1 - exponent).max(0);
    if decimal_places > 0 {
        format!("{:.*}", decimal_places as usize, rounded)
    } else {
        // 整数表示: 小数点以下を捨てる
        let formatted = format!("{:.0}", rounded);
        match formatted.find('.') {
            Some(pos) => formatted[..pos].to_string(),
            None => formatted,
        }
    }
}

/// 既定書式・precision=P 相当の `%g` 整形。
fn format_g(value: f64, precision: usize) -> String {
    if value == 0.0 {
        return "0".to_string();
    }
    if !value.is_finite() {
        return if value.is_nan() {
            "nan".to_string()
        } else if value > 0.0 {
            "inf".to_string()
        } else {
            "-inf".to_string()
        };
    }
    let p = precision.max(1);
    let exp = value.abs().log10().floor() as i32;

    if exp < -4 || exp >= p as i32 {
        // 指数表記: 仮数部 p-1 桁 → 末尾0除去 → e±dd
        let mantissa = format!("{:.*}", p - 1, value / 10f64.powi(exp));
        let mantissa = strip_trailing_zeros(&mantissa);
        let sign = if exp < 0 { '-' } else { '+' };
        format!("{}e{}{:02}", mantissa, sign, exp.abs())
    } else {
        let decimals = (p as i32 - 1 - exp).max(0) as usize;
        let fixed = format!("{:.*}", decimals, value);
        strip_trailing_zeros(&fixed)
    }
}

fn strip_trailing_zeros(s: &str) -> String {
    if !s.contains('.') {
        return s.to_string();
    }
    let trimmed = s.trim_end_matches('0');
    let trimmed = trimmed.trim_end_matches('.');
    trimmed.to_string()
}

fn format_double(value: f64) -> String {
    let v = if value.abs() < 1e-12 { 0.0 } else { value };
    format_g(v, 10)
}

// ─── パース・正規化 ────────────────────────────────────────

fn split_line(line: &str) -> Vec<String> {
    let delim = if line.contains('\t') { '\t' } else { ',' };
    line.split(delim).map(|c| c.to_string()).collect()
}

fn normalize_fullwidth_ascii(s: &str) -> String {
    s.chars()
        .map(|c| {
            let cp = c as u32;
            if (0xFF01..=0xFF5E).contains(&cp) {
                char::from_u32(cp - 0xFEE0).unwrap_or(c)
            } else if cp == 0x3000 {
                ' '
            } else if cp == 0x201C || cp == 0x201D {
                '"'
            } else if cp == 0x2018 || cp == 0x2019 {
                '\''
            } else {
                c
            }
        })
        .collect()
}

fn quote_pair(open: char, close: char) -> bool {
    matches!(
        (open, close),
        ('"', '"') | ('\'', '\'') | ('\u{300C}', '\u{300D}') | ('\u{300E}', '\u{300F}')
    )
}

fn strip_wrapping_quotes(s: &str) -> String {
    let mut next = s.trim().to_string();
    loop {
        let cps: Vec<char> = next.chars().collect();
        if cps.len() >= 2 && quote_pair(cps[0], cps[cps.len() - 1]) {
            next = cps[1..cps.len() - 1].iter().collect::<String>().trim().to_string();
        } else {
            break;
        }
    }
    next
}

fn clean_cell(cell: &str) -> String {
    let out = normalize_fullwidth_ascii(cell);
    let out = out.trim();
    strip_wrapping_quotes(out)
}

pub fn parse(input: &str) -> Table {
    let mut t = Table::new();
    for line in input.lines() {
        let line = line.trim();
        if line.is_empty() {
            continue;
        }
        let cells = split_line(line).iter().map(|c| c.trim().to_string()).collect();
        t.push(cells);
    }
    t
}

fn prepare_table(input: &str, has_header: bool, clean_input: bool, include_header: bool) -> Table {
    let mut t = parse(input);
    if clean_input {
        for row in t.iter_mut() {
            for cell in row.iter_mut() {
                *cell = clean_cell(cell);
            }
        }
    }
    if has_header && !include_header && !t.is_empty() {
        t.remove(0);
    }
    t
}

// ─── LaTeX / CSV ───────────────────────────────────────────

fn escape(s: &str) -> String {
    let mut out = String::new();
    for c in s.chars() {
        if matches!(c, '&' | '%' | '$' | '#' | '_' | '{' | '}') {
            out.push('\\');
        }
        out.push(c);
    }
    out
}

fn escape_label_arg(s: &str) -> String {
    s.chars().filter(|c| !matches!(c, '{' | '}')).collect()
}

/// `値 ± 誤差` を分解する。区切りは ±(U+00B1), +/-, +- を許容。
/// 数値のみなら (値, None)、数値でもなければ None（テキスト扱い）。
fn parse_value_error(cell: &str) -> Option<(String, Option<String>)> {
    let c = cell.trim();
    for sep in ["\u{00B1}", "+/-", "+-"] {
        if let Some(idx) = c.find(sep) {
            let value = c[..idx].trim();
            let error = c[idx + sep.len()..].trim();
            if is_number(value) && is_number(error) {
                return Some((value.to_string(), Some(error.to_string())));
            }
        }
    }
    if is_number(c) {
        Some((c.to_string(), None))
    } else {
        None
    }
}

/// 通常（非 siunitx）の LaTeX セル。不確かさ付きセルは `$値 \pm 誤差$` にする。
fn render_plain_cell(cell: &str, format_cell: &dyn Fn(&str) -> String, is_header: bool) -> String {
    if !is_header {
        if let Some((value, Some(error))) = parse_value_error(cell) {
            return format!("${} \\pm {}$", format_cell(&value), format_cell(&error));
        }
    }
    escape(&format_cell(cell))
}

fn to_latex_formatted(t: &Table, format_cell: &dyn Fn(&str) -> String) -> String {
    to_latex_formatted_style(t, format_cell, false, false)
}

fn to_latex_formatted_style(
    t: &Table,
    format_cell: &dyn Fn(&str) -> String,
    has_header: bool,
    booktabs: bool,
) -> String {
    if t.is_empty() {
        return String::new();
    }
    let mut out = format!(
        "\\begin{{tabular}}{{{}}}\n\\hline\n",
        "c".repeat(t[0].len())
    );
    if booktabs {
        out = format!("\\begin{{tabular}}{{{}}}\n\\toprule\n", "c".repeat(t[0].len()));
    }
    for (row_index, row) in t.iter().enumerate() {
        let is_header = has_header && row_index == 0;
        for (i, cell) in row.iter().enumerate() {
            if i > 0 {
                out.push_str(" & ");
            }
            out.push_str(&render_plain_cell(cell, format_cell, is_header));
        }
        out.push_str(" \\\\\n");
        if booktabs && has_header && row_index == 0 {
            out.push_str("\\midrule\n");
        }
    }
    if booktabs {
        out.push_str("\\bottomrule\n\\end{tabular}");
    } else {
        out.push_str("\\hline\n\\end{tabular}");
    }
    out
}

fn to_csv_formatted(t: &Table, format_cell: &dyn Fn(&str) -> String) -> String {
    let mut out = String::new();
    for (i, row) in t.iter().enumerate() {
        for (j, cell) in row.iter().enumerate() {
            if j > 0 {
                out.push(',');
            }
            out.push_str(&format_cell(cell));
        }
        if i + 1 < t.len() {
            out.push('\n');
        }
    }
    out
}

fn identity(c: &str) -> String {
    c.to_string()
}

fn to_latex(t: &Table) -> String {
    to_latex_formatted(t, &identity)
}
fn to_latex_rounded(t: &Table, decimals: i32) -> String {
    to_latex_formatted(t, &|c| round_number(c, decimals))
}
fn to_latex_sig_figs(t: &Table, sig_figs: i32) -> String {
    to_latex_formatted(t, &|c| round_significant_figures(c, sig_figs))
}
fn to_csv(t: &Table) -> String {
    to_csv_formatted(t, &identity)
}
fn to_csv_rounded(t: &Table, decimals: i32) -> String {
    to_csv_formatted(t, &|c| round_number(c, decimals))
}
fn to_csv_sig_figs(t: &Table, sig_figs: i32) -> String {
    to_csv_formatted(t, &|c| round_significant_figures(c, sig_figs))
}
/// 各列に不確かさ付きセル（値±誤差）が 1 つでもあるか。
fn uncertain_columns(t: &Table) -> Vec<bool> {
    let cols = t.iter().map(|r| r.len()).max().unwrap_or(0);
    (0..cols)
        .map(|j| {
            t.iter().any(|row| {
                row.get(j)
                    .map(|c| matches!(parse_value_error(c), Some((_, Some(_)))))
                    .unwrap_or(false)
            })
        })
        .collect()
}

/// 列 col の誤差値が、添付 CSV の何列目に入るか。元の列の後ろへ
/// 不確かさ列を昇順で追加するため、CSV と plot で同じ規則を共有する。
fn error_index_for(unc: &[bool], base_cols: usize, col: usize) -> Option<usize> {
    if col >= unc.len() || !unc[col] {
        return None;
    }
    let offset = unc[..col].iter().filter(|&&u| u).count();
    Some(base_cols + offset)
}

/// グラフ添付用 CSV。値は数値部のみ、不確かさ列の誤差は末尾へ追加する。
fn to_graph_csv(t: &Table) -> String {
    let cols = t.iter().map(|r| r.len()).max().unwrap_or(0);
    let unc = uncertain_columns(t);
    let mut out = String::new();
    for (i, row) in t.iter().enumerate() {
        let mut fields: Vec<String> = Vec::with_capacity(cols);
        for j in 0..cols {
            let cell = row.get(j).map(|s| s.as_str()).unwrap_or("");
            fields.push(match parse_value_error(cell) {
                Some((v, _)) => v,
                None => "nan".to_string(),
            });
        }
        for j in 0..cols {
            if !unc[j] {
                continue;
            }
            let cell = row.get(j).map(|s| s.as_str()).unwrap_or("");
            fields.push(match parse_value_error(cell) {
                Some((_, Some(e))) => e,
                Some((_, None)) => "0".to_string(),
                None => "nan".to_string(),
            });
        }
        out.push_str(&fields.join(","));
        if i + 1 < t.len() {
            out.push('\n');
        }
    }
    out
}

// ─── siunitx 表 ────────────────────────────────────────────

/// よく使う単位を siunitx マクロへ対応づける。前置詞の曖昧さ（m=ミリ/メートル等）を
/// 避けるため複合単位を明示的に列挙し、未知の単位は None（リテラル表示へフォールバック）。
fn siunitx_unit(unit: &str) -> Option<&'static str> {
    let m = match unit.trim() {
        "V" => "\\volt",
        "mV" => "\\milli\\volt",
        "kV" => "\\kilo\\volt",
        "uV" | "\u{00B5}V" | "\u{03BC}V" => "\\micro\\volt",
        "A" => "\\ampere",
        "mA" => "\\milli\\ampere",
        "uA" | "\u{00B5}A" | "\u{03BC}A" => "\\micro\\ampere",
        "kA" => "\\kilo\\ampere",
        "\u{03A9}" | "\u{2126}" | "ohm" => "\\ohm",
        "m\u{03A9}" | "m\u{2126}" => "\\milli\\ohm",
        "k\u{03A9}" | "k\u{2126}" => "\\kilo\\ohm",
        "M\u{03A9}" | "M\u{2126}" => "\\mega\\ohm",
        "W" => "\\watt",
        "mW" => "\\milli\\watt",
        "kW" => "\\kilo\\watt",
        "Hz" => "\\hertz",
        "kHz" => "\\kilo\\hertz",
        "MHz" => "\\mega\\hertz",
        "GHz" => "\\giga\\hertz",
        "s" => "\\second",
        "ms" => "\\milli\\second",
        "us" | "\u{00B5}s" | "\u{03BC}s" => "\\micro\\second",
        "ns" => "\\nano\\second",
        "F" => "\\farad",
        "mF" => "\\milli\\farad",
        "uF" | "\u{00B5}F" | "\u{03BC}F" => "\\micro\\farad",
        "nF" => "\\nano\\farad",
        "pF" => "\\pico\\farad",
        "H" => "\\henry",
        "mH" => "\\milli\\henry",
        "uH" | "\u{00B5}H" | "\u{03BC}H" => "\\micro\\henry",
        "m" => "\\metre",
        "cm" => "\\centi\\metre",
        "mm" => "\\milli\\metre",
        "um" | "\u{00B5}m" | "\u{03BC}m" => "\\micro\\metre",
        "nm" => "\\nano\\metre",
        "km" => "\\kilo\\metre",
        "g" => "\\gram",
        "kg" => "\\kilo\\gram",
        "mg" => "\\milli\\gram",
        "N" => "\\newton",
        "J" => "\\joule",
        "C" => "\\coulomb",
        "K" => "\\kelvin",
        "T" => "\\tesla",
        "Pa" => "\\pascal",
        "kPa" => "\\kilo\\pascal",
        "dB" => "\\decibel",
        "rad" => "\\radian",
        "\u{00B0}C" | "\u{2103}" => "\\degreeCelsius",
        "min" => "\\minute",
        "h" => "\\hour",
        _ => return None,
    };
    Some(m)
}

/// `名前 [単位]` 形式からラベルと単位を取り出す。単位が無ければ (名前, None)。
fn split_header_unit(header: &str) -> (String, Option<String>) {
    let h = header.trim();
    if h.ends_with(']') {
        if let Some(open) = h.rfind('[') {
            let unit = h[open + 1..h.len() - 1].trim();
            if !unit.is_empty() {
                return (h[..open].trim().to_string(), Some(unit.to_string()));
            }
        }
    }
    (h.to_string(), None)
}

struct NumColumn {
    is_numeric: bool,
    int_digits: usize,
    dec_digits: usize,
    has_sign: bool,
    // 指数表記が混ざると桁数が当てにならないので table-format を付けない。
    format_ok: bool,
}

/// 各列について、数値列かどうかと siunitx の table-format 用の桁数を求める。
fn analyze_columns(t: &Table, data_start: usize, format_cell: &dyn Fn(&str) -> String) -> Vec<NumColumn> {
    let cols = t.iter().map(|r| r.len()).max().unwrap_or(0);
    let mut specs = Vec::with_capacity(cols);
    for j in 0..cols {
        let mut is_numeric = true;
        let mut any = false;
        let mut int_digits = 1usize;
        let mut dec_digits = 0usize;
        let mut has_sign = false;
        let mut format_ok = true;
        for row in t.iter().skip(data_start) {
            let cell = row.get(j).map(|s| s.as_str()).unwrap_or("");
            if cell.trim().is_empty() {
                continue;
            }
            let (value, error) = match parse_value_error(cell) {
                Some(pair) => pair,
                None => {
                    is_numeric = false;
                    break;
                }
            };
            any = true;
            // 不確かさ付きの列は table-format を付けない（siunitx の桁指定と衝突させない）。
            if error.is_some() {
                format_ok = false;
            }
            let formatted = format_cell(&value);
            let f = formatted.trim();
            if f.contains('e') || f.contains('E') {
                format_ok = false;
                continue;
            }
            let body = f.strip_prefix('-').map(|r| { has_sign = true; r })
                .or_else(|| f.strip_prefix('+'))
                .unwrap_or(f);
            let (ip, dp) = match body.split_once('.') {
                Some((a, b)) => (a.len().max(1), b.len()),
                None => (body.len().max(1), 0),
            };
            int_digits = int_digits.max(ip);
            dec_digits = dec_digits.max(dp);
        }
        specs.push(NumColumn {
            is_numeric: is_numeric && any,
            int_digits,
            dec_digits,
            has_sign,
            format_ok,
        });
    }
    specs
}

fn siunitx_colspec(spec: &NumColumn) -> String {
    if !spec.is_numeric {
        return "c".to_string();
    }
    if !spec.format_ok {
        return "S".to_string();
    }
    let sign = if spec.has_sign { "-" } else { "" };
    if spec.dec_digits == 0 {
        format!("S[table-format={}{}]", sign, spec.int_digits)
    } else {
        format!("S[table-format={}{}.{}]", sign, spec.int_digits, spec.dec_digits)
    }
}

fn to_latex_siunitx_style(
    t: &Table,
    format_cell: &dyn Fn(&str) -> String,
    has_header: bool,
    booktabs: bool,
) -> String {
    if t.is_empty() {
        return String::new();
    }
    let data_start = if has_header { 1 } else { 0 };
    let specs = analyze_columns(t, data_start, format_cell);
    let colspec = specs.iter().map(siunitx_colspec).collect::<Vec<_>>().join(" ");
    let (top, bottom) = if booktabs { ("\\toprule", "\\bottomrule") } else { ("\\hline", "\\hline") };

    let mut out = format!("\\begin{{tabular}}{{{}}}\n{}\n", colspec, top);
    for (row_index, row) in t.iter().enumerate() {
        let is_header = has_header && row_index == 0;
        for (j, spec) in specs.iter().enumerate() {
            if j > 0 {
                out.push_str(" & ");
            }
            let cell = row.get(j).map(|s| s.as_str()).unwrap_or("");
            if is_header && spec.is_numeric {
                // S 列のヘッダーは波括弧で囲む。既知の単位なら \si を付与する。
                let (name, unit) = split_header_unit(cell);
                let braced = match unit.as_deref().and_then(siunitx_unit) {
                    Some(macro_str) => format!("{} / \\si{{{}}}", escape(name.trim()), macro_str),
                    None => escape(cell.trim()),
                };
                out.push_str(&format!("{{{}}}", braced));
            } else if !is_header && spec.is_numeric {
                // S 列の数値セル。不確かさは siunitx の `値 +- 誤差` 構文で渡す。
                match parse_value_error(cell) {
                    Some((value, Some(error))) => {
                        out.push_str(&format!("{} +- {}", format_cell(&value).trim(), format_cell(&error).trim()))
                    }
                    Some((value, None)) => out.push_str(format_cell(&value).trim()),
                    None => out.push_str("{}"),
                }
            } else {
                out.push_str(&escape(&format_cell(cell)));
            }
        }
        out.push_str(" \\\\\n");
        if has_header && row_index == 0 {
            out.push_str(if booktabs { "\\midrule\n" } else { "\\hline\n" });
        }
    }
    out.push_str(bottom);
    out.push_str("\n\\end{tabular}");
    out
}

fn to_latex_mode_style(
    t: &Table,
    mode: i32,
    decimals: i32,
    sig_figs: i32,
    has_header: bool,
    booktabs: bool,
    siunitx: bool,
) -> String {
    let format_cell: Box<dyn Fn(&str) -> String> = match mode {
        ROUND_DECIMAL => Box::new(move |c: &str| round_number(c, decimals)),
        ROUND_SIG_FIGS => Box::new(move |c: &str| round_significant_figures(c, sig_figs)),
        _ => Box::new(|c: &str| identity(c)),
    };
    if siunitx {
        to_latex_siunitx_style(t, format_cell.as_ref(), has_header, booktabs)
    } else {
        to_latex_formatted_style(t, format_cell.as_ref(), has_header, booktabs)
    }
}
fn to_csv_mode(t: &Table, mode: i32, decimals: i32, sig_figs: i32) -> String {
    match mode {
        ROUND_DECIMAL => to_csv_rounded(t, decimals),
        ROUND_SIG_FIGS => to_csv_sig_figs(t, sig_figs),
        _ => to_csv(t),
    }
}

// ─── 近似 (fit) ────────────────────────────────────────────

#[derive(Clone, Copy)]
struct Point {
    x: f64,
    y: f64,
}

#[derive(Default, Clone)]
struct FitResult {
    ok: bool,
    method: String,
    expression: String,
    tex_expression: String,
    r2: f64,
}

impl FitResult {
    fn empty() -> Self {
        FitResult {
            ok: false,
            method: String::new(),
            expression: String::new(),
            tex_expression: String::new(),
            r2: f64::NEG_INFINITY,
        }
    }
}

fn r_squared(points: &[Point], predict: &dyn Fn(f64) -> f64) -> f64 {
    if points.len() < 2 {
        return f64::NEG_INFINITY;
    }
    let mean = points.iter().map(|p| p.y).sum::<f64>() / points.len() as f64;
    let mut sse = 0.0;
    let mut sst = 0.0;
    for p in points {
        let predicted = predict(p.x);
        if !predicted.is_finite() {
            return f64::NEG_INFINITY;
        }
        let residual = p.y - predicted;
        sse += residual * residual;
        let centered = p.y - mean;
        sst += centered * centered;
    }
    if sst < 1e-12 {
        return if sse < 1e-12 { 1.0 } else { 0.0 };
    }
    1.0 - sse / sst
}

fn solve_linear_system(mut a: Vec<Vec<f64>>, mut b: Vec<f64>) -> Option<Vec<f64>> {
    let n = b.len();
    for i in 0..n {
        let mut pivot = i;
        for r in (i + 1)..n {
            if a[r][i].abs() > a[pivot][i].abs() {
                pivot = r;
            }
        }
        if a[pivot][i].abs() < 1e-12 {
            return None;
        }
        if pivot != i {
            a.swap(pivot, i);
            b.swap(pivot, i);
        }
        let div = a[i][i];
        for c in i..n {
            a[i][c] /= div;
        }
        b[i] /= div;
        for r in 0..n {
            if r == i {
                continue;
            }
            let factor = a[r][i];
            for c in i..n {
                a[r][c] -= factor * a[i][c];
            }
            b[r] -= factor * b[i];
        }
    }
    Some(b)
}

struct LinearCoefficients {
    ok: bool,
    intercept: f64,
    slope: f64,
}

fn linear_coefficients(points: &[Point]) -> LinearCoefficients {
    let mut c = LinearCoefficients { ok: false, intercept: 0.0, slope: 0.0 };
    if points.len() < 2 {
        return c;
    }
    let (mut sx, mut sy, mut sxx, mut sxy) = (0.0, 0.0, 0.0, 0.0);
    for p in points {
        sx += p.x;
        sy += p.y;
        sxx += p.x * p.x;
        sxy += p.x * p.y;
    }
    let n = points.len() as f64;
    let denom = n * sxx - sx * sx;
    if denom.abs() < 1e-12 {
        return c;
    }
    c.slope = (n * sxy - sx * sy) / denom;
    c.intercept = (sy - c.slope * sx) / n;
    c.ok = true;
    c
}

fn polynomial_fit(points: &[Point], degree: usize, method: &str) -> FitResult {
    let mut result = FitResult::empty();
    result.method = method.to_string();
    if points.len() < degree + 1 {
        return result;
    }
    let n = degree + 1;
    let mut a = vec![vec![0.0; n]; n];
    let mut b = vec![0.0; n];
    for p in points {
        let mut powers = vec![1.0; 2 * degree + 1];
        for i in 1..=(2 * degree) {
            powers[i] = powers[i - 1] * p.x;
        }
        for row in 0..n {
            for col in 0..n {
                a[row][col] += powers[row + col];
            }
            b[row] += p.y * powers[row];
        }
    }
    let coeffs = match solve_linear_system(a, b) {
        Some(c) => c,
        None => return result,
    };
    let coeffs_for_predict = coeffs.clone();
    let predict = move |x: f64| {
        let mut y = 0.0;
        let mut power = 1.0;
        for &coeff in &coeffs_for_predict {
            y += coeff * power;
            power *= x;
        }
        y
    };
    result.r2 = r_squared(points, &predict);
    if !result.r2.is_finite() {
        return result;
    }
    let mut expr = format!("({})", format_double(coeffs[0]));
    let mut tex_expr = format_double(coeffs[0]);
    for i in 1..=degree {
        expr += &format!(" + ({})*x", format_double(coeffs[i]));
        tex_expr += &format!(" + {}x", format_double(coeffs[i]));
        if i > 1 {
            expr += &format!("^{}", i);
            tex_expr += &format!("^{{{}}}", i);
        }
    }
    result.expression = expr;
    result.tex_expression = tex_expr;
    result.ok = true;
    result
}

fn exponential_fit(points: &[Point]) -> FitResult {
    let mut transformed = Vec::new();
    for p in points {
        if p.y <= 0.0 {
            return FitResult::empty();
        }
        transformed.push(Point { x: p.x, y: p.y.ln() });
    }
    let coeffs = linear_coefficients(&transformed);
    if !coeffs.ok {
        return FitResult::empty();
    }
    let a = coeffs.intercept.exp();
    let b = coeffs.slope;
    let mut result = FitResult::empty();
    result.ok = true;
    result.method = "exponential".to_string();
    result.expression = format!("({})*exp(({})*x)", format_double(a), format_double(b));
    result.tex_expression = format!("{}e^{{{}x}}", format_double(a), format_double(b));
    result.r2 = r_squared(points, &move |x| a * (b * x).exp());
    result
}

fn logarithmic_fit(points: &[Point]) -> FitResult {
    let mut transformed = Vec::new();
    for p in points {
        if p.x <= 0.0 {
            return FitResult::empty();
        }
        transformed.push(Point { x: p.x.ln(), y: p.y });
    }
    let coeffs = linear_coefficients(&transformed);
    if !coeffs.ok {
        return FitResult::empty();
    }
    let a = coeffs.slope;
    let b = coeffs.intercept;
    let mut result = FitResult::empty();
    result.ok = true;
    result.method = "logarithmic".to_string();
    result.expression = format!("({})*ln(x) + ({})", format_double(a), format_double(b));
    result.tex_expression = format!("{}\\ln x + {}", format_double(a), format_double(b));
    result.r2 = r_squared(points, &move |x| if x > 0.0 { a * x.ln() + b } else { f64::NAN });
    result
}

fn power_fit(points: &[Point]) -> FitResult {
    let mut transformed = Vec::new();
    for p in points {
        if p.x <= 0.0 || p.y <= 0.0 {
            return FitResult::empty();
        }
        transformed.push(Point { x: p.x.ln(), y: p.y.ln() });
    }
    let coeffs = linear_coefficients(&transformed);
    if !coeffs.ok {
        return FitResult::empty();
    }
    let a = coeffs.intercept.exp();
    let b = coeffs.slope;
    let mut result = FitResult::empty();
    result.ok = true;
    result.method = "power".to_string();
    result.expression = format!("({})*pow(x,{})", format_double(a), format_double(b));
    result.tex_expression = format!("{}x^{{{}}}", format_double(a), format_double(b));
    result.r2 = r_squared(points, &move |x| if x > 0.0 { a * x.powf(b) } else { f64::NAN });
    result
}

fn select_fit(points: &[Point], fit_method: &str) -> FitResult {
    if fit_method == "none" {
        return FitResult { ok: false, method: "none".to_string(), r2: 0.0, ..FitResult::default() };
    }
    let mut candidates = Vec::new();
    let all = fit_method == "auto";
    if all || fit_method == "linear" {
        candidates.push(polynomial_fit(points, 1, "linear"));
    }
    if all || fit_method == "quadratic" {
        candidates.push(polynomial_fit(points, 2, "quadratic"));
    }
    if all || fit_method == "cubic" {
        candidates.push(polynomial_fit(points, 3, "cubic"));
    }
    if all || fit_method == "exponential" {
        candidates.push(exponential_fit(points));
    }
    if all || fit_method == "logarithmic" {
        candidates.push(logarithmic_fit(points));
    }
    if all || fit_method == "power" {
        candidates.push(power_fit(points));
    }
    let mut best = FitResult::empty();
    for c in candidates {
        if c.ok && c.r2 > best.r2 {
            best = c;
        }
    }
    best
}

fn fit_method_for_series(fit_methods: &str, series_index: usize) -> String {
    let methods = split_line(fit_methods);
    if methods.is_empty() {
        return "auto".to_string();
    }
    let index = series_index.min(methods.len() - 1);
    let method = methods[index].trim();
    if method.is_empty() {
        "auto".to_string()
    } else {
        method.to_string()
    }
}

fn points_for_column(t: &Table, col: usize) -> Vec<Point> {
    let mut points = Vec::new();
    for row in t {
        if row.len() <= col {
            continue;
        }
        // 不確かさ付きセルは値部のみを使う。
        if let (Some((xv, _)), Some((yv, _))) =
            (parse_value_error(&row[0]), parse_value_error(&row[col]))
        {
            points.push(Point { x: parse_f64(&xv), y: parse_f64(&yv) });
        }
    }
    points
}

fn plot_mark_style(index: usize) -> &'static str {
    const STYLES: [&str; 8] = [
        "only marks, color=black, mark=*, mark size=2pt",
        "only marks, color=black, mark=square*, mark size=2pt",
        "only marks, color=black, mark=triangle*, mark size=3pt",
        "only marks, color=black, mark=diamond*, mark size=3pt",
        "only marks, color=black, mark=o, mark size=2pt",
        "only marks, color=black, mark=square, mark size=2pt",
        "only marks, color=black, mark=triangle, mark size=3pt",
        "only marks, color=black, mark=diamond, mark size=3pt",
    ];
    STYLES[index % 8]
}

fn push_pgfplots_options(out: &mut String, indent: &str, options: &str) {
    let parts: Vec<&str> = options.split(", ").collect();
    for (index, part) in parts.iter().enumerate() {
        out.push_str(indent);
        out.push_str(part);
        if index + 1 < parts.len() {
            out.push_str(",\n");
        } else {
            out.push('\n');
        }
    }
}

fn multiline_plot_expression(expression: &str) -> String {
    expression.replace(" + ", "\n                + ")
}

struct FitEquation {
    legend: String,
    equation: String,
    r2: f64,
}

fn axis_bounds(t: &Table) -> (i32, i32, i32, i32) {
    let (mut x_min, mut x_max) = (1e100_f64, -1e100_f64);
    let (mut y_min, mut y_max) = (1e100_f64, -1e100_f64);
    for row in t {
        if row.len() >= 2 {
            if let Some((xv, _)) = parse_value_error(&row[0]) {
                let x = parse_f64(&xv);
                x_min = x_min.min(x);
                x_max = x_max.max(x);
            }
            for i in 1..row.len() {
                if let Some((yv, _)) = parse_value_error(&row[i]) {
                    let y = parse_f64(&yv);
                    y_min = y_min.min(y);
                    y_max = y_max.max(y);
                }
            }
        }
    }
    (
        x_min.floor() as i32,
        x_max.floor() as i32 + 1,
        y_min.floor() as i32,
        y_max.floor() as i32 + 1,
    )
}

#[allow(clippy::too_many_arguments)]
fn to_tikz_graph(
    t: &Table,
    filename: &str,
    sig_figs: i32,
    legend_pos: &str,
    scale_mode: &str,
    figure_number: i32,
    fit_methods: &str,
    headers: &[String],
    x_label: &str,
    y_label: &str,
    caption: &str,
    label: &str,
) -> String {
    if t.is_empty() {
        return String::new();
    }
    let num_cols = t[0].len();
    if num_cols < 2 {
        return String::new();
    }
    let sig_figs = if sig_figs < 1 { 3 } else { sig_figs };
    let (xmin_val, xmax_val, ymin_val, ymax_val) = axis_bounds(t);

    let mut out = String::from("\\begin{figure}[H]\n");
    let mut fit_equations: Vec<FitEquation> = Vec::new();
    out.push_str("    \\centering\n");
    out.push_str("    \\begin{tikzpicture}\n");
    out.push_str("        \\begin{axis}[\n");
    out.push_str("            width=0.8\\textwidth,\n");
    out.push_str("            height=0.6\\textwidth,\n");
    out.push_str("            minor tick num=1,\n");
    out.push_str("            tick style={\n");
    out.push_str("                major tick length=5pt,\n");
    out.push_str("                minor tick length=3pt,\n");
    out.push_str("                tick pos=both,\n");
    out.push_str("                color=black,\n");
    out.push_str("                line width=0.5pt\n");
    out.push_str("            },\n");
    out.push_str("            tick align=inside,\n");
    out.push_str("            xmajorgrids=false,\n");
    out.push_str("            ymajorgrids=false,\n");
    out.push_str("            xminorgrids=false,\n");
    out.push_str("            yminorgrids=false,\n");
    out.push_str("            axis line style={-},\n");
    out.push_str("            scaled ticks=false,\n");
    out.push_str("            xticklabel style={/pgf/number format/fixed},\n");
    out.push_str("            yticklabel style={/pgf/number format/fixed},\n");
    out.push_str(&format!(
        "            xticklabel style = {{/pgf/number format/precision={}}},\n",
        sig_figs
    ));
    out.push_str(&format!(
        "            yticklabel style = {{/pgf/number format/precision={}}},\n",
        sig_figs
    ));
    out.push_str("            unbounded coords=discard,\n");
    out.push_str("            legend cell align = {left},\n");
    out.push_str(&format!("            legend pos = {},\n", legend_pos));

    if scale_mode == "semilog" {
        out.push_str("            ymode=log,\n");
    } else if scale_mode == "loglog" {
        out.push_str("            xmode=log,\n");
        out.push_str("            ymode=log,\n");
    }

    let x_label = if x_label.trim().is_empty() { "x軸" } else { x_label.trim() };
    let y_label = if y_label.trim().is_empty() { "y軸" } else { y_label.trim() };
    let caption = if caption.trim().is_empty() { "図題" } else { caption.trim() };
    let label = if label.trim().is_empty() { "fig:label" } else { label.trim() };

    out.push_str(&format!("            xlabel={{{}}},\n", escape(x_label)));
    out.push_str(&format!("            ylabel={{{}}},\n", escape(y_label)));
    out.push_str(&format!("            xmin={}, xmax={},\n", xmin_val, xmax_val));
    out.push_str(&format!("            ymin={}, ymax={},\n", ymin_val, ymax_val));

    let mut x_step = (xmax_val - xmin_val) / 5;
    let mut y_step = (ymax_val - ymin_val) / 5;
    if x_step < 1 {
        x_step = 1;
    }
    if y_step < 1 {
        y_step = 1;
    }

    out.push_str("            xtick={");
    let mut i = xmin_val;
    while i <= xmax_val {
        if i != xmin_val {
            out.push(',');
        }
        out.push_str(&i.to_string());
        i += x_step;
    }
    out.push_str("},\n");

    out.push_str("            ytick={");
    let mut i = ymin_val;
    while i <= ymax_val {
        if i != ymin_val {
            out.push(',');
        }
        out.push_str(&i.to_string());
        i += y_step;
    }
    out.push_str("}\n");
    out.push_str("        ]\n");

    let total_cols = t.iter().map(|r| r.len()).max().unwrap_or(num_cols);
    let unc = uncertain_columns(t);

    for col in 1..num_cols {
        let err_idx = error_index_for(&unc, total_cols, col);
        out.push_str("            \\addplot [\n");
        let mut opts = plot_mark_style(col - 1).to_string();
        if err_idx.is_some() {
            opts.push_str(", error bars/.cd, y dir=both, y explicit");
        }
        push_pgfplots_options(&mut out, "                ", &opts);
        out.push_str("            ]\n");
        out.push_str("            table [\n");
        out.push_str("                col sep=comma,\n");
        out.push_str("                x index=0,\n");
        if let Some(ei) = err_idx {
            out.push_str(&format!("                y index={},\n", col));
            out.push_str(&format!("                y error index={}\n", ei));
        } else {
            out.push_str(&format!("                y index={}\n", col));
        }
        out.push_str(&format!("            ] {{{}.csv}};\n", filename));
        let legend_text = if headers.len() > col && !headers[col].is_empty() {
            headers[col].clone()
        } else {
            format!("data {}", col)
        };
        out.push_str(&format!("            \\addlegendentry{{{}}}\n", escape(&legend_text)));

        let fit_method = fit_method_for_series(fit_methods, col - 1);
        let fit = select_fit(&points_for_column(t, col), &fit_method);
        if fit.ok {
            out.push_str("            \\addplot [\n");
            push_pgfplots_options(
                &mut out,
                "                ",
                &format!(
                    "forget plot, color=black, domain={}:{}, samples=100, no markers, thick",
                    xmin_val, xmax_val
                ),
            );
            out.push_str("            ]\n");
            out.push_str("            {\n");
            out.push_str("                ");
            out.push_str(&multiline_plot_expression(&fit.expression));
            out.push_str("\n");
            out.push_str("            };\n");
            fit_equations.push(FitEquation {
                legend: legend_text,
                equation: format!("y_{{{}}} = {}", col, fit.tex_expression),
                r2: fit.r2,
            });
        }
    }
    out.push_str("        \\end{axis}\n");
    out.push_str("    \\end{tikzpicture}\n");
    if figure_number > 0 {
        out.push_str(&format!("    \\setcounter{{figure}}{{{}}}\n", figure_number - 1));
    }
    out.push_str(&format!("    \\caption{{{}}}\n", escape(caption)));
    out.push_str(&format!("    \\label{{{}}}\n", escape_label_arg(label)));
    out.push_str("\\end{figure}\n");
    for fe in &fit_equations {
        out.push_str(&format!("{} : $R^2={}$\n", fe.legend, format_double(fe.r2)));
        out.push_str("\\begin{equation}\n");
        out.push_str(&format!("    {}\n", fe.equation));
        out.push_str("\\end{equation}\n");
    }
    out
}

fn to_tikz_graph_preview(t: &Table, sig_figs: i32, legend_pos: &str, scale_mode: &str) -> String {
    if t.is_empty() {
        return String::new();
    }
    let num_cols = t[0].len();
    if num_cols < 2 {
        return String::new();
    }
    let _ = if sig_figs < 1 { 3 } else { sig_figs };
    let (xmin_val, xmax_val, ymin_val, ymax_val) = axis_bounds(t);

    let mut out = String::from("\\begin{tikzpicture}\n");
    out.push_str("  \\begin{axis}[\n");
    out.push_str("    width=0.8\\textwidth,\n");
    out.push_str("    height=0.6\\textwidth,\n");
    out.push_str("    minor tick num=1,\n");
    out.push_str("    tick style={\n");
    out.push_str("      major tick length=5pt,\n");
    out.push_str("      minor tick length=3pt,\n");
    out.push_str("      tick pos=both,\n");
    out.push_str("      color=black,\n");
    out.push_str("      line width=0.5pt\n");
    out.push_str("    },\n");
    out.push_str("    tick align=inside,\n");
    out.push_str("    xmajorgrids=false,\n");
    out.push_str("    ymajorgrids=false,\n");
    out.push_str("    xminorgrids=false,\n");
    out.push_str("    yminorgrids=false,\n");
    out.push_str("    axis line style={-},\n");
    out.push_str("    scaled ticks=false,\n");
    out.push_str("    legend cell align = {left},\n");
    out.push_str(&format!("    legend pos = {},\n", legend_pos));

    if scale_mode == "semilog" {
        out.push_str("    ymode=log,\n");
    } else if scale_mode == "loglog" {
        out.push_str("    xmode=log,\n");
        out.push_str("    ymode=log,\n");
    }

    out.push_str("    xlabel={x軸},\n");
    out.push_str("    ylabel={y軸},\n");
    out.push_str(&format!("    xmin={}, xmax={},\n", xmin_val, xmax_val));
    out.push_str(&format!("    ymin={}, ymax={},\n", ymin_val, ymax_val));

    let mut x_step = (xmax_val - xmin_val) / 5;
    let mut y_step = (ymax_val - ymin_val) / 5;
    if x_step < 1 {
        x_step = 1;
    }
    if y_step < 1 {
        y_step = 1;
    }

    out.push_str("    xtick={");
    let mut i = xmin_val;
    while i <= xmax_val {
        if i != xmin_val {
            out.push(',');
        }
        out.push_str(&i.to_string());
        i += x_step;
    }
    out.push_str("},\n");

    out.push_str("    ytick={");
    let mut i = ymin_val;
    while i <= ymax_val {
        if i != ymin_val {
            out.push(',');
        }
        out.push_str(&i.to_string());
        i += y_step;
    }
    out.push_str("}\n");
    out.push_str("  ]\n");

    for col in 1..num_cols {
        out.push_str("    \\addplot [only marks, mark=*] coordinates {\n");
        for row in t {
            if row.len() > col && is_number(&row[0]) && is_number(&row[col]) {
                out.push_str(&format!("      ({},{})\n", row[0], row[col]));
            }
        }
        out.push_str("    };\n");
        out.push_str(&format!("    \\addlegendentry{{凡例{}}}\n", col));
    }

    out.push_str("  \\end{axis}\n");
    out.push_str("\\end{tikzpicture}\n");
    out
}

// ─── wasm-bindgen エクスポート (旧 12 関数相当) ──────────────

#[wasm_bindgen]
pub fn gen_latex(input: &str) -> String {
    to_latex(&parse(input))
}
#[wasm_bindgen]
pub fn gen_csv(input: &str) -> String {
    to_csv(&parse(input))
}
#[wasm_bindgen]
pub fn gen_csv_rounded(input: &str, decimals: i32) -> String {
    to_csv_rounded(&parse(input), decimals)
}
#[wasm_bindgen]
pub fn gen_csv_sig_figs(input: &str, sig_figs: i32) -> String {
    to_csv_sig_figs(&parse(input), sig_figs)
}
#[wasm_bindgen]
pub fn gen_latex_rounded(input: &str, decimals: i32) -> String {
    to_latex_rounded(&parse(input), decimals)
}
#[wasm_bindgen]
pub fn gen_latex_sig_figs(input: &str, sig_figs: i32) -> String {
    to_latex_sig_figs(&parse(input), sig_figs)
}
#[wasm_bindgen]
pub fn gen_tikz_graph(input: &str, filename: &str, sig_figs: i32, legend_pos: &str, scale_mode: &str) -> String {
    to_tikz_graph(&parse(input), filename, sig_figs, legend_pos, scale_mode, 0, "auto", &[], "", "", "", "")
}
#[wasm_bindgen]
pub fn gen_tikz_graph_preview(input: &str, sig_figs: i32, legend_pos: &str, scale_mode: &str) -> String {
    to_tikz_graph_preview(&parse(input), sig_figs, legend_pos, scale_mode)
}
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn gen_latex_config(
    input: &str,
    mode: i32,
    decimals: i32,
    sig_figs: i32,
    has_header: i32,
    clean_input: i32,
    booktabs: i32,
    siunitx: i32,
) -> String {
    let t = prepare_table(input, has_header != 0, clean_input != 0, true);
    to_latex_mode_style(&t, mode, decimals, sig_figs, has_header != 0, booktabs != 0, siunitx != 0)
}
#[wasm_bindgen]
pub fn gen_csv_config(input: &str, mode: i32, decimals: i32, sig_figs: i32, has_header: i32, clean_input: i32) -> String {
    let t = prepare_table(input, has_header != 0, clean_input != 0, true);
    to_csv_mode(&t, mode, decimals, sig_figs)
}
#[wasm_bindgen]
#[allow(clippy::too_many_arguments)]
pub fn gen_tikz_graph_config(
    input: &str,
    filename: &str,
    sig_figs: i32,
    legend_pos: &str,
    scale_mode: &str,
    fit_method: &str,
    has_header: i32,
    clean_input: i32,
    figure_number: i32,
    x_label: &str,
    y_label: &str,
    caption: &str,
    label: &str,
) -> String {
    let t = prepare_table(input, has_header != 0, clean_input != 0, false);
    let headers = if has_header != 0 {
        let with_hdr = prepare_table(input, true, clean_input != 0, true);
        with_hdr.first().cloned().unwrap_or_default()
    } else {
        Vec::new()
    };
    to_tikz_graph(
        &t,
        filename,
        sig_figs,
        legend_pos,
        scale_mode,
        figure_number,
        fit_method,
        &headers,
        x_label,
        y_label,
        caption,
        label,
    )
}
#[wasm_bindgen]
pub fn gen_csv_attachment(input: &str, has_header: i32, clean_input: i32) -> String {
    let t = prepare_table(input, has_header != 0, clean_input != 0, false);
    to_graph_csv(&t)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn latex_basic() {
        let out = gen_latex("a,b\n1,2");
        assert!(out.starts_with("\\begin{tabular}{cc}"));
        assert!(out.contains("1 & 2 \\\\"));
        assert!(out.ends_with("\\end{tabular}"));
    }

    #[test]
    fn csv_rounding() {
        assert_eq!(gen_csv_rounded("1.239,2.5", 2), "1.24,2.50");
        assert_eq!(round_significant_figures("123.456", 2), "120");
        assert_eq!(round_significant_figures("0.0012345", 2), "0.0012");
    }

    #[test]
    fn format_g_matches_cpp() {
        assert_eq!(format_double(0.0), "0");
        assert_eq!(format_double(1.5), "1.5");
        assert_eq!(format_double(100.0), "100");
        assert_eq!(format_double(0.0001), "0.0001");
        assert_eq!(format_double(0.00001), "1e-05");
    }

    #[test]
    fn tikz_has_fit() {
        let out = gen_tikz_graph("x,y\n1,2\n2,4\n3,6", "data", 3, "north west", "linear");
        assert!(out.contains("\\begin{figure}[H]"));
        assert!(out.contains("\\addplot"));
        assert!(out.contains("R^2="));
    }

    #[test]
    fn latex_booktabs_config() {
        let out = gen_latex_config("x,y\n1,2", 0, 2, 3, 1, 1, 1, 0);
        assert!(out.contains("\\toprule"));
        assert!(out.contains("\\midrule"));
        assert!(out.contains("\\bottomrule"));
        assert!(!out.contains("\\hline"));
    }

    #[test]
    fn latex_siunitx_config() {
        let out = gen_latex_config("電圧 [V],電流 [mA]\n1.20,3.4\n2.00,5.6", 0, 2, 3, 1, 1, 1, 1);
        assert!(out.contains("S[table-format"));
        assert!(out.contains("\\si{\\volt}"));
        assert!(out.contains("\\si{\\milli\\ampere}"));
        // 数値セルは波括弧で囲まずそのまま出す
        assert!(out.contains("1.20 & 3.4"));
    }

    #[test]
    fn latex_uncertainty_plain() {
        // 非 siunitx は $値 \pm 誤差$
        let out = gen_latex_config("x,y\n1,2.50 ± 0.05", 0, 2, 3, 1, 1, 0, 0);
        assert!(out.contains("$2.50 \\pm 0.05$"));
    }

    #[test]
    fn tikz_error_bars() {
        // 不確かさ付き系列は error bars と y error index を出す。
        let out = gen_tikz_graph_config(
            "x,y\n1,2 ± 0.1\n2,4 ± 0.2\n3,6 ± 0.3",
            "data", 3, "north west", "linear", "none", 1, 1, 0, "", "", "", "",
        );
        // push_pgfplots_options が ", " を改行に割るので個別に確認する。
        assert!(out.contains("error bars/.cd"));
        assert!(out.contains("y dir=both"));
        assert!(out.contains("y explicit"));
        assert!(out.contains("y error index=2"));
    }

    #[test]
    fn graph_csv_appends_error_column() {
        // 元の列(値) + 末尾に誤差列。値のみの行は誤差 0。
        let csv = gen_csv_attachment("x,y\n1,2 ± 0.1\n2,4", 1, 1);
        assert_eq!(csv, "1,2,0.1\n2,4,0");
    }

    #[test]
    fn latex_uncertainty_siunitx() {
        // siunitx は `値 +- 誤差` 構文。誤差付き列は table-format を付けない。
        let out = gen_latex_config("x,y [V]\n1,2.50 +- 0.05\n2,3.10 ± 0.04", 0, 2, 3, 1, 1, 0, 1);
        assert!(out.contains("2.50 +- 0.05"));
        assert!(out.contains("3.10 +- 0.04"));
    }

    #[test]
    fn tikz_uses_labels_and_caption() {
        let out = gen_tikz_graph_config(
            "x,y\n1,2\n2,4",
            "data",
            3,
            "north west",
            "linear",
            "linear",
            1,
            1,
            0,
            "Voltage V",
            "Current A",
            "IV curve",
            "fig:iv_curve",
        );
        assert!(out.contains("xlabel={Voltage V}"));
        assert!(out.contains("ylabel={Current A}"));
        assert!(out.contains("\\caption{IV curve}"));
        assert!(out.contains("\\label{fig:iv_curve}"));
    }
}
