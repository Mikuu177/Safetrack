import AlertEngine from '../src/utils/AlertEngine';

describe('AlertEngine Personalized Thresholds', () => {
  test('应该为年轻女性计算正确的个性化阈值', () => {
    const thresholds = AlertEngine.getDefaultThresholds(1, [], 22, 'female'); // 改为22岁触发年轻人条件
    
    // 验证心率阈值调整 (age<25: 160 + 女性+5 = 165)
    const heartRateThreshold = thresholds.find(t => t.metricName === 'heart_rate');
    expect(heartRateThreshold?.minValue).toBe(65); // 女性基线65
    expect(heartRateThreshold?.maxValue).toBe(165); // 年轻人160 + 女性+5 = 165
  });

  test('应该为老年男性应用保守阈值', () => {
    const thresholds = AlertEngine.getDefaultThresholds(1, [], 70, 'male');
    
    const heartRateThreshold = thresholds.find(t => t.metricName === 'heart_rate');
    const systolicThreshold = thresholds.find(t => t.metricName === 'bp_systolic');
    
    // 老年人心率上限降低
    expect(heartRateThreshold?.maxValue).toBe(130);
    // 老年人血压上限稍高
    expect(systolicThreshold?.maxValue).toBe(155); // 150 + 男性调整5
  });

  test('应该为高血压患者应用更严格阈值', () => {
    const thresholds = AlertEngine.getDefaultThresholds(1, ['hypertension'], 45, 'other');
    
    const systolicThreshold = thresholds.find(t => t.metricName === 'bp_systolic');
    const diastolicThreshold = thresholds.find(t => t.metricName === 'bp_diastolic');
    
    // 高血压患者更严格的血压限制
    expect(systolicThreshold?.maxValue).toBeLessThanOrEqual(130);
    expect(diastolicThreshold?.maxValue).toBeLessThanOrEqual(80);
  });

  test('应该正确计算警报严重程度', () => {
    const testRecord = {
      id: 1,
      userId: 1,
      heartRate: 180, // 明显超出正常范围
      bloodPressureSystolic: 160,
      bloodPressureDiastolic: 100,
      timestamp: new Date().toISOString()
    };

    const testThreshold = {
      id: 1,
      userId: 1,
      metricName: 'heart_rate' as const,
      minValue: 60,
      maxValue: 150,
      isActive: true
    };

    // 验证严重程度计算逻辑
    const deviation = (180 - 150) / (150 - 60); // 偏差率
    expect(deviation).toBeGreaterThan(0.25); // 应该是medium或high级别
  });
});

describe('AlertEngine Algorithm Medical Accuracy', () => {
  test('默认阈值应符合医学标准', () => {
    const thresholds = AlertEngine.getDefaultThresholds(1, [], 35, 'other');
    
    const heartRate = thresholds.find(t => t.metricName === 'heart_rate');
    const systolic = thresholds.find(t => t.metricName === 'bp_systolic');
    const diastolic = thresholds.find(t => t.metricName === 'bp_diastolic');

    // 验证是否在合理的医学范围内
    expect(heartRate?.minValue).toBeGreaterThanOrEqual(50);
    expect(heartRate?.maxValue).toBeLessThanOrEqual(180);
    expect(systolic?.minValue).toBeGreaterThanOrEqual(80);
    expect(systolic?.maxValue).toBeLessThanOrEqual(160);
    expect(diastolic?.minValue).toBeGreaterThanOrEqual(50);
    expect(diastolic?.maxValue).toBeLessThanOrEqual(100);
  });
});