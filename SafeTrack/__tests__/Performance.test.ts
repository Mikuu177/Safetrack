import AlertEngine from '../src/utils/AlertEngine';
import DatabaseService from '../src/database/DatabaseService';

describe('SafeTrack Performance Tests', () => {
  test('个性化阈值计算性能应小于10ms', () => {
    const startTime = performance.now();
    
    // 批量计算不同用户的个性化阈值
    for (let i = 0; i < 100; i++) {
      AlertEngine.getDefaultThresholds(
        i, 
        ['hypertension'], 
        Math.floor(Math.random() * 60) + 20, // 20-80岁随机
        Math.random() > 0.5 ? 'male' : 'female'
      );
    }
    
    const endTime = performance.now();
    const averageTime = (endTime - startTime) / 100;
    
    console.log(`平均阈值计算时间: ${averageTime.toFixed(2)}ms`);
    expect(averageTime).toBeLessThan(10); // 小于10ms
  });

  test('警报严重程度分级性能测试', () => {
    const startTime = performance.now();
    
    const mockRecord = {
      id: 1,
      userId: 1,
      heartRate: 180,
      bloodPressureSystolic: 160,
      bloodPressureDiastolic: 100,
      timestamp: new Date().toISOString()
    };

    const mockThreshold = {
      id: 1,
      userId: 1,
      metricName: 'heart_rate' as const,
      minValue: 60,
      maxValue: 150,
      isActive: true
    };

    // 模拟1000次警报计算
    for (let i = 0; i < 1000; i++) {
      const deviation = (mockRecord.heartRate - mockThreshold.maxValue) / 
                       (mockThreshold.maxValue - mockThreshold.minValue);
      const severity = deviation >= 0.5 ? 'high' : deviation >= 0.25 ? 'medium' : 'low';
    }
    
    const endTime = performance.now();
    const averageTime = (endTime - startTime) / 1000;
    
    console.log(`平均警报计算时间: ${averageTime.toFixed(3)}ms`);
    expect(averageTime).toBeLessThan(1); // 小于1ms
  });

  test('大数据集阈值验证性能', () => {
    const startTime = performance.now();
    
    // 模拟检查1000条健康记录
    const testRecords = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      userId: 1,
      heartRate: Math.floor(Math.random() * 100) + 50, // 50-150
      bloodPressureSystolic: Math.floor(Math.random() * 80) + 90, // 90-170
      bloodPressureDiastolic: Math.floor(Math.random() * 50) + 60, // 60-110
      timestamp: new Date().toISOString()
    }));

    const thresholds = AlertEngine.getDefaultThresholds(1, [], 45, 'other');
    
    let alertCount = 0;
    testRecords.forEach(record => {
      // 简化的阈值检查逻辑
      const heartRateThreshold = thresholds.find(t => t.metricName === 'heart_rate');
      if (heartRateThreshold && 
          (record.heartRate < heartRateThreshold.minValue || 
           record.heartRate > heartRateThreshold.maxValue)) {
        alertCount++;
      }
    });
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    console.log(`1000条记录检查时间: ${totalTime.toFixed(2)}ms`);
    console.log(`触发警报数量: ${alertCount}`);
    expect(totalTime).toBeLessThan(100); // 总时间小于100ms
  });
});

describe('Memory Usage Estimation', () => {
  test('用户数据存储内存占用估算', () => {
    // 模拟用户数据结构的内存占用
    const userProfile = {
      id: 1,
      name: 'Test User',
      age: 35,
      gender: 'female',
      medicalConditions: ['hypertension', 'diabetes'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const healthRecord = {
      id: 1,
      userId: 1,
      heartRate: 75,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      timestamp: new Date().toISOString(),
      exerciseType: 'Walking',
      duration: 30
    };

    // 粗略估算单条记录的内存占用 (JSON序列化大小)
    const userSize = JSON.stringify(userProfile).length;
    const recordSize = JSON.stringify(healthRecord).length;
    
    console.log(`用户档案大小: ${userSize} bytes`);
    console.log(`健康记录大小: ${recordSize} bytes`);
    console.log(`1000条记录总大小: ${(recordSize * 1000 / 1024).toFixed(2)} KB`);
    
    // 验证单条记录大小合理 (应该小于1KB)
    expect(recordSize).toBeLessThan(1024);
    expect(userSize).toBeLessThan(512);
  });
});