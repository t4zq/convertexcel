//! 信号処理: スムージング(移動平均/メジアン/IIR低域/FFT低域) と LTTB 間引き。
//! 旧 stats.js / script.js のノイズ除去・表示間引きに対応。

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

#[derive(Deserialize)]
struct SmoothInput {
    y: Vec<f64>,
    mode: String,
    #[serde(default = "default_window")]
    window: usize,
    /// FFT/IIR 低域のカットオフ (0-100 %)
    #[serde(default = "default_cutoff")]
    cutoff: f64,
}

fn default_window() -> usize {
    5
}
fn default_cutoff() -> f64 {
    30.0
}

/// 中央寄せ移動平均 (window は奇数)。端は利用可能な範囲で平均。
pub fn moving_average(y: &[f64], window: usize) -> Vec<f64> {
    let w = window.max(1);
    let half = w / 2;
    let n = y.len();
    let mut out = vec![0.0; n];
    for i in 0..n {
        let lo = i.saturating_sub(half);
        let hi = (i + half + 1).min(n);
        let slice = &y[lo..hi];
        out[i] = slice.iter().sum::<f64>() / slice.len() as f64;
    }
    out
}

/// 中央寄せメジアンフィルタ。
pub fn median_filter(y: &[f64], window: usize) -> Vec<f64> {
    let w = window.max(1);
    let half = w / 2;
    let n = y.len();
    let mut out = vec![0.0; n];
    for i in 0..n {
        let lo = i.saturating_sub(half);
        let hi = (i + half + 1).min(n);
        let mut slice: Vec<f64> = y[lo..hi].to_vec();
        slice.sort_by(|a, b| a.partial_cmp(b).unwrap());
        let m = slice.len();
        out[i] = if m % 2 == 1 {
            slice[m / 2]
        } else {
            (slice[m / 2 - 1] + slice[m / 2]) / 2.0
        };
    }
    out
}

/// 一極 IIR 低域 (前後双方向で位相ずれを打ち消す)。cutoff(%)→平滑係数。
pub fn iir_low_pass(y: &[f64], cutoff_percent: f64) -> Vec<f64> {
    let n = y.len();
    if n == 0 {
        return Vec::new();
    }
    // cutoff 大 = よりカット = より平滑。alpha は 0(強平滑)〜1(素通し)。
    let c = (cutoff_percent.clamp(1.0, 99.0)) / 100.0;
    let alpha = c; // 高cutoff=高alpha=高域も通す
    let mut fwd = vec![0.0; n];
    fwd[0] = y[0];
    for i in 1..n {
        fwd[i] = fwd[i - 1] + alpha * (y[i] - fwd[i - 1]);
    }
    let mut out = vec![0.0; n];
    out[n - 1] = fwd[n - 1];
    for i in (0..n - 1).rev() {
        out[i] = out[i + 1] + alpha * (fwd[i] - out[i + 1]);
    }
    out
}

// ─── FFT (Cooley-Tukey radix-2) ────────────────────────────

fn fft(re: &mut [f64], im: &mut [f64], inverse: bool) {
    let n = re.len();
    if n <= 1 {
        return;
    }
    // bit reversal
    let mut j = 0usize;
    for i in 1..n {
        let mut bit = n >> 1;
        while j & bit != 0 {
            j ^= bit;
            bit >>= 1;
        }
        j ^= bit;
        if i < j {
            re.swap(i, j);
            im.swap(i, j);
        }
    }
    let mut len = 2;
    while len <= n {
        let ang = if inverse { 2.0 } else { -2.0 } * std::f64::consts::PI / len as f64;
        let (wlen_re, wlen_im) = (ang.cos(), ang.sin());
        let mut i = 0;
        while i < n {
            let (mut wr, mut wi) = (1.0_f64, 0.0_f64);
            for k in 0..len / 2 {
                let u_re = re[i + k];
                let u_im = im[i + k];
                let v_re = re[i + k + len / 2] * wr - im[i + k + len / 2] * wi;
                let v_im = re[i + k + len / 2] * wi + im[i + k + len / 2] * wr;
                re[i + k] = u_re + v_re;
                im[i + k] = u_im + v_im;
                re[i + k + len / 2] = u_re - v_re;
                im[i + k + len / 2] = u_im - v_im;
                let nwr = wr * wlen_re - wi * wlen_im;
                wi = wr * wlen_im + wi * wlen_re;
                wr = nwr;
            }
            i += len;
        }
        len <<= 1;
    }
    if inverse {
        for x in re.iter_mut() {
            *x /= n as f64;
        }
        for x in im.iter_mut() {
            *x /= n as f64;
        }
    }
}

/// FFT 低域通過: 高周波成分(上位 (1-cutoff)) を 0 にして逆変換。
pub fn fft_low_pass(y: &[f64], cutoff_percent: f64) -> Vec<f64> {
    let n = y.len();
    if n < 2 {
        return y.to_vec();
    }
    let mut size = 1;
    while size < n {
        size <<= 1;
    }
    let mut re = vec![0.0; size];
    let mut im = vec![0.0; size];
    re[..n].copy_from_slice(y);
    fft(&mut re, &mut im, false);

    let keep = ((cutoff_percent.clamp(1.0, 99.0) / 100.0) * (size as f64 / 2.0)).round() as usize;
    for k in 0..size {
        // 正・負両側の高周波を落とす
        let freq_index = k.min(size - k);
        if freq_index > keep {
            re[k] = 0.0;
            im[k] = 0.0;
        }
    }
    fft(&mut re, &mut im, true);
    re[..n].to_vec()
}

fn smooth(input: &SmoothInput) -> Vec<f64> {
    match input.mode.as_str() {
        "moving-avg" => moving_average(&input.y, input.window),
        "median" => median_filter(&input.y, input.window),
        "low-pass" => iir_low_pass(&input.y, input.cutoff),
        "fft-low-pass" => fft_low_pass(&input.y, input.cutoff),
        _ => input.y.clone(),
    }
}

// ─── LTTB (Largest-Triangle-Three-Buckets) 間引き ───────────

#[derive(Serialize)]
struct Downsampled {
    x: Vec<f64>,
    y: Vec<f64>,
}

pub fn lttb(x: &[f64], y: &[f64], threshold: usize) -> (Vec<f64>, Vec<f64>) {
    let n = x.len();
    if threshold >= n || threshold < 3 {
        return (x.to_vec(), y.to_vec());
    }
    let mut out_x = Vec::with_capacity(threshold);
    let mut out_y = Vec::with_capacity(threshold);
    out_x.push(x[0]);
    out_y.push(y[0]);

    let every = (n - 2) as f64 / (threshold - 2) as f64;
    let mut a = 0usize;
    for i in 0..(threshold - 2) {
        let avg_start = ((i + 1) as f64 * every) as usize + 1;
        let avg_end = (((i + 2) as f64 * every) as usize + 1).min(n);
        let avg_len = (avg_end - avg_start).max(1) as f64;
        let mut avg_x = 0.0;
        let mut avg_y = 0.0;
        for j in avg_start..avg_end {
            avg_x += x[j];
            avg_y += y[j];
        }
        avg_x /= avg_len;
        avg_y /= avg_len;

        let range_start = (i as f64 * every) as usize + 1;
        let range_end = (((i + 1) as f64 * every) as usize + 1).min(n);
        let (ax, ay) = (x[a], y[a]);
        let mut max_area = -1.0;
        let mut next_a = range_start;
        for j in range_start..range_end {
            let area = ((ax - avg_x) * (y[j] - ay) - (ax - x[j]) * (avg_y - ay)).abs() * 0.5;
            if area > max_area {
                max_area = area;
                next_a = j;
            }
        }
        out_x.push(x[next_a]);
        out_y.push(y[next_a]);
        a = next_a;
    }
    out_x.push(x[n - 1]);
    out_y.push(y[n - 1]);
    (out_x, out_y)
}

// ─── wasm-bindgen エクスポート ─────────────────────────────

#[wasm_bindgen]
pub fn smooth_series(input: &str) -> String {
    let parsed: SmoothInput = match serde_json::from_str(input) {
        Ok(v) => v,
        Err(e) => return format!("{{\"error\":\"{}\"}}", e),
    };
    serde_json::to_string(&smooth(&parsed)).unwrap_or_default()
}

#[derive(Deserialize)]
struct LttbInput {
    x: Vec<f64>,
    y: Vec<f64>,
    threshold: usize,
}

#[wasm_bindgen]
pub fn lttb_downsample(input: &str) -> String {
    let parsed: LttbInput = match serde_json::from_str(input) {
        Ok(v) => v,
        Err(e) => return format!("{{\"error\":\"{}\"}}", e),
    };
    let (x, y) = lttb(&parsed.x, &parsed.y, parsed.threshold);
    serde_json::to_string(&Downsampled { x, y }).unwrap_or_default()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn moving_average_smooths() {
        let y = vec![1.0, 5.0, 1.0, 5.0, 1.0];
        let s = moving_average(&y, 3);
        assert_eq!(s.len(), 5);
        // 中央は (5+1+5)/3 付近で元より平滑
        assert!(s[2] < 5.0 && s[2] > 1.0);
    }

    #[test]
    fn fft_low_pass_preserves_dc() {
        let y = vec![2.0; 16];
        let s = fft_low_pass(&y, 50.0);
        for v in s {
            assert!((v - 2.0).abs() < 1e-6);
        }
    }

    #[test]
    fn lttb_reduces() {
        let x: Vec<f64> = (0..100).map(|i| i as f64).collect();
        let y: Vec<f64> = x.iter().map(|v| v.sin()).collect();
        let (dx, _dy) = lttb(&x, &y, 10);
        assert_eq!(dx.len(), 10);
    }
}
