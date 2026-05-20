import React from "react";
import { Card, Badge, Tag } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

const SystemHealthBox = ({ health }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
      case "ready":
      case "healthy":
        return <CheckCircleOutlined className="text-green-500" />;
      case "degraded":
        return <ExclamationCircleOutlined className="text-yellow-500" />;
      case "disconnected":
      case "failing":
      case "unhealthy":
        return <CloseCircleOutlined className="text-red-500" />;
      default:
        return <ExclamationCircleOutlined className="text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "connected":
      case "ready":
      case "healthy":
        return "success";
      case "degraded":
        return "warning";
      case "disconnected":
      case "failing":
      case "unhealthy":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <div className="fixed bottom-2 right-2 z-50 w-64">
      <Card className="bg-gray-800 border-2 border-gray-600" styles={{ body: { padding: "8px" } }} title={<span className="text-white font-bold text-xs">System Health</span>} size="small">
        <div className="space-y-1.5 text-white">
          {health.database && (
            <div className="flex items-center justify-between">
              <span className="text-xs">Database:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(health.database.status)}
                <Tag color={getStatusColor(health.database.status)}>{health.database.status.toUpperCase()}</Tag>
              </div>
            </div>
          )}

          {health.redis && (
            <div className="flex items-center justify-between">
              <span className="text-xs">Redis:</span>
              <div className="flex items-center gap-2">
                {getStatusIcon(health.redis.status)}
                <Tag color={getStatusColor(health.redis.status)}>{health.redis.status.toUpperCase()}</Tag>
              </div>
            </div>
          )}

          {health.scheduler && (
            <div className="border-t border-gray-700 pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">Scheduler:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(health.scheduler.status)}
                  <Tag color={getStatusColor(health.scheduler.status)}>{health.scheduler.status.toUpperCase()}</Tag>
                </div>
              </div>
              <div className="text-[10px] text-gray-400 space-y-0.5 ml-4">
                {health.scheduler.lastExecution && <div>Last: {health.scheduler.lastExecution}</div>}
                {health.scheduler.nextScheduledRun && <div>Next: {health.scheduler.nextScheduledRun}</div>}
              </div>
            </div>
          )}

          {health.broadcast && (
            <div className="border-t border-gray-700 pt-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold">Broadcast:</span>
                <Badge status={getStatusColor(health.broadcast.status)} />
              </div>
              <div className="text-[10px] text-gray-400 space-y-0.5 ml-4">
                {health.broadcast.lastDispatch && <div>Last: {health.broadcast.lastDispatch}</div>}
                {health.broadcast.currentInterval && <div>Interval: {health.broadcast.currentInterval}ms</div>}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default SystemHealthBox;
