//! 回路解析: 周波数特性(Bode) / 過渡応答 / インピーダンス。
//! 旧 circuit.js のうち中核(dB変換・-3dBカットオフ・傾き・時定数τ)を移植。
//! ※ 2次フィルタ精密フィット等の細部は Phase E で circuit.js を見ながら精緻化する。

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

pub fn to_db(linear: f64) -> f64 {
    20.0 * linear.abs().max(1e-15).log10()
}

fn lin_reg(xs: &[f64], ys: &[f64]) -> (f64, f64) {
    let n = xs.len() as f64;
    if n < 2.0 {
        return (f64::NAN, f64::NAN);
    }
    let sx: f64 = xs.iter().sum();
    let sy: f64 = ys.iter().sum();
    let sxx: f64 = xs.iter().map(|x| x * x).sum();
    let sxy: f64 = xs.iter().zip(ys).map(|(x, y)| x * y).sum();
    let denom = n * sxx - sx * sx;
    if denom.abs() < 1e-14 {
        return (f64::NAN, f64::NAN);
    }
    let slope = (n * sxy - sx * sy) / denom;
    (slope, (sy - slope * sx) / n)
}

/// (freq, db) ペア (f>0) を昇順整列。
fn sorted_pairs(freq: &[f64], val: &[f64]) -> Vec<(f64, f64)> {
    let mut pairs: Vec<(f64, f64)> = freq
        .iter()
        .zip(val)
        .filter(|(f, v)| **f > 0.0 && v.is_finite())
        .map(|(f, v)| (*f, *v))
        .collect();
    pairs.sort_by(|a, b| a.0.partial_cmp(&b.0).unwrap());
    pairs
}

/// -3dB カットオフ周波数 (対数周波数で線形補間)。
fn detect_cutoff(pairs: &[(f64, f64)]) -> Option<f64> {
    if pairs.len() < 2 {
        return None;
    }
    let max_gain = pairs.iter().map(|p| p.1).fold(f64::NEG_INFINITY, f64::max);
    let target = max_gain - 3.0;
    for w in pairs.windows(2) {
        let (f0, d0) = w[0];
        let (f1, d1) = w[1];
        // target を跨ぐ区間を探す
        if (d0 - target) * (d1 - target) <= 0.0 && (d1 - d0).abs() > 1e-12 {
            let ratio = (target - d0) / (d1 - d0);
            let log_f = f0.log10() + ratio * (f1.log10() - f0.log10());
            return Some(10f64.powf(log_f));
        }
    }
    None
}

/// 高周波側の傾き dB/decade (末尾 1/3 点で回帰)。
fn slope_db_per_decade(pairs: &[(f64, f64)]) -> f64 {
    let n = pairs.len();
    if n < 3 {
        return f64::NAN;
    }
    let start = n - (n / 3).max(2);
    let tail = &pairs[start..];
    let logf: Vec<f64> = tail.iter().map(|p| p.0.log10()).collect();
    let db: Vec<f64> = tail.iter().map(|p| p.1).collect();
    lin_reg(&logf, &db).0
}

// ─── 入出力 ────────────────────────────────────────────────

/// 単峰関数 fn を [lo,hi] で最小化 (黄金分割探索)。
fn golden_section(f: &dyn Fn(f64) -> f64, mut lo: f64, mut hi: f64, tol: f64) -> f64 {
    let gr = (5f64.sqrt() - 1.0) / 2.0;
    let mut c = hi - gr * (hi - lo);
    let mut d = lo + gr * (hi - lo);
    let mut fc = f(c);
    let mut fd = f(d);
    while (hi - lo).abs() > tol {
        if fc < fd {
            hi = d;
            d = c;
            fd = fc;
            c = hi - gr * (hi - lo);
            fc = f(c);
        } else {
            lo = c;
            c = d;
            fc = fd;
            d = lo + gr * (hi - lo);
            fd = f(d);
        }
    }
    (lo + hi) / 2.0
}

#[derive(Deserialize)]
#[allow(dead_code)]
struct CircuitInput {
    mode: String,
    /// 列1: bode→freq, transient→time, impedance→freq
    a: Vec<f64>,
    /// 列2: bode→gain(dB or linear), transient→value, impedance→|Z|
    b: Vec<f64>,
    /// 任意の列3 (bode→phase 等)
    #[serde(default)]
    c: Vec<f64>,
    /// b がリニア振幅なら true (dBへ変換)
    #[serde(default)]
    b_is_linear: bool,
}

#[derive(Serialize, Default)]
struct CircuitOutput {
    mode: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    cutoff_fc: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    max_gain_db: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    slope_db_per_decade: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    tau: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    final_value: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    z_min: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    z_max: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    resonance_fc: Option<f64>,
}

fn analyze_bode(input: &CircuitInput) -> CircuitOutput {
    let dbs: Vec<f64> = if input.b_is_linear {
        input.b.iter().map(|v| to_db(*v)).collect()
    } else {
        input.b.clone()
    };
    let pairs = sorted_pairs(&input.a, &dbs);
    let fc = detect_cutoff(&pairs);
    CircuitOutput {
        mode: "bode".into(),
        max_gain_db: pairs.iter().map(|p| p.1).fold(None, |acc: Option<f64>, v| {
            Some(acc.map_or(v, |m| m.max(v)))
        }),
        cutoff_fc: fc,
        slope_db_per_decade: Some(slope_db_per_decade(&pairs)).filter(|v| v.is_finite()),
        tau: fc.map(|f| 1.0 / (2.0 * std::f64::consts::PI * f)),
        ..Default::default()
    }
}

/// 過渡応答: 最終値へ漸近する1次系とみなし、log|v - v_final| の傾きから τ を推定。
fn analyze_transient(input: &CircuitInput) -> CircuitOutput {
    let t = &input.a;
    let v = &input.b;
    let n = t.len().min(v.len());
    let mut out = CircuitOutput { mode: "transient".into(), ..Default::default() };
    if n < 3 {
        return out;
    }
    // 最終値 = 末尾数点の平均、初期値 = 先頭
    let tail = (n / 5).max(1);
    let v_final = v[n - tail..n].iter().sum::<f64>() / tail as f64;
    let v0 = v[0];
    out.final_value = Some(v_final);

    // 1次系 m(t) = v_final + (v0 - v_final)·exp(-t/τ) の MSE を最小化して τ を推定
    let t_span = t[n - 1] - t[0];
    if t_span > 0.0 {
        let objective = |tau: f64| -> f64 {
            let mut sse = 0.0;
            for i in 0..n {
                let m = v_final + (v0 - v_final) * (-(t[i] - t[0]) / tau).exp();
                sse += (v[i] - m).powi(2);
            }
            sse
        };
        let tau = golden_section(&objective, t_span * 1e-3, t_span, t_span * 1e-6);
        if tau.is_finite() && tau > 0.0 {
            out.tau = Some(tau);
        }
    }
    out
}

/// インピーダンス: |Z| の範囲と、最小 |Z| を与える周波数(共振)を返す。
fn analyze_impedance(input: &CircuitInput) -> CircuitOutput {
    let pairs = sorted_pairs(&input.a, &input.b);
    let mut out = CircuitOutput { mode: "impedance".into(), ..Default::default() };
    if pairs.is_empty() {
        return out;
    }
    let z_min = pairs.iter().map(|p| p.1).fold(f64::INFINITY, f64::min);
    let z_max = pairs.iter().map(|p| p.1).fold(f64::NEG_INFINITY, f64::max);
    out.z_min = Some(z_min);
    out.z_max = Some(z_max);
    out.resonance_fc = pairs
        .iter()
        .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap())
        .map(|p| p.0);
    out
}

fn analyze(input: &CircuitInput) -> CircuitOutput {
    match input.mode.as_str() {
        "transient" => analyze_transient(input),
        "impedance" => analyze_impedance(input),
        _ => analyze_bode(input),
    }
}

#[wasm_bindgen]
pub fn analyze_circuit(input: &str) -> String {
    let parsed: CircuitInput = match serde_json::from_str(input) {
        Ok(v) => v,
        Err(e) => return format!("{{\"error\":\"{}\"}}", e),
    };
    serde_json::to_string(&analyze(&parsed)).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn bode_cutoff() {
        // 0dB から下降、-3dB を 100Hz 付近で跨ぐ簡単な例
        let freq = vec![1.0, 10.0, 100.0, 1000.0];
        let db = vec![0.0, -1.0, -3.0, -23.0];
        let out = analyze_bode(&CircuitInput {
            mode: "bode".into(),
            a: freq,
            b: db,
            c: vec![],
            b_is_linear: false,
        });
        assert!(out.cutoff_fc.unwrap() > 50.0 && out.cutoff_fc.unwrap() < 200.0);
        assert!(out.tau.is_some());
    }

    #[test]
    fn transient_tau() {
        // v = 1 - exp(-t/0.5) → τ≈0.5
        let t: Vec<f64> = (0..50).map(|i| i as f64 * 0.05).collect();
        let v: Vec<f64> = t.iter().map(|&ti| 1.0 - (-ti / 0.5).exp()).collect();
        let out = analyze_transient(&CircuitInput {
            mode: "transient".into(),
            a: t,
            b: v,
            c: vec![],
            b_is_linear: false,
        });
        let tau = out.tau.unwrap();
        assert!((tau - 0.5).abs() < 0.1, "tau={}", tau);
    }
}
