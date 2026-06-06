//! 曲線フィット (linear / poly / exp / power / sin) と Welch の t 検定。
//! 旧 stats.js / fit.js のフィット節・検定に対応。計算はクライアント(WASM)側。

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// ─── 入出力スキーマ ────────────────────────────────────────

#[derive(Deserialize)]
struct FitInput {
    x: Vec<f64>,
    y: Vec<f64>,
    models: Vec<String>,
    #[serde(default = "default_degree")]
    poly_degree: usize,
    #[serde(default = "default_samples")]
    samples: usize,
}

fn default_degree() -> usize {
    2
}
fn default_samples() -> usize {
    200
}

#[derive(Serialize)]
struct Curve {
    x: Vec<f64>,
    y: Vec<f64>,
}

#[derive(Serialize)]
struct FitModelResult {
    model: String,
    label: String,
    params: Vec<f64>,
    r2: f64,
    rmse: f64,
    aic: f64,
    expression: String,
    curve: Curve,
    residuals: Vec<f64>,
}

#[derive(Serialize)]
struct FitOutput {
    results: Vec<FitModelResult>,
    recommended: Option<String>,
}

// ─── 線形代数 ──────────────────────────────────────────────

fn solve(mut a: Vec<Vec<f64>>, mut b: Vec<f64>) -> Option<Vec<f64>> {
    let n = b.len();
    for i in 0..n {
        let mut pivot = i;
        for r in (i + 1)..n {
            if a[r][i].abs() > a[pivot][i].abs() {
                pivot = r;
            }
        }
        if a[pivot][i].abs() < 1e-15 {
            return None;
        }
        a.swap(pivot, i);
        b.swap(pivot, i);
        let div = a[i][i];
        for c in i..n {
            a[i][c] /= div;
        }
        b[i] /= div;
        for r in 0..n {
            if r != i {
                let f = a[r][i];
                for c in i..n {
                    a[r][c] -= f * a[i][c];
                }
                b[r] -= f * b[i];
            }
        }
    }
    Some(b)
}

fn poly_coeffs(x: &[f64], y: &[f64], degree: usize) -> Option<Vec<f64>> {
    let n = degree + 1;
    if x.len() < n {
        return None;
    }
    let mut a = vec![vec![0.0; n]; n];
    let mut b = vec![0.0; n];
    for k in 0..x.len() {
        let mut powers = vec![1.0; 2 * degree + 1];
        for i in 1..=(2 * degree) {
            powers[i] = powers[i - 1] * x[k];
        }
        for row in 0..n {
            for col in 0..n {
                a[row][col] += powers[row + col];
            }
            b[row] += y[k] * powers[row];
        }
    }
    solve(a, b)
}

// ─── 評価指標 ──────────────────────────────────────────────

fn metrics(y: &[f64], pred: &[f64], k: usize) -> (f64, f64, f64, Vec<f64>) {
    let n = y.len();
    let mean = y.iter().sum::<f64>() / n as f64;
    let mut sse = 0.0;
    let mut sst = 0.0;
    let mut residuals = Vec::with_capacity(n);
    for i in 0..n {
        let r = y[i] - pred[i];
        residuals.push(r);
        sse += r * r;
        sst += (y[i] - mean).powi(2);
    }
    let r2 = if sst < 1e-12 {
        if sse < 1e-12 {
            1.0
        } else {
            0.0
        }
    } else {
        1.0 - sse / sst
    };
    let rmse = (sse / n as f64).sqrt();
    // 完全フィット(sse=0)でも有限値にする (JSON で null 化させない / 推奨選択に残す)
    let sse_eff = sse.max(1e-300);
    let aic = n as f64 * (sse_eff / n as f64).ln() + 2.0 * k as f64;
    (r2, rmse, aic, residuals)
}

fn sample_curve(x: &[f64], samples: usize, f: &dyn Fn(f64) -> f64) -> Curve {
    let xmin = x.iter().cloned().fold(f64::INFINITY, f64::min);
    let xmax = x.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let mut cx = Vec::with_capacity(samples);
    let mut cy = Vec::with_capacity(samples);
    if samples < 2 || !xmin.is_finite() || !xmax.is_finite() {
        return Curve { x: cx, y: cy };
    }
    for i in 0..samples {
        let xi = xmin + (xmax - xmin) * i as f64 / (samples - 1) as f64;
        cx.push(xi);
        cy.push(f(xi));
    }
    Curve { x: cx, y: cy }
}

fn fmt(v: f64) -> String {
    format!("{:.4}", v)
}

// ─── 各モデル ──────────────────────────────────────────────

fn fit_poly(x: &[f64], y: &[f64], degree: usize, samples: usize, model: &str, label: &str) -> Option<FitModelResult> {
    let coeffs = poly_coeffs(x, y, degree)?;
    let cf = coeffs.clone();
    let predict = move |xi: f64| {
        let mut acc = 0.0;
        let mut p = 1.0;
        for &c in &cf {
            acc += c * p;
            p *= xi;
        }
        acc
    };
    let pred: Vec<f64> = x.iter().map(|&xi| predict(xi)).collect();
    let (r2, rmse, aic, residuals) = metrics(y, &pred, coeffs.len());
    let mut expr = fmt(coeffs[0]);
    for (i, c) in coeffs.iter().enumerate().skip(1) {
        expr += &format!(" + {}x^{}", fmt(*c), i);
    }
    Some(FitModelResult {
        model: model.to_string(),
        label: label.to_string(),
        params: coeffs,
        r2,
        rmse,
        aic,
        expression: expr,
        curve: sample_curve(x, samples, &predict),
        residuals,
    })
}

fn fit_exp(x: &[f64], y: &[f64], samples: usize) -> Option<FitModelResult> {
    // y = a*exp(b x) → ln y = ln a + b x (y>0)
    let mut lx = Vec::new();
    let mut ly = Vec::new();
    for i in 0..x.len() {
        if y[i] <= 0.0 {
            return None;
        }
        lx.push(x[i]);
        ly.push(y[i].ln());
    }
    let c = poly_coeffs(&lx, &ly, 1)?;
    let a = c[0].exp();
    let b = c[1];
    let predict = move |xi: f64| a * (b * xi).exp();
    let pred: Vec<f64> = x.iter().map(|&xi| predict(xi)).collect();
    let (r2, rmse, aic, residuals) = metrics(y, &pred, 2);
    Some(FitModelResult {
        model: "exp".into(),
        label: "指数".into(),
        params: vec![a, b],
        r2,
        rmse,
        aic,
        expression: format!("{}·exp({}x)", fmt(a), fmt(b)),
        curve: sample_curve(x, samples, &predict),
        residuals,
    })
}

fn fit_power(x: &[f64], y: &[f64], samples: usize) -> Option<FitModelResult> {
    // y = a*x^b → ln y = ln a + b ln x (x>0,y>0)
    let mut lx = Vec::new();
    let mut ly = Vec::new();
    for i in 0..x.len() {
        if x[i] <= 0.0 || y[i] <= 0.0 {
            return None;
        }
        lx.push(x[i].ln());
        ly.push(y[i].ln());
    }
    let c = poly_coeffs(&lx, &ly, 1)?;
    let a = c[0].exp();
    let b = c[1];
    let predict = move |xi: f64| if xi > 0.0 { a * xi.powf(b) } else { f64::NAN };
    let pred: Vec<f64> = x.iter().map(|&xi| predict(xi)).collect();
    let (r2, rmse, aic, residuals) = metrics(y, &pred, 2);
    Some(FitModelResult {
        model: "power".into(),
        label: "べき乗".into(),
        params: vec![a, b],
        r2,
        rmse,
        aic,
        expression: format!("{}·x^{}", fmt(a), fmt(b)),
        curve: sample_curve(x, samples, &predict),
        residuals,
    })
}

fn fit_sin(x: &[f64], y: &[f64], samples: usize) -> Option<FitModelResult> {
    // y = a*sin(w x + p) + d。周波数 w をグリッド探索し、各 w で線形最小二乗
    // y ≈ A cos(w x) + B sin(w x) + D。
    let n = x.len();
    if n < 4 {
        return None;
    }
    let xmin = x.iter().cloned().fold(f64::INFINITY, f64::min);
    let xmax = x.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
    let span = xmax - xmin;
    if span <= 0.0 {
        return None;
    }
    let w_min = std::f64::consts::TAU / span * 0.5;
    let w_max = std::f64::consts::TAU / span * (n as f64 / 2.0);
    let steps = 400;
    let mut best: Option<(f64, Vec<f64>, f64)> = None; // (w, [A,B,D], sse)
    for s in 0..steps {
        let w = w_min + (w_max - w_min) * s as f64 / (steps - 1) as f64;
        // 正規方程式 (3x3): 基底 cos(wx), sin(wx), 1
        let mut a = vec![vec![0.0; 3]; 3];
        let mut b = vec![0.0; 3];
        for i in 0..n {
            let c = (w * x[i]).cos();
            let sn = (w * x[i]).sin();
            let basis = [c, sn, 1.0];
            for r in 0..3 {
                for cc in 0..3 {
                    a[r][cc] += basis[r] * basis[cc];
                }
                b[r] += basis[r] * y[i];
            }
        }
        if let Some(sol) = solve(a, b) {
            let mut sse = 0.0;
            for i in 0..n {
                let pred = sol[0] * (w * x[i]).cos() + sol[1] * (w * x[i]).sin() + sol[2];
                sse += (y[i] - pred).powi(2);
            }
            if best.as_ref().map(|bb| sse < bb.2).unwrap_or(true) {
                best = Some((w, sol, sse));
            }
        }
    }
    let (w, sol, _) = best?;
    let (big_a, big_b, d) = (sol[0], sol[1], sol[2]);
    let amp = (big_a * big_a + big_b * big_b).sqrt();
    let phase = big_a.atan2(big_b); // A cos + B sin = amp sin(wx + phase)
    let predict = move |xi: f64| amp * (w * xi + phase).sin() + d;
    let pred: Vec<f64> = x.iter().map(|&xi| predict(xi)).collect();
    let (r2, rmse, aic, residuals) = metrics(y, &pred, 4);
    Some(FitModelResult {
        model: "sin".into(),
        label: "三角関数".into(),
        params: vec![amp, w, phase, d],
        r2,
        rmse,
        aic,
        expression: format!("{}·sin({}x + {}) + {}", fmt(amp), fmt(w), fmt(phase), fmt(d)),
        curve: sample_curve(x, samples, &predict),
        residuals,
    })
}

fn run_fit(input: &FitInput) -> FitOutput {
    // x,y は数値ペアのみに整える
    let mut xs = Vec::new();
    let mut ys = Vec::new();
    for i in 0..input.x.len().min(input.y.len()) {
        if input.x[i].is_finite() && input.y[i].is_finite() {
            xs.push(input.x[i]);
            ys.push(input.y[i]);
        }
    }
    let mut results = Vec::new();
    for m in &input.models {
        let r = match m.as_str() {
            "linear" => fit_poly(&xs, &ys, 1, input.samples, "linear", "線形"),
            "poly" => fit_poly(&xs, &ys, input.poly_degree.max(1), input.samples, "poly", "多項式"),
            "exp" => fit_exp(&xs, &ys, input.samples),
            "power" => fit_power(&xs, &ys, input.samples),
            "sin" => fit_sin(&xs, &ys, input.samples),
            _ => None,
        };
        if let Some(r) = r {
            results.push(r);
        }
    }
    // 推奨 = AIC 最小
    let recommended = results
        .iter()
        .filter(|r| r.aic.is_finite())
        .min_by(|a, b| a.aic.partial_cmp(&b.aic).unwrap())
        .map(|r| r.model.clone());
    FitOutput { results, recommended }
}

// ─── Welch の t 検定 ───────────────────────────────────────

#[derive(Deserialize)]
struct TTestInput {
    a: Vec<f64>,
    b: Vec<f64>,
}

#[derive(Serialize)]
struct TTestOutput {
    mean_a: f64,
    mean_b: f64,
    var_a: f64,
    var_b: f64,
    n_a: usize,
    n_b: usize,
    t: f64,
    df: f64,
    p_value: f64,
}

fn mean_var(v: &[f64]) -> (f64, f64) {
    let n = v.len();
    let mean = v.iter().sum::<f64>() / n as f64;
    let var = if n > 1 {
        v.iter().map(|x| (x - mean).powi(2)).sum::<f64>() / (n - 1) as f64
    } else {
        0.0
    };
    (mean, var)
}

// ln Γ(x) — Lanczos 近似
fn ln_gamma(x: f64) -> f64 {
    const G: [f64; 6] = [
        76.18009172947146,
        -86.50532032941677,
        24.01409824083091,
        -1.231739572450155,
        0.1208650973866179e-2,
        -0.5395239384953e-5,
    ];
    let mut xx = x;
    let mut tmp = x + 5.5;
    tmp -= (x + 0.5) * tmp.ln();
    let mut ser = 1.000000000190015;
    for g in G.iter() {
        xx += 1.0;
        ser += g / xx;
    }
    -tmp + (2.5066282746310005 * ser / x).ln()
}

// 正則化不完全ベータ関数 I_x(a,b)
fn betai(a: f64, b: f64, x: f64) -> f64 {
    if x <= 0.0 {
        return 0.0;
    }
    if x >= 1.0 {
        return 1.0;
    }
    let bt = (ln_gamma(a + b) - ln_gamma(a) - ln_gamma(b) + a * x.ln() + b * (1.0 - x).ln()).exp();
    if x < (a + 1.0) / (a + b + 2.0) {
        bt * betacf(a, b, x) / a
    } else {
        1.0 - bt * betacf(b, a, 1.0 - x) / b
    }
}

fn betacf(a: f64, b: f64, x: f64) -> f64 {
    let fpmin = 1e-30;
    let qab = a + b;
    let qap = a + 1.0;
    let qam = a - 1.0;
    let mut c = 1.0;
    let mut d = 1.0 - qab * x / qap;
    if d.abs() < fpmin {
        d = fpmin;
    }
    d = 1.0 / d;
    let mut h = d;
    for m in 1..=200 {
        let m = m as f64;
        let m2 = 2.0 * m;
        let mut aa = m * (b - m) * x / ((qam + m2) * (a + m2));
        d = 1.0 + aa * d;
        if d.abs() < fpmin {
            d = fpmin;
        }
        c = 1.0 + aa / c;
        if c.abs() < fpmin {
            c = fpmin;
        }
        d = 1.0 / d;
        h *= d * c;
        aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
        d = 1.0 + aa * d;
        if d.abs() < fpmin {
            d = fpmin;
        }
        c = 1.0 + aa / c;
        if c.abs() < fpmin {
            c = fpmin;
        }
        d = 1.0 / d;
        let del = d * c;
        h *= del;
        if (del - 1.0).abs() < 3e-7 {
            break;
        }
    }
    h
}

fn welch(input: &TTestInput) -> TTestOutput {
    let (mean_a, var_a) = mean_var(&input.a);
    let (mean_b, var_b) = mean_var(&input.b);
    let na = input.a.len() as f64;
    let nb = input.b.len() as f64;
    let se = (var_a / na + var_b / nb).sqrt();
    let t = if se > 0.0 { (mean_a - mean_b) / se } else { 0.0 };
    let df_num = (var_a / na + var_b / nb).powi(2);
    let df_den = (var_a / na).powi(2) / (na - 1.0).max(1.0) + (var_b / nb).powi(2) / (nb - 1.0).max(1.0);
    let df = if df_den > 0.0 { df_num / df_den } else { 1.0 };
    let p_value = if df > 0.0 && t.is_finite() {
        betai(df / 2.0, 0.5, df / (df + t * t))
    } else {
        f64::NAN
    };
    TTestOutput {
        mean_a,
        mean_b,
        var_a,
        var_b,
        n_a: input.a.len(),
        n_b: input.b.len(),
        t,
        df,
        p_value,
    }
}

// ─── wasm-bindgen エクスポート ─────────────────────────────

#[wasm_bindgen]
pub fn fit_curves(input: &str) -> String {
    let parsed: FitInput = match serde_json::from_str(input) {
        Ok(v) => v,
        Err(e) => return format!("{{\"error\":\"{}\"}}", e),
    };
    serde_json::to_string(&run_fit(&parsed)).unwrap_or_default()
}

#[wasm_bindgen]
pub fn welch_ttest(input: &str) -> String {
    let parsed: TTestInput = match serde_json::from_str(input) {
        Ok(v) => v,
        Err(e) => return format!("{{\"error\":\"{}\"}}", e),
    };
    serde_json::to_string(&welch(&parsed)).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn linear_fit_perfect() {
        let x = vec![1.0, 2.0, 3.0, 4.0];
        let y = vec![2.0, 4.0, 6.0, 8.0];
        let out = run_fit(&FitInput {
            x,
            y,
            models: vec!["linear".into()],
            poly_degree: 2,
            samples: 50,
        });
        assert_eq!(out.results.len(), 1);
        assert!((out.results[0].r2 - 1.0).abs() < 1e-9);
        assert_eq!(out.recommended.as_deref(), Some("linear"));
    }

    #[test]
    fn welch_basic() {
        let a = vec![1.0, 2.0, 3.0, 4.0, 5.0];
        let b = vec![3.0, 4.0, 5.0, 6.0, 7.0];
        let r = welch(&TTestInput { a, b });
        assert!(r.t < 0.0); // mean_a < mean_b
        assert!(r.p_value > 0.0 && r.p_value <= 1.0);
    }
}
