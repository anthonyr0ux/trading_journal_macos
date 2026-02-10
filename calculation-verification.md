# Calculator Verification Report

## Summary
✅ **All calculations are mathematically correct**

## Formulas Verified

### 1. **1R Calculation** ✅
```
1R = Portfolio × R%
```
**Example:** $10,000 × 2% = $200

### 2. **Weighted Entry Price** ✅
```
Weighted PE = Σ(Entry Price × Allocation%) / Total Allocation%
```
**Example:**
- Entry 1: $200 at 60% → $120
- Entry 2: $210 at 40% → $84
- Weighted PE = $204

### 3. **Distance Calculations** ✅
```
For LONG:
  distanceSL_USD = PE - SL
  distanceTP_USD = TP - PE

For SHORT:
  distanceSL_USD = SL - PE
  distanceTP_USD = PE - TP

distanceSL_PCT = |distanceSL_USD| / PE
distanceTP_PCT = |distanceTP_USD| / PE
```
**Example (LONG):**
- PE: $200, SL: $185
- distanceSL_USD = $15
- distanceSL_PCT = 7.5%

### 4. **Max Leverage** ✅
```
Max Leverage = floor(1 / distanceSL_PCT)
```
**Example:** floor(1 / 0.075) = 13x

### 5. **Position Sizing** ✅
```
Loss% at SL = distanceSL_PCT × Leverage
Margin = 1R / Loss% at SL
Position Size = Margin × Leverage
```
**Example:**
- Loss% at SL = 7.5% × 10x = 75%
- Margin = $200 / 0.75 = $266.67
- Position Size = $266.67 × 10 = $2,666.67

**Verification:**
- If price drops 7.5% with 10x leverage = 75% loss on margin
- Loss = $266.67 × 0.75 = $200 = 1R ✅

### 6. **Quantity** ✅
```
Quantity = Position Size / Entry Price
```
**Example:** $2,666.67 / $200 = 13.33 units

### 7. **Risk:Reward Ratio** ✅
```
RR = |distanceTP_USD| / |distanceSL_USD|

For LONG:  RR = (TP - PE) / (PE - SL)
For SHORT: RR = (PE - TP) / (SL - PE)
```
**Example:** ($230 - $200) / ($200 - $185) = $30 / $15 = 2.0

### 8. **Weighted RR (Multiple TPs)** ✅
```
Weighted RR = Σ(TP Allocation% × TP RR) / Total Allocation%
```
**Example:**
- TP1: $230 at 50%, RR = 2.0
- TP2: $245 at 50%, RR = 3.0
- Weighted RR = (2.0 × 0.5 + 3.0 × 0.5) = 2.5

### 9. **Potential Profit** ✅
```
For Single TP:
  Potential Profit = Position Size × distanceTP_PCT

For Multiple TPs:
  TP Profit = Position Size × distanceTP_PCT × TP Allocation%
  Total Potential Profit = Σ(TP Profit)
```
**Example:**
- Position Size: $2,666.67
- TP Distance: 15%
- Potential Profit = $2,666.67 × 0.15 = $400

**Verification:**
- 15% gain with 10x leverage = 150% gain on margin
- Profit = $266.67 × 1.5 = $400 = 2R ✅

### 10. **Execution Metrics (Realized P&L)** ✅
```
For each exit:
  R-Multiple = Exit Distance / SL Distance
  Exit P&L = 1R × R-Multiple × Exit Allocation%

Realized P&L = Σ(Exit P&L)
```
**Example:**
- Exit at TP ($230): R-Multiple = 2.0
- 50% position closed: P&L = $200 × 2.0 × 0.5 = $200

## Test Case: Complete Example

**Input:**
- Portfolio: $10,000
- R%: 2%
- Entry: $200
- Stop Loss: $185
- Take Profit: $230
- Leverage: 10x

**Calculated Output:**
1. 1R = $200
2. SL Distance = $15 (7.5%)
3. Max Leverage = 13x
4. Margin = $266.67
5. Position Size = $2,666.67
6. Quantity = 13.33
7. RR = 2.0
8. Potential Profit = $400 (2R)

**Manual Verification:**
- ✅ SL hit: 7.5% × 10x = 75% loss → $200 loss = 1R
- ✅ TP hit: 15% × 10x = 150% gain → $400 gain = 2R
- ✅ Math checks out perfectly

## Edge Cases Handled

1. **Zero division protection**: Max leverage returns null if distanceSL_PCT = 0
2. **Invalid entries**: Throws error if no valid entries provided
3. **Allocation normalization**: Entries/TPs are normalized to sum to 100%
4. **Position type detection**: Automatically detects LONG/SHORT based on PE vs TP

## Conclusion

The Calculator implementation is **mathematically accurate and sound**. All formulas correctly implement position sizing based on:
- Fixed risk per trade (1R concept)
- Isolated margin leverage mechanics
- Proper handling of multiple entries and take profits
- Weighted averages for entries, exits, and R-multiples

No calculation errors found. ✅
