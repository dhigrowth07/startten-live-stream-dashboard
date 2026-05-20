import React from "react";
import { Layout } from "antd";
import LiveStreamDashboard from "../../pages/dashboard/LiveStreamDashboard";

const { Content: AntContent } = Layout;

const Content = ({ selectedMenu }) => {
  let content;
  switch (selectedMenu) {
    case "dashboard":
      content = <LiveStreamDashboard />;
      break;
    default:
      content = <LiveStreamDashboard />;
  }

  return (
    <AntContent className="thumb-control" style={{ padding: "6px", height: "85vh", overflow: "auto" }}>
      {content}
    </AntContent>
  );
};

export default Content;
