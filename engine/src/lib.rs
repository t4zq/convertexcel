//! converTeXcel 統計エンジン (Rust → WebAssembly)。
//!
//! フロント / Rails と同一仕様の記述統計と Pearson 相関を計算する。
//! 入出力は JSON 文字列で受け渡す。
//!   入力: `[["x","A"],["1","2.1"], ...]`  (1行目=ヘッダ)
//!   出力: `{ "descriptive": [...], "correlation": {...} }`

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

pub mod convert;
pub mod signal;
pub mod stats;
pub mod circuit;

#[derive(Serialize)]
struct ColumnStats {
    column: String,
    n: usize,
    mean: f64,
    std: f64,
    min: f64,
    q1: f64,
    median: f64,
    q3: f64,
    max: f64,
}

#[derive(Serialize)]
struct CorrelationMatrix {
    columns: Vec<String>,
    matrix: Vec<Vec<f64>>,
}

#[derive(Serialize)]
struct StatsResult {
    descriptive: Vec<ColumnStats>,
    correlation: CorrelationMatrix,
}

#[derive(Deserialize)]
struct Grid(Vec<Vec<String>>);

fn parse_num(s: &str) -> Option<f64> {
    let t = s.trim();
    if t.is_empty() {
        return None;
    }
    t.parse::<f64>().ok().filter(|v| v.is_finite())
}

fn header(grid: &[Vec<String>], c: usize) -> String {
    let h = grid[0].get(c).map(|s| s.trim()).unwrap_or("");
    if h.is_empty() {
        format!("col{}", c + 1)
    } else {
        h.to_string()
    }
}

/// 数値列のインデックス (1つでも数値を含む列)。
fn numeric_indices(grid: &[Vec<String>]) -> Vec<usize> {
    if grid.len() < 2 {
        return Vec::new();
    }
    let cols = grid[0].len();
    let mut idx = Vec::new();
    for c in 0..cols {
        let any = grid[1..]
            .iter()
            .any(|row| row.get(c).and_then(|s| parse_num(s)).is_some());
        if any {
            idx.push(c);
        }
    }
    idx
}

/// 線形補間の分位数 (numpy 既定 'linear' 相当)。`sorted` は昇順。
fn quantile(sorted: &[f64], q: f64) -> f64 {
    match sorted.len() {
        0 => f64::NAN,
        1 => sorted[0],
        n => {
            let pos = (n - 1) as f64 * q;
            let base = pos.floor() as usize;
            let rest = pos - base as f64;
            if base + 1 < n {
                sorted[base] + rest * (sorted[base + 1] - sorted[base])
            } else {
                sorted[base]
            }
        }
    }
}

fn describe(name: String, xs: &[f64]) -> ColumnStats {
    let n = xs.len();
    let mean = xs.iter().sum::<f64>() / n as f64;
    let variance = if n > 1 {
        xs.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1) as f64
    } else {
        0.0
    };
    let mut sorted = xs.to_vec();
    sorted.sort_by(|a, b| a.partial_cmp(b).unwrap());
    ColumnStats {
        column: name,
        n,
        mean,
        std: variance.sqrt(),
        min: sorted[0],
        q1: quantile(&sorted, 0.25),
        median: quantile(&sorted, 0.5),
        q3: quantile(&sorted, 0.75),
        max: sorted[n - 1],
    }
}

fn pearson(a: &[f64], b: &[f64]) -> f64 {
    let n = a.len().min(b.len());
    if n < 2 {
        return f64::NAN;
    }
    let ma = a[..n].iter().sum::<f64>() / n as f64;
    let mb = b[..n].iter().sum::<f64>() / n as f64;
    let (mut cov, mut va, mut vb) = (0.0, 0.0, 0.0);
    for i in 0..n {
        let da = a[i] - ma;
        let db = b[i] - mb;
        cov += da * db;
        va += da * da;
        vb += db * db;
    }
    if va == 0.0 || vb == 0.0 {
        return f64::NAN;
    }
    cov / (va * vb).sqrt()
}

fn compute(grid: &[Vec<String>]) -> StatsResult {
    let idx = numeric_indices(grid);

    // 記述統計
    let descriptive = idx
        .iter()
        .map(|&c| {
            let xs: Vec<f64> = grid[1..]
                .iter()
                .filter_map(|row| row.get(c).and_then(|s| parse_num(s)))
                .collect();
            describe(header(grid, c), &xs)
        })
        .collect();

    // 相関行列 (両列ともに数値の共通行のみ)
    let columns: Vec<String> = idx.iter().map(|&c| header(grid, c)).collect();
    let mut matrix = vec![vec![f64::NAN; idx.len()]; idx.len()];
    for i in 0..idx.len() {
        for j in i..idx.len() {
            let (ci, cj) = (idx[i], idx[j]);
            let mut a = Vec::new();
            let mut b = Vec::new();
            for row in &grid[1..] {
                if let (Some(va), Some(vb)) = (
                    row.get(ci).and_then(|s| parse_num(s)),
                    row.get(cj).and_then(|s| parse_num(s)),
                ) {
                    a.push(va);
                    b.push(vb);
                }
            }
            let r = if i == j { 1.0 } else { pearson(&a, &b) };
            matrix[i][j] = r;
            matrix[j][i] = r;
        }
    }

    StatsResult {
        descriptive,
        correlation: CorrelationMatrix { columns, matrix },
    }
}

/// JSON のグリッドを受け取り、統計結果を JSON 文字列で返す。
#[wasm_bindgen]
pub fn compute_stats(input: &str) -> String {
    let grid: Grid = match serde_json::from_str(input) {
        Ok(g) => g,
        Err(e) => return format!("{{\"error\":\"{}\"}}", e),
    };
    let result = compute(&grid.0);
    serde_json::to_string(&result).unwrap_or_else(|e| format!("{{\"error\":\"{}\"}}", e))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn basic_describe() {
        let grid = vec![
            vec!["x".into(), "A".into()],
            vec!["1".into(), "2.0".into()],
            vec!["2".into(), "4.0".into()],
            vec!["3".into(), "6.0".into()],
        ];
        let r = compute(&grid);
        assert_eq!(r.descriptive.len(), 2);
        let a = &r.descriptive[1];
        assert!((a.mean - 4.0).abs() < 1e-9);
        assert!((a.median - 4.0).abs() < 1e-9);
        // 完全相関
        assert!((r.correlation.matrix[0][1] - 1.0).abs() < 1e-9);
    }
}
