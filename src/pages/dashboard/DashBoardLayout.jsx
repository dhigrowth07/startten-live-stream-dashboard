import React from "react";
import { Layout, Avatar, Dropdown } from "antd";
import { UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import LiveStreamDashboard from "./LiveStreamDashboard.jsx";

const { Header, Content: AntdContent } = Layout;

const DashBoardLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Navigate to /logout route which will trigger logout
    navigate("/logout");
  };

  const userMenuItems = [
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: handleLogout,
    },
  ];

  return (
    <Layout className="h-screen rounded-lg bg-[#F5F5F5] overflow-hidden shadow-lg p-1">
      <Layout className="md:m-2 m-1 rounded-lg overflow-hidden">
        <Header style={{ background: "#FFFFFF" }} className="flex justify-between items-center px-4 py-4 rounded-lg shadow-md mb-2 min-h-[100px]">
          <div className="flex flex-col">
            <h1 className="text-black md:text-3xl font-bold">Live Streaming Dashboard</h1>
          </div>
          <div className="flex items-center space-x-5">
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={["click"]}>
              <div className="flex items-center space-x-3 bg-[#E2E8F0] px-3 py-2 rounded-lg text-black cursor-pointer hover:bg-[#CBD5E1] transition-colors">
                <Avatar icon={<UserOutlined />} size="large" style={{ backgroundColor: "#3B82F6", marginRight: "8px" }} />
                <span className="text-sm font-medium">Admin</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <AntdContent className="p-4">
          <LiveStreamDashboard />
        </AntdContent>
      </Layout>
    </Layout>
  );
};

export default DashBoardLayout;
