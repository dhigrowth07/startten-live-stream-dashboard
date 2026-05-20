import React from 'react';
import { Card, Row, Col } from 'antd';
import { Column, Line, Pie, Area } from '@ant-design/plots';

const AnalyticsCharts = ({ data }) => {
  // Chart configurations
  const poolGrowthConfig = {
    data: data.poolGrowth,
    xField: 'time',
    yField: 'value',
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
    color: '#1890ff',
    point: {
      size: 4,
      shape: 'circle',
    },
    theme: 'dark',
  };

  const entryRateConfig = {
    data: data.entryRate,
    xField: 'minute',
    yField: 'entries',
    color: '#52c41a',
    columnStyle: {
      fill: '#52c41a',
    },
    theme: 'dark',
  };

  const predictionDistConfig = {
    data: data.predictionDistribution,
    angleField: 'value',
    colorField: 'range',
    radius: 0.8,
    label: {
      type: 'outer',
      content: '{name}: {percentage}',
    },
    theme: 'dark',
  };

  const winningHistoryConfig = {
    data: data.winningHistory,
    xField: 'contest',
    yField: 'number',
    seriesField: 'type',
    smooth: true,
    color: ['#1890ff', '#52c41a'],
    point: {
      size: 3,
    },
    theme: 'dark',
  };

  const schedulerHealthConfig = {
    data: data.schedulerHealth,
    xField: 'time',
    yField: 'status',
    point: {
      size: 5,
      shape: 'circle',
    },
    color: (d) => {
      if (d.status === 'missed') return '#ff4d4f';
      if (d.status === 'degraded') return '#faad14';
      return '#52c41a';
    },
    theme: 'dark',
  };

  const redisLatencyConfig = {
    data: data.redisLatency,
    xField: 'time',
    yField: 'latency',
    smooth: true,
    color: '#722ed1',
    point: {
      size: 3,
    },
    theme: 'dark',
  };

  return (
    <div className="p-4 bg-gray-900">
      <h2 className="text-white text-2xl font-bold mb-4">Analytics & Charts</h2>
      <Row gutter={[16, 16]}>
        {/* 1. Total Pool Growth Chart */}
        <Col xs={24} lg={12}>
          <Card className="bg-gray-800 border-gray-700" title={<span className="text-white">Total Pool Growth (V4+V5)</span>}>
            <Area {...poolGrowthConfig} height={250} />
          </Card>
        </Col>

        {/* 2. Entry Rate Chart */}
        <Col xs={24} lg={12}>
          <Card className="bg-gray-800 border-gray-700" title={<span className="text-white">Entry Rate (per minute)</span>}>
            <Column {...entryRateConfig} height={250} />
          </Card>
        </Col>

        {/* 3. V4 Prediction Distribution */}
        <Col xs={24} lg={12}>
          <Card className="bg-gray-800 border-gray-700" title={<span className="text-white">V4 Prediction Distribution</span>}>
            <Pie {...predictionDistConfig} height={250} />
          </Card>
        </Col>

        {/* 4. Winning Number History */}
        <Col xs={24} lg={12}>
          <Card className="bg-gray-800 border-gray-700" title={<span className="text-white">Winning Number History (Last 50)</span>}>
            <Line {...winningHistoryConfig} height={250} />
          </Card>
        </Col>

        {/* 5. Scheduler Health Graph */}
        <Col xs={24} lg={12}>
          <Card className="bg-gray-800 border-gray-700" title={<span className="text-white">Scheduler Health</span>}>
            <Line {...schedulerHealthConfig} height={250} />
          </Card>
        </Col>

        {/* 6. Redis Latency Graph */}
        <Col xs={24} lg={12}>
          <Card className="bg-gray-800 border-gray-700" title={<span className="text-white">Redis Latency / Response Time</span>}>
            <Line {...redisLatencyConfig} height={250} />
          </Card>
        </Col>
      </Row>

      {/* V5 Heatmap (Full Width) */}
      <Card className="bg-gray-800 border-gray-700 mt-4" title={<span className="text-white">V5 Heatmap (000-999) - Purchase Intensity</span>}>
        <div className="grid gap-1 max-h-96 overflow-auto" style={{ gridTemplateColumns: 'repeat(50, minmax(0, 1fr))' }}>
          {Array.from({ length: 1000 }, (_, i) => {
            const number = String(i).padStart(3, '0');
            const count = data.v5Heatmap[number] || 0;
            const intensity = Math.min(count / 5, 1); // Normalize to 0-1
            const opacity = 0.3 + intensity * 0.7;
            const bgColor = count > 0 ? `rgba(255, 0, 0, ${opacity})` : 'rgba(128, 128, 128, 0.2)';
            return (
              <div
                key={i}
                className="text-[8px] flex items-center justify-center border border-gray-700"
                style={{ aspectRatio: '1', backgroundColor: bgColor, minHeight: '16px' }}
                title={`${number}: ${count} purchase(s)`}
              >
                {count > 0 && (
                  <span className="text-white font-bold">{count > 9 ? '9+' : count}</span>
                )}
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;

