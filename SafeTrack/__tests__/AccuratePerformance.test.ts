/**
 * 更精确的性能测试 - 解决0ms测量问题
 */

import AlertEngine from '../src/utils/AlertEngine';
import { HealthRecord, Threshold } from '../src/types';

describe('Accurate Performance Testing', () => {
  test('精确的1000条记录处理时间测量', () => {
    // 创建1000条不同的健康记录
    const records: HealthRecord[] = [];
    for (let i = 0; i < 1000; i++) {
      records.push({
        id: i,
        userId: 1,
        heartRate: 60 + Math.random() * 100, // 60-160之间的随机值
        bloodPressureSystolic: 90 + Math.random() * 60, // 90-150之间
        bloodPressureDiastolic: 60 + Math.random() * 30, // 60-90之间
        timestamp: new Date(Date.now() + i * 1000).toISOString() // 不同的时间戳
      });
    }

    const threshold: Threshold = {
      id: 1,
      userId: 1,
      metricName: 'heart_rate',
      minValue: 60,
      maxValue: 150,
      isActive: true
    };

    const alertEngine = AlertEngine.getInstance();
    const checkSingleThreshold = (alertEngine as any).checkSingleThreshold.bind(alertEngine);
    
    // 预热运行 - 避免JIT编译影响
    for (let i = 0; i < 100; i++) {
      checkSingleThreshold(records[0], threshold);
    }

    // 多次测量取平均值
    const measurements: number[] = [];
    const measurementRounds = 10;
    
    for (let round = 0; round < measurementRounds; round++) {
      const startTime = performance.now();
      let alertCount = 0;
      
      for (const record of records) {
        const alert = checkSingleThreshold(record, threshold);
        if (alert) alertCount++;
      }
      
      const endTime = performance.now();
      const roundTime = endTime - startTime;
      measurements.push(roundTime);
      
      console.log(`Round ${round + 1}: ${roundTime.toFixed(3)}ms, alerts: ${alertCount}`);
    }
    
    // 计算统计数据
    const totalTime = measurements.reduce((sum, time) => sum + time, 0);
    const avgTime = totalTime / measurementRounds;
    const minTime = Math.min(...measurements);
    const maxTime = Math.max(...measurements);
    
    console.log(`\n精确性能测量结果:`);
    console.log(`- 平均处理时间: ${avgTime.toFixed(3)}ms`);
    console.log(`- 最小处理时间: ${minTime.toFixed(3)}ms`);
    console.log(`- 最大处理时间: ${maxTime.toFixed(3)}ms`);
    console.log(`- 测量轮次: ${measurementRounds}`);
    console.log(`- 每条记录平均时间: ${(avgTime / 1000).toFixed(6)}ms`);
    
    // 验证合理性
    expect(avgTime).toBeGreaterThan(0); // 应该大于0
    expect(avgTime).toBeLessThan(50);   // 应该小于50ms
    
    // 更新论文声明验证
    if (avgTime <= 4) {
      console.log(`✅ 符合论文声明: ≤4ms`);
    } else {
      console.log(`⚠️ 超出论文声明: ${avgTime.toFixed(3)}ms > 4ms`);
      console.log(`建议更新论文声明为: ≤${Math.ceil(avgTime)}ms`);
    }
  });

  test('单次阈值计算的微秒级测量', () => {
    const iterations = 10000; // 增加到10000次以获得可测量的时间
    
    // 预热
    for (let i = 0; i < 1000; i++) {
      AlertEngine.getDefaultThresholds(1, ['hypertension'], 45, 'female');
    }
    
    const startTime = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      AlertEngine.getDefaultThresholds(1, ['hypertension'], 45, 'female');
    }
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    console.log(`\n单次阈值计算性能 (${iterations}次测量):`);
    console.log(`- 总时间: ${totalTime.toFixed(3)}ms`);
    console.log(`- 平均单次时间: ${avgTime.toFixed(6)}ms`);
    console.log(`- 平均单次时间(微秒): ${(avgTime * 1000).toFixed(3)}μs`);
    
    // 验证论文声明 (0.01ms = 10微秒)
    const targetTimeMs = 0.01;
    if (avgTime <= targetTimeMs) {
      console.log(`✅ 符合论文声明: ${avgTime.toFixed(6)}ms ≤ ${targetTimeMs}ms`);
    } else {
      console.log(`⚠️ 超出论文声明: ${avgTime.toFixed(6)}ms > ${targetTimeMs}ms`);
      console.log(`建议更新论文声明为: ≤${(avgTime * 1.2).toFixed(6)}ms`);
    }
    
    expect(avgTime).toBeGreaterThan(0);
    expect(avgTime).toBeLessThan(1); // 应该小于1ms
  });

  test('内存使用的精确测量', () => {
    const sampleRecord: HealthRecord = {
      id: 1,
      userId: 1,
      heartRate: 75,
      bloodPressureSystolic: 120,
      bloodPressureDiastolic: 80,
      timestamp: '2025-08-05T01:30:00.000Z'
    };

    // 测量JSON序列化大小
    const jsonString = JSON.stringify(sampleRecord);
    const jsonSize = new Blob([jsonString]).size;
    
    // 测量UTF-8编码大小
    const utf8Size = new TextEncoder().encode(jsonString).length;
    
    // 估算对象在内存中的大小 (包括属性名和值)
    const estimatedObjectSize = (
      4 + // id (number)
      4 + // userId (number)  
      4 + // heartRate (number)
      4 + // bloodPressureSystolic (number)
      4 + // bloodPressureDiastolic (number)
      sampleRecord.timestamp.length * 2 + // timestamp string (UTF-16)
      50 // 属性名和对象开销估算
    );
    
    console.log(`\n内存使用精确测量:`);
    console.log(`- JSON序列化大小: ${jsonSize} bytes`);
    console.log(`- UTF-8编码大小: ${utf8Size} bytes`);
    console.log(`- 估算对象内存大小: ${estimatedObjectSize} bytes`);
    console.log(`- 论文声明: 168 bytes`);
    
    // 1000条记录的总大小
    const total1000Json = jsonSize * 1000;
    const total1000Object = estimatedObjectSize * 1000;
    
    console.log(`\n1000条记录总大小:`);
    console.log(`- JSON序列化: ${(total1000Json / 1024).toFixed(2)} KB`);
    console.log(`- 估算内存: ${(total1000Object / 1024).toFixed(2)} KB`);
    console.log(`- 论文声明: 164 KB`);
    
    // 验证合理性
    expect(jsonSize).toBeGreaterThan(100);
    expect(jsonSize).toBeLessThan(200);
    expect(total1000Json / 1024).toBeLessThan(200); // 应该小于200KB
  });
});