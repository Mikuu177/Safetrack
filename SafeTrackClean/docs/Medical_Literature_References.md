# SafeTrack 医学文献支撑与阈值证明

## 🏥 核心健康阈值的医学依据

### 1. 心率标准 (Heart Rate Thresholds)

#### 基础标准
- **American Heart Association (2023)**: 成人静息心率 60-100 bpm
- **European Society of Cardiology Guidelines**: 运动时最大心率 = 220 - 年龄

#### 年龄相关调整的医学依据
```typescript
// 当前实现的年龄调整
if (age >= 65) {
  heartRateMax = 130;  // 老年人最大心率降低
} else if (age < 25) {
  heartRateMax = 160;  // 年轻人可承受更高心率
}
```

**医学支撑**:
- **Tanaka, H. et al. (2001)** - "Age-predicted maximal heart rate revisited" 
  - 公式: HRmax = 208 - (0.7 × age)
  - 证明了随年龄增长心率上限的生理性下降

- **Nes, B.M. et al. (2013)** - "Age-predicted maximal heart rate in healthy subjects"
  - 发现传统220-age公式低估了年轻人的心率上限
  - 支持年轻人(<25岁)更高心率阈值的设定

### 2. 血压标准 (Blood Pressure Thresholds)

#### 基础标准
- **AHA/ACC 2017 Guidelines**: 
  - 正常: <120/80 mmHg
  - 偏高: 120-129/<80 mmHg  
  - Stage 1高血压: 130-139/80-89 mmHg

#### 当前实现的阈值
```typescript
// SafeTrack默认阈值
systolicMin = 90, systolicMax = 140;
diastolicMin = 60, diastolicMax = 90;
```

**医学支撑需要补充**:
- [ ] **急需添加**: Williams, B. et al. (2018) - "2018 ESC/ESH Guidelines for hypertension"
- [ ] **急需添加**: Whelton, P.K. et al. (2018) - "2017 AHA/ACC guideline for high blood pressure"

### 3. 性别差异调整的医学依据

#### 当前实现
```typescript
if (gender === 'female') {
  heartRateMin = 65;   // 女性心率通常略高
  systolicMax -= 5;    // 女性血压通常略低
}
```

**医学支撑**:
- **Vaidya, A. & Forman, J.P. (2018)** - "Hypertension in women"
  - 证明绝经前女性血压通常低于同龄男性
  - 支持女性血压阈值适当降低的设定

- **Koenig, J. & Thayer, J.F. (2016)** - "Sex differences in healthy human heart rate variability"
  - 女性静息心率平均比男性高5-10 bpm
  - 支持女性心率基线调整

### 4. 疾病状况调整

#### 高血压患者调整
```typescript
if (conditions.includes('hypertension')) {
  if (systolicThreshold) systolicThreshold.maxValue = Math.min(systolicThreshold.maxValue, 130);
  if (diastolicThreshold) diastolicThreshold.maxValue = Math.min(diastolicThreshold.maxValue, 80);
}
```

**医学支撑**:
- **Target BP levels**: AHA推荐高血压患者目标<130/80 mmHg
- **需要添加具体文献引用**

## ⚠️ 需要立即补充的关键文献

### 高优先级 (论文必需)
1. **American Heart Association Scientific Statements**
2. **European Society of Cardiology Guidelines 2020**  
3. **WHO Global Health Observatory Data**
4. **Age-stratified cardiovascular risk assessment studies**

### 中等优先级 (增强可信度)
1. **Mobile health intervention effectiveness studies**
2. **Personalized medicine in cardiovascular care**
3. **Digital health monitoring accuracy research**

## 🎯 文献搜索策略

### 数据库搜索
- **PubMed**: 心血管生理学基础研究
- **Cochrane Library**: 系统综述和meta分析
- **IEEE Xplore**: 移动健康技术研究
- **Google Scholar**: 最新预印本和综合搜索

### 关键词组合
```
("heart rate" OR "blood pressure") AND 
("age" OR "gender" OR "sex differences") AND
("thresholds" OR "normal ranges" OR "reference values") AND
("mobile health" OR "mHealth" OR "digital health")
```

## 📊 当前阈值验证状态

| 健康指标 | 当前阈值 | 医学依据状态 | 需要的文献 |
|---------|---------|-------------|-----------|
| 心率 | 60-150 bpm | ⚠️ 部分支撑 | AHA guidelines |
| 收缩压 | 90-140 mmHg | ❌ 缺乏引用 | 2017 ACC/AHA |
| 舒张压 | 60-90 mmHg | ❌ 缺乏引用 | ESC guidelines |
| 年龄调整 | 65+: 保守 | ✅ 有文献 | Tanaka 2001 |
| 性别调整 | 女性+5心率 | ⚠️ 需补充 | Koenig 2016 |

## 🚨 立即行动项

1. **今日完成**: 搜索并下载5篇核心医学指南
2. **明日完成**: 验证所有数值的医学准确性  
3. **48小时内**: 更新AlertEngine.ts中的注释，添加文献引用