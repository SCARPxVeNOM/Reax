/**
 * Technical Indicator Functions for PineScript
 */

export class TechnicalIndicators {
  // Simple Moving Average
  static sma(data: number[], period: number): number[] {
    const result: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
        continue;
      }
      
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j];
      }
      result.push(sum / period);
    }
    
    return result;
  }

  // Exponential Moving Average
  static ema(data: number[], period: number): number[] {
    const result: number[] = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for first value
    let ema = 0;
    for (let i = 0; i < period; i++) {
      ema += data[i];
    }
    ema /= period;
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        result.push(NaN);
      } else if (i === period - 1) {
        result.push(ema);
      } else {
        ema = (data[i] - ema) * multiplier + ema;
        result.push(ema);
      }
    }
    
    return result;
  }

  // Relative Strength Index
  static rsi(data: number[], period: number = 14): number[] {
    const result: number[] = [];
    const gains: number[] = [];
    const losses: number[] = [];
    
    for (let i = 1; i < data.length; i++) {
      const change = data[i] - data[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? -change : 0);
    }
    
    const avgGains = this.sma(gains, period);
    const avgLosses = this.sma(losses, period);
    
    result.push(NaN); // First value is NaN
    
    for (let i = 0; i < avgGains.length; i++) {
      if (isNaN(avgGains[i]) || avgLosses[i] === 0) {
        result.push(NaN);
      } else {
        const rs = avgGains[i] / avgLosses[i];
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
    
    return result;
  }

  // Moving Average Convergence Divergence
  static macd(data: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number[];
    signal: number[];
    histogram: number[];
  } {
    const fastEMA = this.ema(data, fastPeriod);
    const slowEMA = this.ema(data, slowPeriod);
    
    const macdLine: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (isNaN(fastEMA[i]) || isNaN(slowEMA[i])) {
        macdLine.push(NaN);
      } else {
        macdLine.push(fastEMA[i] - slowEMA[i]);
      }
    }
    
    const signalLine = this.ema(macdLine.filter(v => !isNaN(v)), signalPeriod);
    
    // Pad signal line with NaN to match length
    const paddedSignal: number[] = new Array(data.length - signalLine.length).fill(NaN).concat(signalLine);
    
    const histogram: number[] = [];
    for (let i = 0; i < data.length; i++) {
      if (isNaN(macdLine[i]) || isNaN(paddedSignal[i])) {
        histogram.push(NaN);
      } else {
        histogram.push(macdLine[i] - paddedSignal[i]);
      }
    }
    
    return {
      macd: macdLine,
      signal: paddedSignal,
      histogram,
    };
  }

  // Bollinger Bands
  static bollingerBands(data: number[], period: number = 20, stdDev: number = 2): {
    upper: number[];
    middle: number[];
    lower: number[];
  } {
    const middle = this.sma(data, period);
    const upper: number[] = [];
    const lower: number[] = [];
    
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        upper.push(NaN);
        lower.push(NaN);
        continue;
      }
      
      let sumSquares = 0;
      for (let j = 0; j < period; j++) {
        sumSquares += Math.pow(data[i - j] - middle[i], 2);
      }
      const std = Math.sqrt(sumSquares / period);
      
      upper.push(middle[i] + stdDev * std);
      lower.push(middle[i] - stdDev * std);
    }
    
    return { upper, middle, lower };
  }

  // Crossover detection
  static crossover(series1: number[], series2: number[]): boolean[] {
    const result: boolean[] = [];
    
    for (let i = 0; i < series1.length; i++) {
      if (i === 0) {
        result.push(false);
      } else {
        const crossed = series1[i] > series2[i] && series1[i - 1] <= series2[i - 1];
        result.push(crossed);
      }
    }
    
    return result;
  }

  // Crossunder detection
  static crossunder(series1: number[], series2: number[]): boolean[] {
    const result: boolean[] = [];
    
    for (let i = 0; i < series1.length; i++) {
      if (i === 0) {
        result.push(false);
      } else {
        const crossed = series1[i] < series2[i] && series1[i - 1] >= series2[i - 1];
        result.push(crossed);
      }
    }
    
    return result;
  }
}

// Math utility functions
export class MathFunctions {
  static max(...values: number[]): number {
    return Math.max(...values);
  }

  static min(...values: number[]): number {
    return Math.min(...values);
  }

  static abs(value: number): number {
    return Math.abs(value);
  }

  static avg(...values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  static sum(...values: number[]): number {
    return values.reduce((a, b) => a + b, 0);
  }

  static round(value: number, decimals: number = 0): number {
    const multiplier = Math.pow(10, decimals);
    return Math.round(value * multiplier) / multiplier;
  }

  static floor(value: number): number {
    return Math.floor(value);
  }

  static ceil(value: number): number {
    return Math.ceil(value);
  }

  static pow(base: number, exponent: number): number {
    return Math.pow(base, exponent);
  }

  static sqrt(value: number): number {
    return Math.sqrt(value);
  }

  static log(value: number): number {
    return Math.log(value);
  }

  static log10(value: number): number {
    return Math.log10(value);
  }

  static exp(value: number): number {
    return Math.exp(value);
  }
}
